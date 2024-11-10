// src/index.ts
import { Hono } from 'hono';
import { StoragePage } from './pages/storage';
import { ComputePage } from './pages/compute';
import { AIPage } from './pages/ai';
import { AuthPage } from './pages/auth';

import { HomePage } from './pages/home';


const app = new Hono();

app.get('/', (c) => c.html(HomePage()));
app.get('/storage', (c) => c.html(StoragePage()));
app.get('/compute', (c) => c.html(ComputePage()));
app.get('/ai', (c) => c.html(AIPage()));
app.get('/auth', (c) => c.html(AuthPage()));

export default app;
