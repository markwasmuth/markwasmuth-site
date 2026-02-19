// Task Management Add-on for Smart Brands Mission Control
// Loads tasks from Supabase and displays Council + Mark task lists

// Use existing SUPABASE constants if available, otherwise define
const TASK_SUPABASE_URL = window.SUPABASE_URL || 'https://cmdcitqfrzfmeghrvily.supabase.co';
const TASK_SUPABASE_KEY = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZGNpdHFmcnpmbWVnaHJ2aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTgwMDIsImV4cCI6MjA4NTk3NDAwMn0.wrx599rkgJeSTa4N15DRSn4Tp1_3vrtwx2XF7HEviMo';

let taskData = {
    council_tasks: [],
    mark_tasks: []
};

// Load tasks from Supabase
async function loadTaskData() {
    try {
        console.log('[Tasks] Loading from Supabase...');
        const response = await fetch(`${TASK_SUPABASE_URL}/rest/v1/agent_tasks?select=*&order=created_at.desc`, {
            headers: {
                'apikey': TASK_SUPABASE_KEY,
                'Authorization': `Bearer ${TASK_SUPABASE_KEY}`
            }
        });
        if (response.ok) {
            const allTasks = await response.json();
            console.log('[Tasks] Loaded', allTasks.length, 'total tasks');
            
            // Separate Council tasks (allen) and Mark's tasks
            taskData.council_tasks = allTasks.filter(t => t.to_agent === 'allen');
            taskData.mark_tasks = allTasks.filter(t => t.to_agent === 'mark');
            
            console.log('[Tasks] Allen:', taskData.council_tasks.length, 'Mark:', taskData.mark_tasks.length);
            
            updateTaskCounts();
        } else {
            console.error('[Tasks] Failed to load:', response.status, response.statusText);
        }
    } catch (err) {
        console.error('[Tasks] Error:', err);
    }
}

// Update task counts in Command Center
function updateTaskCounts() {
    // Council tasks
    const councilInProgress = taskData.council_tasks.filter(t => t.status === 'in_progress').length;
    const councilPending = taskData.council_tasks.filter(t => t.status === 'pending').length;
    const councilCompleted = taskData.council_tasks.filter(t => t.status === 'done').length;
    
    // Mark tasks
    const markInProgress = taskData.mark_tasks.filter(t => t.status === 'in_progress').length;
    const markPending = taskData.mark_tasks.filter(t => t.status === 'pending').length;
    const markCompleted = taskData.mark_tasks.filter(t => t.status === 'done').length;
    
    console.log('[Tasks] Counts - Council:', {pending: councilPending, inProgress: councilInProgress, done: councilCompleted});
    console.log('[Tasks] Counts - Mark:', {pending: markPending, inProgress: markInProgress, done: markCompleted});
    
    // Council task count - horizontal layout (LEFT TO RIGHT: Pending → In Progress)
    const councilElement = document.getElementById('council-task-count');
    if (!councilElement) {
        console.error('[Tasks] council-task-count element not found');
        return;
    }
    
    councilElement.innerHTML = `
        <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
                <div style="font-size: 3.5rem; font-weight: 700; color: #dd6b20; line-height: 1;">${councilPending}</div>
                <div style="font-size: 0.75rem; color: #8899aa; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Pending</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
                <div style="font-size: 3.5rem; font-weight: 700; color: #3182ce; line-height: 1;">${councilInProgress}</div>
                <div style="font-size: 0.75rem; color: #8899aa; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Working</div>
            </div>
        </div>
    `;
    
    // Mark task count - horizontal layout (LEFT TO RIGHT: Pending → In Progress)
    const markElement = document.getElementById('mark-task-count');
    if (!markElement) {
        console.error('[Tasks] mark-task-count element not found');
        return;
    }
    
    markElement.innerHTML = `
        <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
                <div style="font-size: 3.5rem; font-weight: 700; color: #dd6b20; line-height: 1;">${markPending}</div>
                <div style="font-size: 0.75rem; color: #8899aa; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Pending</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
                <div style="font-size: 3.5rem; font-weight: 700; color: #3182ce; line-height: 1;">${markInProgress}</div>
                <div style="font-size: 0.75rem; color: #8899aa; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">Working</div>
            </div>
        </div>
    `;
}

