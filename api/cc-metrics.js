// /api/cc-metrics — Proxy to Supabase for CC dashboards
// Returns metrics stored by the local update script (update-cc-metrics.mjs)
// No Google credentials needed here — all stored in Supabase

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const project = req.query.project || 'tew';
  const agent = project === 'su' ? 'su_metrics' : 'tew_metrics';

  const SB_URL = 'https://cmdcitqfrzfmeghrvily.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZGNpdHFmcnpmbWVnaHJ2aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTgwMDIsImV4cCI6MjA4NTk3NDAwMn0.wrx599rkgJeSTa4N15DRSn4Tp1_3vrtwx2XF7HEviMo';

  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/agent_tasks?to_agent=eq.${agent}&status=eq.active&order=created_at.desc&limit=50`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const rows = await r.json();
    const data = {};
    for (const row of rows) {
      try {
        const ctx = JSON.parse(row.context || '{}');
        data[row.task] = ctx;
      } catch (e) {}
    }
    res.status(200).json({ ok: true, project, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
