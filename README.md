# Hosting Lucas's daily sheet on GitHub

This sheet is a self-contained HTML page. You can host it free on GitHub Pages and have it save every filled-in day back to the same repo as a dated JSON file.

## 1. Create a repo

1. Make a new GitHub repo, e.g. `lucas-daily`. It can be **private**.
2. Drag every file from this `deploy/` folder into the repo root:
   - `index.html`
   - `styles.css`
   - `app.jsx`
   - `tweaks-panel.jsx`
   - the entire `components/` folder
   - `README.md` (this file — optional, just nice to have)

## 2. Turn on GitHub Pages

- Settings → Pages → **Source: Deploy from a branch**, Branch: `main` (root).
- Wait ~30 seconds, then open the Pages URL — it'll look like `https://<your-username>.github.io/<repo>/`.

## 3. Create a fine-grained access token

GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens → Generate new token**:

- **Repository access:** Only select repositories → choose `lucas-daily`.
- **Repository permissions → Contents:** Read and write.
- Expiration: pick what you're comfortable with (90 days is a good cadence).

Copy the token (`github_pat_…`).

## 4. Configure the sheet in the browser

1. Open the hosted page.
2. Click the **GitHub** pill in the top-right.
3. Open the **Settings** tab and fill in:
   - Owner: your GitHub username
   - Repository: `lucas-daily`
   - Branch: `main`
   - Folder: `entries`
   - Token: paste the PAT
4. Switch to the **Save** tab and click **Save to GitHub** (or press ⌘/Ctrl + S).

Each save creates or overwrites `entries/YYYY-MM-DD.json` in the repo. Use the **Load** tab to browse and reload past days.

## Security notes

- The token lives in this browser's `localStorage` only. It is never committed to the repo.
- Anyone with access to this browser profile can read it. Don't enter your token on shared computers.
- Use the **Forget token** button (Settings → Forget my token) when you're done on a borrowed device.
- The token is scoped to one repo with Contents permission only — even if leaked, it can't touch the rest of your GitHub.

## Sharing between parents/caregivers

Each person sets up the page with their own browser and their own token. They all read/write the same JSON files, so the latest save wins for a given day. Try to coordinate (one person updates per shift, then hands off).
