# Workout Tracker (Static SPA)

A simple, GitHub Pages–friendly workout tracker inspired by Flex Wheeler's split. No build step required.

## Live site

Once GitHub Actions completes, your site will be available at:

- https://joejoemojoe.github.io/Workout-Tracker/

## Local run

Open the static app directly in your browser:

- `public/index.html`

Everything runs client-side and stores data in `localStorage` under the key `workout-tracker-logs-v1`.

## Deploy (GitHub Pages)

This repo includes a workflow at `.github/workflows/pages.yml` that publishes the `public/` folder to the `gh-pages` branch on every push to `main`.

- No Node or build step is required.
- If the site doesn’t update, check the Actions tab for the job "Deploy static site to GitHub Pages".

## Notes

- The React/Vite scaffold remains in `src/` but is not used by the static app. Pages serves from `public/`.
- The root `index.html` simply redirects to `public/` to avoid loading JSX on Pages.
- You can safely remove the `src/`, `vite.config.js`, and `package.json` later if you decide to keep only the static app.
