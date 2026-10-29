// The desktop window's heartbeat. The launcher opens this site at
// /?desktop=<id>; while that window is open it beats every 2 s, and when it
// closes the beats stop and the launcher shuts the server down. Ordinary
// visitors (phones, other tabs) never beat.
(() => {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname)) return;
  const q = new URLSearchParams(location.search).get('desktop');
  if (q) sessionStorage.setItem('kosh_sid', q);
  const sid = sessionStorage.getItem('kosh_sid');
  if (!sid) return;
  const beat = () => fetch('/api/desktop/beat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid }), keepalive: true }).catch(() => {});
  beat();
  setInterval(beat, 2000);
  addEventListener('pagehide', () => navigator.sendBeacon('/api/desktop/bye', JSON.stringify({ sid })));
})();
