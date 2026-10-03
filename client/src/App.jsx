import { useEffect, useRef, useState } from 'react';

const STATUSES = ['Completed', 'In Progress', 'Pending'];
const KEY = 'dwr.tasks.v1';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const newTask = () => ({ id: uid(), activity: '', today: '', total: '', status: 'Completed' });

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return [newTask()];
}

function localISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function prettyDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [result, setResult] = useState(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  const edit = (id, patch) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setStale(true);
    setNote('');
  };
  const addTask = () => { setTasks((ts) => [...ts, newTask()]); setStale(true); };
  const removeTask = (id) => {
    setTasks((ts) => (ts.length > 1 ? ts.filter((t) => t.id !== id) : ts));
    setStale(true);
  };
  const clearAll = () => {
    if (!window.confirm('Clear all tasks?')) return;
    setTasks([newTask()]); setResult(null); setStale(false); setError(''); setNote('');
  };

  async function generate() {
    setError(''); setNote(''); setBusy(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, date: localISO() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate the table.');
      setResult(data); setStale(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyTable() {
    if (!result) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([result.html], { type: 'text/html' }),
            'text/plain': new Blob([result.text], { type: 'text/plain' }),
          }),
        ]);
        setNote('Table copied. Paste it into Excel or your email.');
        return;
      }
    } catch {}
    // Fallback: select the rendered table and copy it.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tableRef.current);
    sel.removeAllRanges(); sel.addRange(range);
    const ok = document.execCommand('copy');
    sel.removeAllRanges();
    setNote(ok ? 'Table copied. Paste it into Excel or your email.' : 'Copy failed. Select the table and press Ctrl+C.');
  }

  return (
    <main className="page">
      <header className="head">
        <h1>Daily work report</h1>
        <p className="date">{prettyDate()}</p>
      </header>

      <section className="panel" aria-label="Tasks">
        <div className="cols" aria-hidden="true">
          <span>Planned activity</span>
          <span>Time spent today (hrs)</span>
          <span>Total efforts so far (hrs)</span>
          <span>Status</span>
          <span />
        </div>

        {tasks.map((t, i) => (
          <div className="task" key={t.id}>
            <textarea
              rows={3}
              placeholder="What did you work on?"
              aria-label={`Task ${i + 1} planned activity`}
              value={t.activity}
              onChange={(e) => edit(t.id, { activity: e.target.value })}
            />
            <input
              type="number" min="0" step="0.5" inputMode="decimal"
              aria-label={`Task ${i + 1} time spent today`}
              value={t.today}
              onChange={(e) => edit(t.id, { today: e.target.value })}
            />
            <input
              type="number" min="0" step="0.5" inputMode="decimal"
              aria-label={`Task ${i + 1} total efforts so far`}
              value={t.total}
              onChange={(e) => edit(t.id, { total: e.target.value })}
            />
            <select
              aria-label={`Task ${i + 1} status`}
              value={t.status}
              onChange={(e) => edit(t.id, { status: e.target.value })}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button
              className="ghost" type="button"
              onClick={() => removeTask(t.id)}
              disabled={tasks.length === 1}
              aria-label={`Remove task ${i + 1}`}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="actions">
          <button className="secondary" type="button" onClick={addTask}>Add task</button>
          <button className="ghost" type="button" onClick={clearAll}>Clear all</button>
          <button className="primary" type="button" onClick={generate} disabled={busy}>
            {busy ? 'Generating…' : 'Generate table'}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {result && (
        <section className="panel result" aria-label="Report table">
          <div className="result-bar">
            <h2>Report for {result.date}</h2>
            <button className="primary" type="button" onClick={copyTable}>Copy table</button>
          </div>
          {stale && <p className="warn">Tasks changed since this table was made. Generate it again.</p>}
          {note && <p className="ok" role="status">{note}</p>}
          <div className="table-scroll">
            <div ref={tableRef} dangerouslySetInnerHTML={{ __html: result.html }} />
          </div>
        </section>
      )}
    </main>
  );
}
