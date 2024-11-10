import { html } from 'hono/html';
import { NavBar } from '../components/NavBar';
import { Styles } from '../components/styles';
import { Scripts } from '../components/script';

export const HomePage = () => html`
 ${Styles()}
 ${Scripts()}
 ${NavBar()}
 <h1> </h1>
 <h1 style="text-align: center; font-size: 1.75rem; margin-top: 1rem;">Welcome to the Tmsquare's Lab: Cloudflare's Dev Platform</h1>
`;
