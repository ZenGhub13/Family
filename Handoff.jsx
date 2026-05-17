// GitHub sync — save the current sheet as a dated JSON file to a repo, and reload past entries.
//
// SECURITY MODEL
// - The Personal Access Token never leaves the browser; it's kept in localStorage.
// - Use a fine-grained PAT with Contents: Read & Write on a single repo.
// - Never commit your token to the repo — settings live in localStorage only.

const SETTINGS_KEY = "lucas-daily-gh-settings-v1";

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function todayISO() {
  // YYYY-MM-DD in local time
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Browser-safe base64 of a unicode JSON string
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ""))));
}

async function ghGet(path, settings) {
  const { owner, repo, branch, token } = settings;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return res;
}

async function ghPut(path, settings, content, message, sha) {
  const { owner, repo, branch, token } = settings;
  const body = {
    message: message || `Daily sheet update`,
    content: utf8ToB64(content),
    ...(branch ? { branch } : {}),
    ...(sha ? { sha } : {}),
  };
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });
  return res;
}

function GithubSync() {
  const form = window.useForm();
  const [settings, setSettings] = React.useState(loadSettings);
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState("save"); // save | load | settings
  const [status, setStatus] = React.useState({ kind: "idle", msg: "" });
  const [entries, setEntries] = React.useState(null);
  const [loadDate, setLoadDate] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);

  const isConfigured = settings.owner && settings.repo && settings.token;
  const folder = settings.folder || "entries";
  const branch = settings.branch || "main";

  const updateSetting = (k, v) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    saveSettings(next);
  };

  const datePart = (form.data["meta.date"] || "").trim();
  const filenameDate = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : todayISO();

  async function doSave() {
    if (!isConfigured) {
      setStatus({ kind: "error", msg: "Add your repo + token in Settings first." });
      setTab("settings");
      return;
    }
    setStatus({ kind: "saving", msg: "Saving to GitHub…" });
    const path = `${folder.replace(/^\/+|\/+$/g, "")}/${filenameDate}.json`;
    try {
      // Check if file exists (need sha for update)
      let sha = null;
      const head = await ghGet(path, { ...settings, branch });
      if (head.ok) {
        const j = await head.json();
        sha = j.sha;
      } else if (head.status !== 404) {
        const err = await head.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${head.status}`);
      }

      const payload = {
        savedAt: new Date().toISOString(),
        date: filenameDate,
        baby: "Lucas",
        version: 1,
        data: form.data,
      };

      const res = await ghPut(
        path,
        { ...settings, branch },
        JSON.stringify(payload, null, 2),
        `Lucas daily sheet — ${filenameDate}`,
        sha
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setStatus({ kind: "ok", msg: `Saved to ${path} at ${now}` });
      updateSetting("lastSavedPath", path);
      updateSetting("lastSavedAt", new Date().toISOString());
    } catch (e) {
      setStatus({ kind: "error", msg: e.message || String(e) });
    }
  }

  async function listEntries() {
    if (!isConfigured) {
      setStatus({ kind: "error", msg: "Configure your repo first." });
      setTab("settings");
      return;
    }
    setStatus({ kind: "loading", msg: "Listing entries…" });
    setEntries(null);
    try {
      const res = await ghGet(folder.replace(/^\/+|\/+$/g, ""), { ...settings, branch });
      if (!res.ok) {
        if (res.status === 404) {
          setEntries([]);
          setStatus({ kind: "idle", msg: "No entries yet — save today's to get started." });
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const list = await res.json();
      const items = (Array.isArray(list) ? list : [])
        .filter((f) => f.type === "file" && f.name.endsWith(".json"))
        .map((f) => ({ name: f.name, date: f.name.replace(/\.json$/, ""), path: f.path }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      setEntries(items);
      setStatus({ kind: "idle", msg: `${items.length} entr${items.length === 1 ? "y" : "ies"} on file.` });
    } catch (e) {
      setStatus({ kind: "error", msg: e.message || String(e) });
    }
  }

  async function doLoad(date) {
    if (!date) return;
    setStatus({ kind: "loading", msg: `Loading ${date}…` });
    const path = `${folder.replace(/^\/+|\/+$/g, "")}/${date}.json`;
    try {
      const res = await ghGet(path, { ...settings, branch });
      if (!res.ok) {
        if (res.status === 404) throw new Error(`No entry for ${date}.`);
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const j = await res.json();
      const text = b64ToUtf8(j.content || "");
      const parsed = JSON.parse(text);
      const fields = parsed.data || parsed; // tolerate older shapes
      form.replaceAll(fields);
      setStatus({ kind: "ok", msg: `Loaded ${date}.` });
    } catch (e) {
      setStatus({ kind: "error", msg: e.message || String(e) });
    }
  }

  // Keyboard shortcut: ⌘/Ctrl + S
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings, form.data]);

  // Status pill
  const statusClass = {
    idle: "is-idle",
    saving: "is-busy",
    loading: "is-busy",
    ok: "is-ok",
    error: "is-error",
  }[status.kind] || "is-idle";

  return (
    <React.Fragment>
      {/* Floating launcher */}
      <button className="gh-launcher" onClick={() => setOpen((o) => !o)} aria-label="GitHub sync">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span className="gh-launcher-text">
          {status.kind === "saving" ? "Saving…" :
           status.kind === "loading" ? "Loading…" :
           "GitHub"}
        </span>
        <span className={`gh-dot ${statusClass}`}></span>
      </button>

      {open && (
        <div className="gh-panel" role="dialog" aria-label="GitHub sync">
          <header className="gh-head">
            <div className="gh-title">GitHub sync</div>
            <button className="gh-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </header>

          <nav className="gh-tabs">
            <button className={tab === "save" ? "on" : ""} onClick={() => setTab("save")}>Save</button>
            <button className={tab === "load" ? "on" : ""} onClick={() => { setTab("load"); if (isConfigured && !entries) listEntries(); }}>Load</button>
            <button className={tab === "settings" ? "on" : ""} onClick={() => setTab("settings")}>Settings</button>
          </nav>

          {status.msg && (
            <div className={`gh-status ${statusClass}`}>{status.msg}</div>
          )}

          {tab === "save" && (
            <div className="gh-body">
              <div className="gh-row">
                <span className="gh-row-lbl">Repository</span>
                <span className="gh-row-val">{isConfigured ? `${settings.owner}/${settings.repo}` : <em>not configured</em>}</span>
              </div>
              <div className="gh-row">
                <span className="gh-row-lbl">Branch</span>
                <span className="gh-row-val">{branch}</span>
              </div>
              <div className="gh-row">
                <span className="gh-row-lbl">File path</span>
                <span className="gh-row-val mono">{folder.replace(/^\/+|\/+$/g, "")}/{filenameDate}.json</span>
              </div>
              {settings.lastSavedAt && (
                <div className="gh-row">
                  <span className="gh-row-lbl">Last saved</span>
                  <span className="gh-row-val">{new Date(settings.lastSavedAt).toLocaleString()}</span>
                </div>
              )}
              <button className="gh-primary" disabled={!isConfigured || status.kind === "saving"} onClick={doSave}>
                {status.kind === "saving" ? "Saving…" : "Save to GitHub"}
              </button>
              <p className="gh-hint">Saves all fields as a JSON file named after the date. Saving the same date again overwrites — that's expected; you're capturing today's running state. <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>S</kbd> also works.</p>

              <details className="gh-details">
                <summary>Reset local draft</summary>
                <p className="gh-hint">Clears the in-browser draft and every field on this page. Does not touch the repo.</p>
                <button className="gh-secondary" onClick={() => form.clearAll()}>Clear today's draft</button>
              </details>
            </div>
          )}

          {tab === "load" && (
            <div className="gh-body">
              <div className="gh-load-pick">
                <input
                  type="date"
                  value={loadDate}
                  onChange={(e) => setLoadDate(e.target.value)}
                  className="gh-date-input"
                />
                <button className="gh-secondary" disabled={!loadDate || !isConfigured} onClick={() => doLoad(loadDate)}>Load date</button>
              </div>
              <div className="gh-list-head">
                <span>All entries</span>
                <button className="gh-link" disabled={!isConfigured} onClick={listEntries}>refresh</button>
              </div>
              <div className="gh-list">
                {entries === null && <div className="gh-empty">Click refresh to fetch.</div>}
                {entries && entries.length === 0 && <div className="gh-empty">No entries yet.</div>}
                {entries && entries.map((e) => (
                  <button key={e.path} className="gh-list-item" onClick={() => doLoad(e.date)}>
                    <span className="mono">{e.date}</span>
                    <span className="gh-list-cta">load →</span>
                  </button>
                ))}
              </div>
              <p className="gh-hint">Loading replaces the current draft. Save first if you want to keep today.</p>
            </div>
          )}

          {tab === "settings" && (
            <div className="gh-body">
              <div className="gh-field">
                <label>Owner <span className="gh-field-hint">(GitHub username or org)</span></label>
                <input value={settings.owner || ""} onChange={(e) => updateSetting("owner", e.target.value.trim())} placeholder="e.g. janedoe" />
              </div>
              <div className="gh-field">
                <label>Repository</label>
                <input value={settings.repo || ""} onChange={(e) => updateSetting("repo", e.target.value.trim())} placeholder="e.g. lucas-daily" />
              </div>
              <div className="gh-field gh-field-2">
                <div>
                  <label>Branch</label>
                  <input value={settings.branch || ""} onChange={(e) => updateSetting("branch", e.target.value.trim())} placeholder="main" />
                </div>
                <div>
                  <label>Folder</label>
                  <input value={settings.folder || ""} onChange={(e) => updateSetting("folder", e.target.value.trim())} placeholder="entries" />
                </div>
              </div>
              <div className="gh-field">
                <label>Personal access token</label>
                <div className="gh-token-row">
                  <input
                    type={showToken ? "text" : "password"}
                    value={settings.token || ""}
                    onChange={(e) => updateSetting("token", e.target.value.trim())}
                    placeholder="github_pat_…"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button className="gh-eye" onClick={() => setShowToken((s) => !s)} type="button" aria-label="toggle visibility">
                    {showToken ? "hide" : "show"}
                  </button>
                </div>
              </div>

              <div className="gh-warn">
                <strong>Use a fine-grained token.</strong> Scope it to a single repo with <em>Contents: Read & Write</em>. It's stored only in this browser's localStorage — never committed to your repo. Anyone with access to this browser profile can read it.
              </div>

              <a
                className="gh-link-out"
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noopener"
              >Open GitHub: create a fine-grained token →</a>

              <details className="gh-details">
                <summary>Forget my token</summary>
                <p className="gh-hint">Removes the token from this browser. Repo/branch/folder are kept.</p>
                <button className="gh-secondary" onClick={() => updateSetting("token", "")}>Forget token</button>
              </details>
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

window.GithubSync = GithubSync;