// Show Council's Tasks modal (ALL STATUSES when clicked)
function showCouncilTasks() {
    console.log('[Tasks] showCouncilTasks called');
    const modal = document.getElementById('councilTasksModal');
    const content = document.getElementById('councilTasksContent');
    
    if (!modal || !content) {
        console.error('[Tasks] Modal elements not found');
        return;
    }
    
    const pendingTasks = taskData.council_tasks.filter(t => t.status === 'pending');
    const inProgressTasks = taskData.council_tasks.filter(t => t.status === 'in_progress');
    const completedTasks = taskData.council_tasks.filter(t => t.status === 'done');
    
    let html = `
        <div class="task-section">
            <h3>📋 Pending (${pendingTasks.length})</h3>
            ${pendingTasks.length === 0 ? '<div class="empty-state">No pending tasks</div>' : ''}
            ${pendingTasks.map(renderTask).join('')}
        </div>
        <div class="task-section">
            <h3>🔥 In Progress (${inProgressTasks.length})</h3>
            ${inProgressTasks.length === 0 ? '<div class="empty-state">No tasks in progress</div>' : ''}
            ${inProgressTasks.map(renderTask).join('')}
        </div>
        <div class="task-section">
            <h3>✅ Completed (${completedTasks.length})</h3>
            ${completedTasks.length === 0 ? '<div class="empty-state">No completed tasks</div>' : ''}
            ${completedTasks.map(renderTask).join('')}
        </div>
    `;
    
    content.innerHTML = html;
    modal.style.display = 'flex';
}

// Show Mark's Tasks modal (ALL STATUSES when clicked)
function showMarkTasks() {
    console.log('[Tasks] showMarkTasks called');
    const modal = document.getElementById('markTasksModal');
    const content = document.getElementById('markTasksContent');
    
    if (!modal || !content) {
        console.error('[Tasks] Modal elements not found');
        return;
    }
    
    const pendingTasks = taskData.mark_tasks.filter(t => t.status === 'pending');
    const inProgressTasks = taskData.mark_tasks.filter(t => t.status === 'in_progress');
    const completedTasks = taskData.mark_tasks.filter(t => t.status === 'done');
    
    let html = `
        <div class="task-section">
            <h3>📋 Pending (${pendingTasks.length})</h3>
            ${pendingTasks.length === 0 ? '<div class="empty-state">No pending tasks</div>' : ''}
            ${pendingTasks.map(renderTask).join('')}
        </div>
        <div class="task-section">
            <h3>🔥 In Progress (${inProgressTasks.length})</h3>
            ${inProgressTasks.length === 0 ? '<div class="empty-state">No tasks in progress</div>' : ''}
            ${inProgressTasks.map(renderTask).join('')}
        </div>
        <div class="task-section">
            <h3>✅ Completed (${completedTasks.length})</h3>
            ${completedTasks.length === 0 ? '<div class="empty-state">No completed tasks</div>' : ''}
            ${completedTasks.map(renderTask).join('')}
        </div>
    `;
    
    content.innerHTML = html;
    modal.style.display = 'flex';
}

// Render individual task (Supabase structure)
function renderTask(task) {
    const priorityColors = {
        urgent: '#ff4444',
        high: '#ff9944',
        medium: '#ffdd44',
        low: '#888'
    };
    const statusColors = {
        pending: '#dd6b20',
        in_progress: '#3182ce',
        done: '#38a169'
    };
    
    const color = task.status === 'done' ? statusColors.done : priorityColors[task.priority] || '#888';
    const statusLabel = task.status.replace('_', ' ');
    
    const fromAgent = task.from_agent || 'system';
    const toAgent = task.to_agent || 'unassigned';
    const created = task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : null;
    
    return `
        <div class="detail-task" style="border-left: 4px solid ${color};">
            <div class="detail-task-header">
                <span class="detail-task-from">
                    <strong>${toAgent}</strong> 
                    ${fromAgent ? `· from ${fromAgent}` : ''}
                    ${dueDate ? ` · Due: ${dueDate}` : ''}
                </span>
                <span class="status-badge" style="background:${color}20;color:${color};">
                    ${statusLabel}
                </span>
            </div>
            <div class="detail-task-body">${task.task}</div>
            ${task.context ? `<div class="detail-task-notes" style="font-size:0.85em;color:#888;margin-top:8px;font-style:italic;">${task.context}</div>` : ''}
            ${created ? `<div style="font-size:0.75em;color:#666;margin-top:8px;">${created}</div>` : ''}
        </div>
    `;
}

// Close modals
function closeCouncilTasks() {
    document.getElementById('councilTasksModal').style.display = 'none';
}

function closeMarkTasks() {
    document.getElementById('markTasksModal').style.display = 'none';
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTaskData);
} else {
    loadTaskData();
}

// Auto-refresh every 30 seconds
setInterval(loadTaskData, 30000);
