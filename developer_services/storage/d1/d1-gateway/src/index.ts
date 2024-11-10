import { Hono } from 'hono';
import { renderHomePage } from './pages/home';
import { renderEditPage } from './pages/edit';


export interface Env {
	MY_TMSQUARE_DATABASE: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Home route: List all movies
app.get('/d1', async (c) => {
  const result = await c.env.MY_TMSQUARE_DATABASE.prepare('SELECT * FROM movies').all();
  const movies = result.results || [];

  return c.html(renderHomePage(movies));
});

// Add a new movie
app.post('/d1/add', async (c) => {
  const formData = await c.req.parseBody();
  const title = formData['title']?.toString();
  const director = formData['director']?.toString();
  const releaseYear = parseInt(formData['release_year']?.toString() || '');
  const genre = formData['genre']?.toString();
  const rating = parseFloat(formData['rating']?.toString() || '');

  if (!title || !director || isNaN(releaseYear) || !genre || isNaN(rating)) {
    return c.text('All fields are required', 400);
  }

  await c.env.MY_TMSQUARE_DATABASE.prepare(
    'INSERT INTO movies (title, director, release_year, genre, rating) VALUES (?, ?, ?, ?, ?)'
  ).bind(title, director, releaseYear, genre, rating).run();

  return c.redirect('/d1');
});

// Edit a movie (GET form pre-filled)
app.get('/d1/edit/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const result = await c.env.MY_TMSQUARE_DATABASE.prepare('SELECT * FROM movies WHERE id = ?').bind(id).first();

  if (!result) {
    return c.text('Movie not found', 404);
  }

  return c.html(renderEditPage(result));
});

// Update a movie
app.post('/d1/update/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const formData = await c.req.parseBody();
  const title = formData['title']?.toString();
  const director = formData['director']?.toString();
  const releaseYear = parseInt(formData['release_year']?.toString() || '');
  const genre = formData['genre']?.toString();
  const rating = parseFloat(formData['rating']?.toString() || '');

  if (!title || !director || isNaN(releaseYear) || !genre || isNaN(rating)) {
    return c.text('All fields are required', 400);
  }

  await c.env.MY_TMSQUARE_DATABASE.prepare(
    'UPDATE movies SET title = ?, director = ?, release_year = ?, genre = ?, rating = ? WHERE id = ?'
  ).bind(title, director, releaseYear, genre, rating, id).run();

  return c.redirect('/d1');
});

// Delete a movie
app.post('/d1/delete/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await c.env.MY_TMSQUARE_DATABASE.prepare('DELETE FROM movies WHERE id = ?').bind(id).run();
  return c.redirect('/d1');
});

export default app;
