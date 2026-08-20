# React Starter

A minimal Vite + React + React Router starter, with Sass (including a
light/dark theme system) and Bootstrap wired up.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Structure

```
src/
  components/       reusable UI (e.g. Navbar)
  context/
    ThemeContext.jsx holds the current theme ('light' | 'dark') and toggleTheme()
  pages/            route-level components (Home, About, Weather, NotFound)
  styles/
    _variables.scss shared Sass variables + the $themes color map
    _themes.scss     generates CSS custom properties from $themes
  App.jsx           routes are defined here
  App.scss          global styles for the app shell, imports variables + themes
  index.scss        global resets/base styles, imported once in main.jsx
  main.jsx          app entry point, wraps App in BrowserRouter + ThemeProvider
```

## Sass

Vite has built-in Sass support — the `sass` package is a devDependency and
nothing else needs configuring.

- Global styles: any `.scss` file imported directly (see `App.scss`,
  `index.scss`). Shared tokens live in `src/styles/_variables.scss` and are
  pulled in with `@use '../styles/variables' as *;`.
- Component-scoped styles: name the file `ComponentName.module.scss` and
  import it as `import styles from './ComponentName.module.scss'`, then use
  `className={styles.someClass}`. See `src/pages/Home.module.scss` for an
  example. Vite compiles `*.module.scss` files as CSS Modules automatically.

## Theme (light / dark)

Click "Dark Mode" / "Light Mode" in the navbar to switch themes. How it works:

1. **`src/styles/_variables.scss`** defines a `$themes` Sass map with color
   tokens (`bg`, `surface`, `text`, `text-muted`, `border`, `border-strong`,
   `primary`) for `light` and `dark`.
2. **`src/styles/_themes.scss`** loops over that map and emits real CSS
   custom properties, scoped like `[data-theme='dark'] { --bg: #121212; ... }`.
   It's `@use`-d once, from `App.scss`.
3. **`src/context/ThemeContext.jsx`** holds `theme` state (persisted to
   `localStorage`, defaulting to the OS's `prefers-color-scheme` on first
   visit) and sets `data-theme="light"` or `data-theme="dark"` on `<html>`
   in a `useEffect`. Because it's on `<html>`, the CSS variables cascade to
   the entire page, not just one component.
4. Styles then just reference `var(--bg)`, `var(--text)`, etc. (see
   `App.scss`, `index.scss`) instead of hardcoded colors.

**Add a new theme:** add a key to the `$themes` map in `_variables.scss`
(e.g. `sepia: (bg: #f4ecd8, ...)`) — `_themes.scss` picks it up
automatically. Then extend `ThemeContext`'s toggle logic (or build a
dropdown instead of a single toggle button) to let users select it.

**Use the theme colors in your own components:** just write
`color: var(--text);` / `background: var(--surface);` etc. in any `.scss`
or `.module.scss` file — no import needed, since the custom properties are
global once `_themes.scss` has been included anywhere in the app.


## Bootstrap

The `bootstrap` package is a regular dependency. Its CSS and JS bundle
(needed for interactive components like dropdowns, modals, and the
navbar toggler) are imported once, at the top of `main.jsx`, before the
app's own `.scss` files — so Bootstrap's styles load first and your own
Sass can still override them:

```jsx
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
```

From there, use any [Bootstrap class](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
directly in JSX, e.g. `className="btn btn-primary"` (see the button in
`src/pages/Home.jsx` and the theme toggle in `src/components/Navbar.jsx`).
No extra Vite config is needed.


## Build

```bash
npm run build
npm run preview
```
