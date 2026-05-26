import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { guardPlugin } from '@duydang2311/jsbelt/vite';

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), guardPlugin()] });
