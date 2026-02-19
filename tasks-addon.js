// Task Management Add-on for Smart Brands Mission Control
// Loads tasks from tasks.json and displays Council + Mark task lists

let taskData = {
    council_tasks: [],
    mark_tasks: []
};

// Load tasks from JSON
async function loadTaskData() {
    try {
        const response = await fetch('./tasks.json');
        if (response.ok) {
            taskData = await response.json();
            updateTaskCounts();
        }
    } catch (err) {
        console.error('Failed to load tasks:', err);
    }
}

// Update task counts in Command Center
function updateTaskCounts() {
    // Council tasks
    const councilTotal = taskData.council_tasks.length;
    const councilInProgress = taskData.council_tasks.filter(t => t.status === 'in_progress').length;
    const councilPending = taskData.council_tasks.filter(t => t.status === 'pending').length;
    
    // Mark tasks
    const markTotal = taskData.mark_tasks.length;
    const markInProgress = taskData.mark_tasks.filter(t => t.status === 'in_progress').length;
    const markPending = taskData.mark_tasks.filter(t => t.status === 'pending').length;
    
    document.getElementById('council-task-count').innerHTML = `
        <div style="font-size: 2rem; font-weight: bold;">${councilTotal}</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">
            <span style="color: #3182ce;">⏳ ${councilInProgress}</span> · 
            <span style="color: #dd6b20;">📋 ${councilPending}</span>
        </div>
    `;
    
    document.getElementById('mark-task-count').innerHTML = `
        <div style="font-size: 2rem; font-weight: bold;">${markTotal}</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">
            <span style="color: #3182ce;">⏳ ${markInProgress}</span> · 
            <span style="color: #dd6b20;">📋 ${markPending}</span>
        </div>
    `;
}

// Show Council's Tasks modal
function showCouncilTasks() {
    const modal = document.getElementById('councilTasksModal');
    const content = document.getElementById('councilTasksContent');
    
    const activeTasks = taskData.council_tasks.filter(t => t.status !== 'completed');
    const completedTasks = taskData.council_tasks.filter(t => t.status === 'completed');
    
    let html = `
        <div class="task-section">
            <h3>🔥 Active (${activeTasks.length})</h3>
            ${activeTasks.length === 0 ? '<div class="empty-state">No active tasks</div>' : ''}
            ${activeTasks.map(renderTask).join('')}
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

// Show Mark's Tasks modal
function showMarkTasks() {
    const modal = document.getElementById('markTasksModal');
    const content = document.getElementById('markTasksContent');
    
    const activeTasks = taskData.mark_tasks.filter(t => t.status !== 'completed');
    const completedTasks = taskData.mark_tasks.filter(t => t.status === 'completed');
    
    let html = `
        <div class="task-section">
            <h3>📋 Pending (${activeTasks.length})</h3>
            ${activeTasks.length === 0 ? '<div class="empty-state">No pending tasks</div>' : ''}
            ${activeTasks.map(renderTask).join('')}
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

// Render individual task
function renderTask(task) {
    const priorityColors = {
        urgent: '#ff4444',
        high: '#ff9944',
        medium: '#ffdd44',
        low: '#888'
    };
    const statusColors = {
        pending: '#dd6b20',
        'in_progress': '#3182ce',
        completed: '#38a169'
    };
    
    const color = task.status === 'completed' ? statusColors.completed : priorityColors[task.priority] || '#888';
    const statusLabel = task.status.replace('_', ' ');
    
    return `
        <div class="detail-task" style="border-left: 4px solid ${color};">
            <div class="detail-task-header">
                <span class="detail-task-from">
                    <strong>${task.assigned_to}</strong> 
                    ${task.requested_by ? `· from ${task.requested_by}` : ''}
                    ${task.due_date ? ` · Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}
                </span>
                <span class="status-badge" style="background:${color}20;color:${color};">
                    ${statusLabel}
                </span>
            </div>
            <div class="detail-task-body">${task.task}</div>
            ${task.notes ? `<div class="detail-task-notes" style="font-size:0.85em;color:#888;margin-top:8px;font-style:italic;">${task.notes}</div>` : ''}
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
