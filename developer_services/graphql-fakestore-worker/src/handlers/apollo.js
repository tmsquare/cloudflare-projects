const { ApolloServer } = require('apollo-server-cloudflare')
const {
  graphqlCloudflare,
} = require('apollo-server-cloudflare/dist/cloudflareApollo')

const KVCache = require('../kv-cache')
const { ProductDataSource, CartDataSource, UserDataSource } = require('../datasources/fakestore');
const resolvers = require('../resolvers')
const typeDefs = require('../schema')

const dataSources = () => ({
  productAPI: new ProductDataSource(),
  cartAPI: new CartDataSource(),
  userAPI: new UserDataSource(),
})

const kvCache = { cache: new KVCache() }

const createServer = (graphQLOptions) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    dataSources,
    ...(graphQLOptions.kvCache ? kvCache : {}),
  })

const handler = async (request, graphQLOptions) => {
  const server = createServer(graphQLOptions)
  await server.start()
  return graphqlCloudflare(() => server.createGraphQLServerOptions(request))(
    request,
  )
}

module.exports = handler
