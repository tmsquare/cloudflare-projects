import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { resolvers } from './resolvers.js';
import { ProductDataSource, CartDataSource, UserDataSource } from './datasources.js';
import cors from 'cors'
import express from 'express';
import http from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';

interface ContextValue {
  dataSources: {
    cartAPI: CartDataSource,
    productAPI: ProductDataSource,
    userAPI: UserDataSource
  };
}

const app = express();
const httpServer = http.createServer(app);

// we must convert the file Buffer to a UTF-8 string
const typeDefs = readFileSync('schema.graphql', 'utf8');

const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

await server.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>({ origin: ['*'] }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => { 
      return {
        dataSources: {
          cartAPI: new CartDataSource(),
          productAPI: new ProductDataSource(),
          userAPI: new UserDataSource(),
        },
      };
    },
  }),
);

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));

export default httpServer;

console.log(`🚀 Server ready at http://localhost:4000/`);