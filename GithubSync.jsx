// Form store — a single source of truth for every field on the sheet.
// Persists to localStorage on every change so a refresh never wipes the day.
// Exposes `useField` and `useForm` globally for components and GitHub sync.

const FormCtx = React.createContext(null);
const DRAFT_KEY = "lucas-daily-draft-v1";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function FormProvider({ children }) {
  const [data, setData] = React.useState(loadDraft);

  // Debounced write
  const writeTimer = React.useRef(null);
  React.useEffect(() => {
    clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
    }, 200);
    return () => clearTimeout(writeTimer.current);
  }, [data]);

  const setField = React.useCallback((key, value) => {
    setData((d) => {
      if (d[key] === value) return d;
      return { ...d, [key]: value };
    });
  }, []);

  const replaceAll = React.useCallback((next) => {
    setData(next || {});
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next || {})); } catch {}
  }, []);

  const clearAll = React.useCallback(() => {
    if (!confirm("Clear today's draft? This empties every field on the sheet.")) return;
    setData({});
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);

  const value = React.useMemo(() => ({ data, setField, replaceAll, clearAll }), [data, setField, replaceAll, clearAll]);
  return <FormCtx.Provider value={value}>{children}</FormCtx.Provider>;
}

function useField(key, defaultValue = "") {
  const ctx = React.useContext(FormCtx);
  const value = ctx.data[key] !== undefined ? ctx.data[key] : defaultValue;
  const setValue = React.useCallback((v) => ctx.setField(key, v), [ctx, key]);
  return [value, setValue];
}

function useForm() {
  return React.useContext(FormCtx);
}

// Convenience controlled-input wrappers — same API as native, but bound to the store.
function FInput({ field, defaultValue = "", ...rest }) {
  const [value, setValue] = useField(field, defaultValue);
  return <input {...rest} value={value} onChange={(e) => setValue(e.target.value)} />;
}
function FTextarea({ field, defaultValue = "", ...rest }) {
  const [value, setValue] = useField(field, defaultValue);
  return <textarea {...rest} value={value} onChange={(e) => setValue(e.target.value)} />;
}
function FSelect({ field, defaultValue = "", children, ...rest }) {
  const [value, setValue] = useField(field, defaultValue);
  return <select {...rest} value={value} onChange={(e) => setValue(e.target.value)}>{children}</select>;
}
function FCheck({ field, defaultValue = false, ...rest }) {
  const [value, setValue] = useField(field, defaultValue);
  return <input type="checkbox" {...rest} checked={!!value} onChange={(e) => setValue(e.target.checked)} />;
}

Object.assign(window, { FormProvider, FormCtx, useField, useForm, FInput, FTextarea, FSelect, FCheck });
