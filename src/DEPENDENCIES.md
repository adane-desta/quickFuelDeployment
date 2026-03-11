# Required Dependencies for QuickFuel

## Core Dependencies

Make sure your `package.json` includes these dependencies:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router": "^6.21.0",
    "sonner": "^2.0.3",
    "lucide-react": "latest",
    "recharts": "^2.10.0",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-slot": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## Installation Command

```bash
npm install @supabase/supabase-js react-router sonner lucide-react recharts
```

## Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://djfzgxnquxzbnxfjvkcp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZnpneG5xdXh6Ym54Zmp2a2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NjQ0MzIsImV4cCI6MjA1NzI0MDQzMn0.CnK4ZFJDEvpOgwKVV42qHQ_dGWzyb92
```

## TypeScript Configuration

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Vite Configuration

Your `vite.config.ts` should look like:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

## Tailwind Configuration

Your `tailwind.config.js` for Tailwind v4:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## PostCSS Configuration

Your `postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Quick Setup

If starting fresh:

```bash
# Install all dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## Troubleshooting

### Module not found errors?
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors?
```bash
npm install --save-dev @types/node
```

### Tailwind not working?
Make sure you have `@import 'tailwindcss';` in your main CSS file.

### Supabase errors?
1. Check .env.local exists and has correct values
2. Verify VITE_ prefix on all environment variables
3. Restart dev server after changing .env

## Verify Installation

Run this command to check all dependencies are installed:

```bash
npm list @supabase/supabase-js react-router sonner
```

You should see all packages listed without errors.
