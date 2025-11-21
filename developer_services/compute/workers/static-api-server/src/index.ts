import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

type CloudflareBindings = {}; // Pour le déploiement sur Workers

// --- Données MOCK enrichies ---

let posts = Array.from({ length: 30 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Article ${i + 1}`,
  content: `Ceci est le contenu complet de l'article numéro ${i + 1}.`,
  author: `Auteur ${i % 5 + 1}`,
  tags: ["tech", "dev", "cloud"].slice(0, (i % 3) + 1),
  published: i % 2 === 0,
  createdAt: new Date(Date.now() - i * 86400000).toISOString()
}));

let products = Array.from({ length: 25 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Produit ${i + 1}`,
  description: `Description complète du produit ${i + 1}.`,
  price: +(10 + i * 3.25).toFixed(2),
  category: ["Informatique", "Maison", "Santé", "Sport"][i % 4],
  stock: 50 - i,
  isAvailable: i % 3 !== 0,
  rating: +(3 + Math.random() * 2).toFixed(1)
}));

let users = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Nom Prénom ${i + 1}`,
  email: `user${i + 1}@exemple.com`,
  role: ["admin", "editor", "viewer"][i % 3],
  isActive: i % 4 !== 0,
  createdAt: new Date(Date.now() - i * 43200000).toISOString(),
  lastLogin: new Date(Date.now() - i * 3600000).toISOString()
}));

// --- Helpers génériques ---

function findAndUpdate<T extends { id: string }>(data: T[], id: string, update: Partial<T>) {
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...update };
  return data[index];
}

function findAndDelete<T extends { id: string }>(data: T[], id: string) {
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return false;
  data.splice(index, 1);
  return true;
}

// --- CRUD Registration ---

function registerCrud<T extends { id: string }>(route: string, data: T[]) {
  app.get(route, (c) => c.json(data));

  app.get(`${route}/:id`, (c) => {
    const item = data.find((i) => i.id === c.req.param("id"));
    return item ? c.json(item) : c.notFound();
  });

  app.post(route, async (c) => {
    const body = await c.req.json();
    const newItem = { id: `${Date.now()}`, ...body };
    data.push(newItem);
    return c.json({ message: "Créé avec succès", data: newItem }, 201);
  });

  app.put(`${route}/:id`, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updated = findAndUpdate(data, id, body);
    return updated
      ? c.json({ message: "Mis à jour avec succès", data: updated })
      : c.notFound();
  });

  app.delete(`${route}/:id`, (c) => {
    const deleted = findAndDelete(data, c.req.param("id"));
    return deleted
      ? c.json({ message: "Supprimé avec succès" })
      : c.notFound();
  });
}

// --- Routes pour les entités enrichies ---

registerCrud("/posts", posts);
registerCrud("/products", products);
registerCrud("/users", users);

// --- Route test ---

app.get("/", (c) => {
  return c.text("Hello from TMSQUARE APIs!");
});

export default app;

