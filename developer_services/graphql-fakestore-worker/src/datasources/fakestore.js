const { RESTDataSource } = require('apollo-datasource-rest');

class BaseDataSource extends RESTDataSource {
  constructor() {
    super()
    this.endpoint = "";
    this.baseURL = "https://fakestoreapi.com/";
  }

  async getObjects() {
    const response = await fetch(`${this.baseURL}${this.endpoint}`);
    return response.json();
  }

  async getObjectById(id) {
    const response = await fetch(`${this.baseURL}${this.endpoint}/${id}`);
    return response.json();
  }

  async create(entity) {
    const response = await fetch(`${this.baseURL}${this.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entity),
    });
    return response.json();
  }
}

class ProductDataSource extends BaseDataSource {
  constructor() {
    super();
    this.endpoint = "products";
  }
}

class CartDataSource extends BaseDataSource {
  constructor() {
    super();
    this.endpoint = "carts";
  }
}

class UserDataSource extends BaseDataSource {
  constructor() {
    super();
    this.endpoint = "users";
  }
}

module.exports = { ProductDataSource, CartDataSource, UserDataSource }