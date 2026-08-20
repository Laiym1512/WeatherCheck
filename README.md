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

**Per-theme background image:** `bg` holds a full CSS `background`
*shorthand* value, not just a color — for `light` it's plain (`#ffffff`,
just a color), and for `dark` it's
`url('/bg-light.jpg') center / cover no-repeat #121212` (image, position,
size, repeat, and a fallback color, all in one value). That's what lets
`App.scss`'s `.app` rule and `index.scss`'s `body` rule use a single
`background: var(--bg);` declaration instead of five separate
`background-color` / `background-image` / `background-size` /
`background-position` / `background-repeat` properties — the shorthand
already encodes all of them. (`index.scss`'s `body` adds one more line,
`background-attachment: fixed;`, kept separate since folding an attachment
keyword after a `var()` that already contains a full shorthand gets
fragile.)

**Put the actual image file in `public/bg-light.jpg`** (a `public/` folder
at the project root, next to `src/`) — anything in `public/` is served from
the site root as-is in both `npm run dev` and `npm run build`, so the
root-relative `url('/bg-light.jpg')` reference resolves correctly in both.
A `url()` written with a leading `/` that points into `src/` (e.g.
`url('/src/image/bg-light.jpg')`) will work in dev (Vite's dev server
happens to serve the whole project tree) but silently break after
`npm run build`, since only `public/` gets copied into the production
output — that mismatch is why it's worth moving the file rather than just
pointing at its current location.

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

## Weather page

`/weather` (`src/pages/Weather.jsx` + `Weather.module.scss`) is a responsive
weather-widget layout: a search bar, a "Today's Weather" summary, and a
search history list with per-item search/delete actions.

- It calls OpenWeatherMap's free **Current Weather Data** endpoint
  (`https://api.openweathermap.org/data/2.5/weather?q={query}&appid={key}&units=metric`)
  from `handleSubmit` — not the "One Call" API, which needs a separate paid
  subscription and returns a 401 on a free-tier key. Get a free key at
  https://openweathermap.org/appid (new keys can take up to ~2 hours to
  activate), copy `.env.example` to `.env` at the project root, and set
  `VITE_OPENWEATHER_API_KEY=your_key_here`. `.env` is gitignored, so your key
  never gets committed. Vite only exposes env vars prefixed `VITE_` to
  client code, which is why the variable is named that way and read via
  `import.meta.env.VITE_OPENWEATHER_API_KEY`.
- `DEFAULT_TODAY` (top of `Weather.jsx`) is just the initial value of the
  `today` state, shown before any search — it renders without any setup or
  API key, same as before. Submitting the search form fetches real data and
  calls `setToday(...)`, and also prepends a new entry to the `history`
  list via `setHistory(...)`.
- `status` (`'idle' | 'loading' | 'error'`) and `error` track the in-flight
  request: the input and search button disable while `status === 'loading'`,
  and a message appears below the form (`.searchError`) if the fetch fails
  — city not found (404), a bad/inactive key (401), or a missing
  `VITE_OPENWEATHER_API_KEY` are each given a specific message.
- It's responsive at a 576px breakpoint: below that, the weather summary's
  location/condition/humidity/date reflow into a two-column layout and the
  card background goes transparent; above it, they sit in a single row
  inside a translucent card — resize your browser to see it switch.
- It has its own purple color scheme, but it *does* respond to the navbar's
  Dark Mode toggle: `_variables.scss`'s `$themes` map has a `weather-*`
  token per color role (`weather-grad-a/b/c`, `weather-card`,
  `weather-card-solid`, `weather-row`, `weather-button-bg`, `weather-text`,
  `weather-text-muted`, `weather-accent`) for both `light` and `dark`, and
  `Weather.module.scss` references them as `var(--weather-accent)` etc.
  instead of hardcoded colors — light mode keeps the original lavender
  palette, dark mode switches to a deep indigo one. This works for the same
  reason the rest of the app's theming does: `_themes.scss` turns every key
  in the map into a real CSS custom property, so it updates live when
  `ThemeContext` flips `data-theme` on `<html>` — a plain Sass `$variable`
  couldn't do this, since those are resolved once at build time.
- The weather icon has three variants — sunny, rainy, and cloudy — chosen
  by `getWeatherVariant(today.condition)` in `Weather.jsx`. It pattern-matches
  the condition string (works with OpenWeatherMap-style values like `Clear`,
  `Rain`, `Drizzle`, `Thunderstorm`, `Clouds`, ...); all three
  `.weatherGlyph` divs are always rendered and toggled with
  `style={{ display: weatherVariant === '...' ? 'block' : 'none' }}`, so
  submitting a new search and getting a different `condition` back swaps
  the visible icon automatically.
- The sunny variant's rays (`.ray_box` / `.ray1`–`.ray10` in
  `Weather.module.scss`) are plain global CSS classes wrapped in
  `:global { ... }`, not CSS-module-scoped `styles.xxx` classes — that's
  because `Weather.jsx` applies them as literal string classNames rather
  than through the `styles` import. The cloud/rain images are real files at
  `src/image/cloud.svg` / `src/image/rain.svg`, imported normally
  (`import cloudIcon from '../image/cloud.svg'`) so Vite bundles them
  correctly — those two are placeholder icons, swap in your own SVGs at
  the same paths.
- The search/trash icons are still inline SVGs — no icon library dependency.
- Deleting a history entry (`handleDelete`) just removes it from local
  state — it doesn't call any API (OpenWeatherMap has no concept of "your
  history", it's just kept in this page's React state).
- Clicking the search icon next to a history item (`onClick={() =>
  setCountry(item.location)}`) fills the search box with that location but
  doesn't re-run the search automatically — submit the form to fetch it
  again.

## Build

```bash
npm run build
npm run preview
```
