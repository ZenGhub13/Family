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
  // Cache-buster to dodge GitHub's contents-API edge cache, which
  // can serve a stale SHA for several seconds after a PUT.
  const bust = `_=${Date.now()}`;
  const ref = branch ? `&ref=${encodeURIComponent(branch)}` : "";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}?${bust}${ref}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "If-None-Match": "", // disable conditional caching
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

    const fetchSha = async () => {
      const head = await ghGet(path, { ...settings, branch });
      if (head.ok) {
        const j = await head.json();
        return j.sha;
      }
      if (head.status === 404) return null;
      const err = await head.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${head.status}`);
    };

    const payload = {
      savedAt: new Date().toISOString(),
      date: filenameDate,
      baby: "Lucas",
      version: 1,
      data: form.data,
    };
    const body = JSON.stringify(payload, null, 2);
    const commitMsg = `Lucas daily sheet — ${filenameDate}`;

    try {
      // Try with the SHA we know; if GitHub says it doesn't match
      // (stale cache or concurrent write), re-fetch and retry once.
      let sha = await fetchSha();
      let res = await ghPut(path, { ...settings, branch }, body, commitMsg, sha);

      if (!res.ok && (res.status === 409 || res.status === 422)) {
        // Conflict — refetch the live SHA and retry.
        await new Promise((r) => setTimeout(r, 400));
        sha = await fetchSha();
        res = await ghPut(path, { ...settings, branch }, body, commitMsg, sha);
      }

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

  // Track unsaved changes
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState(null);
  const currentSnapshot = JSON.stringify(form.data);
  const hasUnsaved = lastSavedSnapshot !== null && lastSavedSnapshot !== currentSnapshot;

  React.useEffect(() => {
    if (status.kind === "ok" && status.msg.startsWith("Saved")) {
      setLastSavedSnapshot(JSON.stringify(form.data));
    }
  }, [status]);

  return (
    <React.Fragment>
      {/* Compound launcher: primary Save + menu */}
      <div className="gh-launcher-group">
        <button
          className="gh-save-btn"
          onClick={isConfigured ? doSave : () => { setOpen(true); setTab("settings"); }}
          disabled={status.kind === "saving"}
          aria-label={isConfigured ? "Save to GitHub" : "Configure GitHub"}
          title={isConfigured ? "Save to GitHub (⌘/Ctrl+S)" : "Set up GitHub sync"}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M2 1.5A1.5 1.5 0 013.5 0h8.379a1.5 1.5 0 011.06.44l2.122 2.12A1.5 1.5 0 0116 3.622V14.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 14.5v-13zM3.5 1a.5.5 0 00-.5.5V6h10V1.5a.5.5 0 00-.146-.354L11.354 1H3.5zM3 7v8h10V7H3zm2 1h6v1H5V8zm0 2h6v1H5v-1z"/>
          </svg>
          <span className="gh-save-text">
            {status.kind === "saving" ? "Saving…" :
             !isConfigured ? "Set up sync" :
             hasUnsaved ? "Save changes" :
             lastSavedSnapshot !== null ? "Saved" :
             "Save to GitHub"}
          </span>
          {hasUnsaved && isConfigured && <span className="gh-unsaved-dot" aria-label="unsaved changes"></span>}
        </button>
        <button
          className="gh-menu-btn"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open sync panel"
          title="Sync settings, load past days"
        >
          <span className={`gh-dot ${statusClass}`}></span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

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
