export const resolvers = {
    Query: {
        products: async (_, __, { dataSources }) => {
            return dataSources.productAPI.getObjects();
        },
        users: async (_, __, { dataSources }) => {
            return dataSources.userAPI.getObjects();
        },
        carts: async (_, __, { dataSources }) => {
            return dataSources.cartAPI.getObjects();
        },
        productById: async (_, { id }, { dataSources }) => {
            return dataSources.productAPI.getObjectById(id);
        },
        cartById: async (_, { id }, { dataSources }) => {
            return dataSources.cartAPI.getObjectById(id);
        },
        userById: async (_, { id }, { dataSources }) => {
            return dataSources.userAPI.getObjectById(id);
        }
    },
    Product: {
        product_rating: (parent, __, { dataSources }) => {
            return parent.rating.rate;
        },
        ratings_count: (parent, __, { dataSources }) => {
            return parent.rating.count;
        },
    },
    User: {
        firstname: async (parent, __, { dataSources }) => {
            return parent.name.firstname;
        },
        lastname: async (parent, __, { dataSources }) => {
            return parent.name.lastname;
        },
        lat: (parent, __, { dataSources }) => {
            return parent.address.geolocation.lat;
        },
        long: (parent, __, { dataSources }) => {
            return parent.address.geolocation.long;
        },
        city: (parent, __, { dataSources }) => {
            return parent.address.city;
        },
        street: (parent, __, { dataSources }) => {
            return parent.address.street;
        },
        number: (parent, __, { dataSources }) => {
            return parent.address.number;
        },
        zipcode: (parent, __, { dataSources }) => {
            return parent.address.zipcode;
        },
    },
    Item: {
        product: async (parent, __, { dataSources }) => {
            const productId = parent.productId;
            return dataSources.productAPI.getObjectById(productId);
        }
    },
    Cart: {
        user: async (parent, __, { dataSources }) => {
            const userId = parent.userId;
            return dataSources.userAPI.getObjectById(userId);
        },
        products: (parent, __, { dataSources }) => {
            return parent.products;
        }
    }
};
