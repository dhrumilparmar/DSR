// Predefined report format lives here. Change TEAM / MEMBER_NAME to update the table.
const TEAM = 'Java';
const MEMBER_NAME = 'Dhrumilsinh Parmar';

const HEADERS = [
  'Team',
  'Member Name',
  'Planned Activity',
  'Start Date',
  'ETA',
  'Total Planned Efforts',
  'Time Spent Today',
  'Total Efforts Spent So Far',
  'Status',
];

const NAVY = '#1F4E79';
const CELL_BG = '#F2F2F2';

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// 2026-10-03 -> 3/10/2026 (d/m/yyyy, as in the corporate sheet)
function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (m) return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function validate(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 'Add at least one task.';
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i] || {};
    if (!String(t.activity || '').trim()) return `Task ${i + 1} needs a planned activity.`;
  }
  return null;
}

const border = `border:1px solid ${NAVY};`;
const base = `${border}font-family:Calibri,Arial,sans-serif;font-size:11pt;padding:6px 8px;vertical-align:middle;`;

function buildReport(tasks, isoDate) {
  const date = formatDate(isoDate);
  const rows = tasks.map((t) => ({
    activity: String(t.activity).trim(),
    today: String(t.today ?? '').trim(),
    total: String(t.total ?? '').trim(),
    status: String(t.status ?? '').trim(),
  }));

  const th = HEADERS.map(
    (h) =>
      `<th style="${base}background:#FFFFFF;color:${NAVY};font-weight:bold;text-align:center;">${escapeHtml(h)}</th>`
  ).join('');

  const body = rows
    .map((r, i) => {
      const first = i === 0;
      const span = rows.length;
      const teamCells = first
        ? `<td rowspan="${span}" style="${base}background:${CELL_BG};color:${NAVY};font-weight:bold;text-align:center;">${escapeHtml(TEAM)}</td>` +
          `<td rowspan="${span}" style="${base}background:${CELL_BG};text-align:center;">${escapeHtml(MEMBER_NAME)}</td>`
        : '';
      const activity = escapeHtml(r.activity).replace(
        /\r?\n/g,
        '<br style="mso-data-placement:same-cell;" />'
      );
      const center = `${base}background:${CELL_BG};text-align:center;`;
      return (
        `<tr>${teamCells}` +
        `<td style="${base}background:${CELL_BG};text-align:left;">${activity}</td>` +
        `<td style="${center}">${date}</td>` +
        `<td style="${center}"></td>` +
        `<td style="${center}"></td>` +
        `<td style="${center}color:${NAVY};">${escapeHtml(r.today)}</td>` +
        `<td style="${center}color:${NAVY};">${escapeHtml(r.total)}</td>` +
        `<td style="${center}">${escapeHtml(r.status)}</td>` +
        `</tr>`
      );
    })
    .join('');

  const html =
    `<table style="border-collapse:collapse;border:1px solid ${NAVY};">` +
    `<thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;

  // Plain-text fallback (tab separated) for apps that ignore HTML on paste.
  const tsvCell = (v) => (/[\t\n"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const text = [
    HEADERS.join('\t'),
    ...rows.map((r) =>
      [TEAM, MEMBER_NAME, r.activity, date, '', '', r.today, r.total, r.status].map(tsvCell).join('\t')
    ),
  ].join('\n');

  return { date, html, text };
}

module.exports = { buildReport, validate };
