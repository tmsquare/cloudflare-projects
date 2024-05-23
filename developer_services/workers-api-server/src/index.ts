import { Hono } from 'hono';
import { Client, fql, ServiceError } from 'fauna';

type Bindings = {
  FAUNA_SECRET: string;
};

type Variables = {
  faunaClient: Client;
};

type Product = {
  id: string;
  serialNumber: number;
  title: string;
  weightLbs: number;
  quantity: number;
};

type User = {
  id: string;
  firstname: string;
  lastname: string;
  age: number;
  email: string;
};

type Post = {
  id: string;
  title: string;
  text: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', async (c, next) => {
  const faunaClient = new Client({
    secret: c.env.FAUNA_SECRET,
  });
  c.set('faunaClient', faunaClient);
  await next();
});

app.get('/', (c) => {
  return c.text('Welcome to Photograver API store. You can do CRUD operations on these endpoints: /products, /users & /posts');
});

// PRODUCTS
app.get('/products', async (c) => {
  const query = fql`Products.all()`;
  const result = await c.var.faunaClient.query<Product>(query);
  return c.json(result.data);
});

app.post('/products', async (c) => {
  const { serialNumber, title, weightLbs } = await c.req.json<Omit<Product, 'id'>>();
  const query = fql`Products.create({
    serialNumber: ${serialNumber},
    title: ${title},
    weightLbs: ${weightLbs},
    quantity: 0
  })`;
  const result = await c.var.faunaClient.query<Product>(query);
  return c.json(result.data);
});

app.get('/products/:productId', async (c) => {
  const productId = c.req.param('productId');
  const query = fql`Products.byId(${productId})`;
  const result = await c.var.faunaClient.query<Product>(query);
  return c.json(result.data);
});

app.delete('/products/:productId', async (c) => {
  const productId = c.req.param('productId');
  const query = fql`Products.byId(${productId})!.delete()`;
  const result = await c.var.faunaClient.query<Product>(query);
  return c.json(result.data);
});

// USERS
app.get('/users', async (c) => {
  const query = fql`Users.all()`;
  const result = await c.var.faunaClient.query<User>(query);
  return c.json(result.data);
});

app.post('/users', async (c) => {
  const { firstname, lastname, age, email } = await c.req.json<Omit<User, 'id'>>();
  const query = fql`Users.create({
    firstname: ${firstname},
    lastname: ${lastname},
    age: ${age},
    email: ${email}
  })`;
  const result = await c.var.faunaClient.query<User>(query);
  return c.json(result.data);
});

app.get('/users/:userId', async (c) => {
  const userId = c.req.param('userId');
  const query = fql`Users.byId(${userId})`;
  const result = await c.var.faunaClient.query<User>(query);
  return c.json(result.data);
});

app.delete('/users/:userId', async (c) => {
  const userId = c.req.param('userId');
  const query = fql`Users.byId(${userId})!.delete()`;
  const result = await c.var.faunaClient.query<User>(query);
  return c.json(result.data);
});

// POSTS
app.get('/posts', async (c) => {
  const query = fql`Posts.all()`;
  const result = await c.var.faunaClient.query<Post>(query);
  return c.json(result.data);
});


app.post('/posts', async (c) => {
  const { title, text } = await c.req.json<Omit<Post, 'id'>>();
  const query = fql`Posts.create({
    title: ${title},
    text: ${text}
  })`;
  const result = await c.var.faunaClient.query<Post>(query);
  return c.json(result.data);
});

app.get('/posts/:postId', async (c) => {
  const postId = c.req.param('postId');
  const query = fql`Posts.byId(${postId})`;
  const result = await c.var.faunaClient.query<Post>(query);
  return c.json(result.data);
});

app.delete('/posts/:postId', async (c) => {
  const postId = c.req.param('postId');
  const query = fql`Posts.byId(${postId})!.delete()`;
  const result = await c.var.faunaClient.query<Post>(query);
  return c.json(result.data);
});

app.onError((e, c) => {
  if (e instanceof ServiceError) {
    return c.json(
      {
        status: e.httpStatus,
        code: e.code,
        message: e.message,
      },
      e.httpStatus
    );
  }
  console.trace(e);
  return c.text('Internal Server Error', 500);
});



export default app;