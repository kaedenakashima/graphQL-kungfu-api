const { ApolloServer, gql, PubSub } = require('apollo-server');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const mongoose = require('mongoose');

mongoose.connect(
  'mongodb+srv://Katie102:PkbwPDDnq6al9muw@contactkeeper-8o5ps.mongodb.net/test?retryWrites=true&w=majority',
  { useNewUrlParser: true }
);
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String]
});

const Movie = mongoose.model('Movie', movieSchema);

// gql`` parses your string into an AST

const typeDefs = gql`
  scalar Date
  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID!
    title: String!
    releaseDate: Date
    rating: Int
    status: Status
    actor: [Actor]
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }

  input ActorInput {
    id: ID
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
  }
`;

const actors = [
  {
    id: 'Harry Potter',
    name: 'Daniel Radcliffe'
  },
  {
    id: 'Newton Scamander',
    name: 'Eddie Redmayne'
  }
];

const movies = [
  {
    id: 'Harry Potter4',
    title: 'Harry Potter and the Goblet of Fire',
    releaseDate: new Date('06-11-2005'),
    rating: '5',
    actor: [
      {
        id: 'Harry Potter'
      }
    ]
  },
  {
    id: 'Fantastic Beasts1',
    title: 'Fantastic Beasts and Where to Find Them',
    releaseDate: new Date('10-11-2016'),
    rating: '3',
    actor: [
      {
        id: 'Newton Scamander'
      }
    ]
  }
];

const pubsub = new PubSub();
const MOVIE_ADDED = 'MOVIE_ADDED';

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
    }
  },
  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find();
        return allMovies;
      } catch (e) {
        console.log('e', e);
        return [];
      }
    },

    movie: async (obj, { id }) => {
      try {
        const foundMovie = await Movie.findById(id);
        return foundMovie;
      } catch (e) {
        console.log('e', e);
        return {};
      }
    }
  },

  Movie: {
    actor: (obj, arg, context) => {
      // DB call
      const actorIds = obj.actor.map(actor => actor.id);
      const filteredActors = actors.filter(actor => {
        return actorIds.includes(actor.id);
      });
      return filteredActors;
    }
  },

  Mutation: {
    addMovie: async (obj, { movie }, { userId }) => {
      try {
        if (userId) {
          // Do mutation and of db stuff
          const newMovie = await Movie.create({
            ...movie
          });
          pubsub.publish(MOVIE_ADDED, { movieAdded: newMovie });
          const allMovies = await Movie.find();
          return allMovies;
        }
        return movies;
      } catch (e) {
        console.log('e', e);
        return [];
      }
    }
  },

  Date: new GraphQLScalarType({
    name: 'Date',
    description: "it's a date, deal with it",
    parseValue(value) {
      //value from the client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the client
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    }
  })
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    const fakeUser = {
      userId: 'helloImauser'
    };
    return {
      ...fakeUser
    };
  }
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('database connected😆 🍔');
});

server
  .listen({
    port: process.env.PORT || 4000
  })
  .then(({ url }) => {
    console.log(`Server started at ${url}`);
  });
