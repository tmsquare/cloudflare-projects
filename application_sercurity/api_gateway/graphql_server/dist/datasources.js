import { RESTDataSource } from '@apollo/datasource-rest';
class BaseDataSource extends RESTDataSource {
    constructor() {
        super(...arguments);
        this.endpoint = "";
        this.baseURL = "https://fakestoreapi.com/";
    }
    async getObjects() {
        return this.get(this.endpoint);
    }
    async getObjectById(id) {
        return this.get(`${this.endpoint}/${id}`);
    }
    async create(entity) {
        const a = this.post('', { body: entity });
        return a;
    }
}
export class ProductDataSource extends BaseDataSource {
    constructor() {
        super();
        this.endpoint = "products";
    }
}
export class CartDataSource extends BaseDataSource {
    constructor() {
        super();
        this.endpoint = "carts";
    }
}
export class UserDataSource extends BaseDataSource {
    constructor() {
        super();
        this.endpoint = "users";
    }
}
