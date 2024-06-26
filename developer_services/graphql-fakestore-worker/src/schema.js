const { gql } = require('apollo-server-cloudflare')

module.exports = gql`
  type Query {
    products: [Product],
    productById(id: Int): Product,
    carts: [Cart],
    cartById(id: Int): Cart,
    users: [User],
    userById(id: Int): User,
  }

  type Product {
    id: ID,
    title: String,
    price: Float,
    description: String,
    category: String,
    image: String,
    product_rating: Float,
    ratings_count: Int
  }

  type User {
    id: ID,
    email: String,
    username: String,
    password: String,
    phone: String,
    firstname: String,
    lastname: String,
    lat: String,
    long: String,
    city: String,
    street: String,
    number: Int,
    zipcode: String 
  }

  type Item {
    product: Product,
    quantity: Int
  }

  type Cart {
    id: ID,
    user: User,
    date: String,
    products: [Item]
  }
`

