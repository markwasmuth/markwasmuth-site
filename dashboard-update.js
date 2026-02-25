// Task data - will load from tasks.json
const tasksData = {
  council_tasks: [
    {id: "ct-001", task: "Build Make.com Scenario 2", assigned_to: "Allen", status: "in_progress", priority: "high"},
    {id: "ct-002", task: "Marketing Master Plan", assigned_to: "COS", status: "pending", priority: "urgent", due_date: "2026-02-18"},
    {id: "ct-003", task: "SnapToSell Tech Review", assigned_to: "Marcus Steele", status: "pending", priority: "urgent"}
  ],
  mark_tasks: [
    {id: "mt-001", task: "Review Marketing Master Plan", assigned_to: "Mark", status: "pending", priority: "urgent"},
    {id: "mt-002", task: "Review SnapToSell Tech Review", assigned_to: "Mark", status: "pending", priority: "urgent"},
    {id: "mt-003", task: "Decide eVTOL entry strategy", assigned_to: "Mark", status: "pending", priority: "medium"}
  ]
};

// Render task counts for Command Center squares
function updateCommandCenter() {
  const councilActive = tasksData.council_tasks.filter(t => t.status !== 'completed').length;
  const markActive = tasksData.mark_tasks.filter(t => t.status !== 'completed').length;
  
  document.querySelector('.command-stat:nth-child(1) .command-stat-value').textContent = councilActive + markActive;
  document.querySelector('.command-stat:nth-child(3) .command-stat-value').textContent = tasksData.council_tasks.length + tasksData.mark_tasks.length;
}

// Load tasks from JSON
async function loadTasks() {
  try {
    const response = await fetch('./tasks.json');
    if (response.ok) {
      Object.assign(tasksData, await response.json());
      updateCommandCenter();
    }
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTasks);
} else {
  loadTasks();
}

// Auto-refresh every 30 seconds
setInterval(loadTasks, 30000);


// Live API Daily Cost — fetches from Supabase system_state (updated hourly)
(async function loadDailyApiCost() {
  try {
    const res = await fetch('https://cmdcitqfrzfmeghrvily.supabase.co/rest/v1/system_state?key=eq.api_daily_cost&select=value', {
      headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZGNpdHFmcnpmbWVnaHJ2aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTgwMDIsImV4cCI6MjA4NTk3NDAwMn0.wrx599rkgJeSTa4N15DRSn4Tp1_3vrtwx2XF7HEviMo', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZGNpdHFmcnpmbWVnaHJ2aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTgwMDIsImV4cCI6MjA4NTk3NDAwMn0.wrx599rkgJeSTa4N15DRSn4Tp1_3vrtwx2XF7HEviMo' }
    });
    const data = await res.json();
    if (data && data[0]) {
      const v = JSON.parse(data[0].value);
      const costEl = document.getElementById('api-cost-display');
      const callsEl = document.getElementById('api-calls-display');
      if (costEl) costEl.textContent = v.cost || '--';
      if (callsEl) callsEl.textContent = (v.tokens || '--') + ' tokens · ' + (v.date || '');
    }
  } catch(e) { console.warn('API cost fetch failed', e); }
})();
