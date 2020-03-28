const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql`
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
    title: String
    releaseDate: String
    rating: Int
    status: Status
    actor: [Actor] # valid null, [], [...some data withought name or id], x not valid[]
    # actor: [Actor]!
    # actor: [Actor!]! Valid [], [...some data]
    # fake: Float
    # fake2: Boolean
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }
`;

const movies = [
  {
    id: 'gsdajkf',
    title: 'Harry Potter and the Goblet of Fire',
    releaseDate: 6 - 11 - 2005,
    rating: '5'
  },
  {
    id: 'gsdgfarqgf',
    title: 'Harry Potter and the Chamber of Secrets',
    releaseDate: 3 - 11 - 2002,
    rating: '3'
  }
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (obj, { id }, context, info) => {
      console.log('id', id);
      const foundMovie = movies.find(movie => {
        return movie.id === id;
      });
      return foundMovie;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server
  .listen({
    port: process.env.PORT || 4000
  })
  .then(({ url }) => {
    console.log(`Server started at ${url}`);
  });
