import { RESTDataSource } from '@apollo/datasource-rest';

class BaseDataSource extends RESTDataSource {

    endpoint: string = "";
    baseURL: string = "https://fakestoreapi.com/";

    protected async getObjects(): Promise<any> {
        return this.get(this.endpoint);
    }

    protected async getObjectById(id: number): Promise<any> {
        return this.get(`${this.endpoint}/${id}`);
    }

    protected async create(entity: Object): Promise<any> {
        const a = this.post('', { body: entity });
        return a;
    }

}

export class ProductDataSource extends BaseDataSource {
    constructor(){
        super();
        this.endpoint = "products";
    }
}

export class CartDataSource extends BaseDataSource {
    constructor(){
        super();
        this.endpoint = "carts";
    }
}

export class UserDataSource extends BaseDataSource {
    constructor(){
        super();
        this.endpoint = "users";
    }
}