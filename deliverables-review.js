// Deliverables Review System for Mission Control
// Allen's output → Mark's review → Knowledge base

const DELIVERABLES_SUPABASE_URL = window.SUPABASE_URL || 'https://cmdcitqfrzfmeghrvily.supabase.co';
const DELIVERABLES_SUPABASE_KEY = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZGNpdHFmcnpmbWVnaHJ2aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTgwMDIsImV4cCI6MjA4NTk3NDAwMn0.wrx599rkgJeSTa4N15DRSn4Tp1_3vrtwx2XF7HEviMo';

let deliverables = [];

// Load deliverables from Supabase
async function loadDeliverables() {
    try {
        console.log('[Deliverables] Loading...');
        const response = await fetch(`${DELIVERABLES_SUPABASE_URL}/rest/v1/deliverables?status=eq.pending&order=priority.desc,created_at.desc`, {
            headers: {
                'apikey': DELIVERABLES_SUPABASE_KEY,
                'Authorization': `Bearer ${DELIVERABLES_SUPABASE_KEY}`
            }
        });
        
        if (response.ok) {
            deliverables = await response.json();
            console.log('[Deliverables] Loaded', deliverables.length, 'pending items');
            updateDeliverableCount();
            return deliverables;
        } else if (response.status === 404) {
            console.log('[Deliverables] Table not created yet - run SQL schema first');
            return [];
        } else {
            console.error('[Deliverables] Failed:', response.status, response.statusText);
            return [];
        }
    } catch (err) {
        console.error('[Deliverables] Error:', err);
        return [];
    }
}

// Update count badge
function updateDeliverableCount() {
    const badge = document.getElementById('deliverables-count');
    if (badge) {
        const highPriority = deliverables.filter(d => d.priority === 'high').length;
        badge.textContent = deliverables.length;
        badge.style.display = deliverables.length > 0 ? 'inline-block' : 'none';

        if (highPriority > 0) {
            badge.style.background = '#ff4444'; // Red for high priority items
        }
    }
    // Sync sidebar review badge
    const sidebarBadge = document.getElementById('sidebar-review-badge');
    if (sidebarBadge) {
        sidebarBadge.textContent = deliverables.length;
        sidebarBadge.style.display = deliverables.length > 0 ? 'inline-block' : 'none';
    }
}

// Show deliverables modal
async function showDeliverables() {
    console.log('[Deliverables] Opening review queue');
    const modal = document.getElementById('deliverablesModal');
    const content = document.getElementById('deliverablesContent');
    
    if (!modal || !content) {
        console.error('[Deliverables] Modal elements not found');
        return;
    }
    
    await loadDeliverables();
    
    if (deliverables.length === 0) {
        content.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;color:#888;">All caught up! No pending deliverables.</div>';
    } else {
        // Group by project
        const grouped = deliverables.reduce((acc, d) => {
            const project = d.project || 'general';
            if (!acc[project]) acc[project] = [];
            acc[project].push(d);
            return acc;
        }, {});
        
        let html = '';
        for (const [project, items] of Object.entries(grouped)) {
            html += `<div class="deliverable-group">
                <h3 style="color:#00d9ff;margin-bottom:15px;">${formatProjectName(project)} (${items.length})</h3>
                ${items.map(renderDeliverable).join('')}
            </div>`;
        }
        content.innerHTML = html;
    }
    
    modal.style.display = 'flex';
}

// Render individual deliverable
function renderDeliverable(d) {
    const priorityColors = {
        high: '#ff4444',
        medium: '#ff9944',
        low: '#888'
    };
    const typeIcons = {
        script: '📝',
        research: '📊',
        design: '🎨',
        report: '📋'
    };
    
    const color = priorityColors[d.priority] || '#888';
    const icon = typeIcons[d.type] || '📄';
    const preview = d.content.length > 200 ? d.content.substring(0, 200) + '...' : d.content;
    
    return `
        <div class="deliverable-card" style="border-left: 4px solid ${color}; margin-bottom: 20px; background: #1a1f2e; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <div style="font-size: 1.2em; font-weight: 600; color: #e0e0e0; margin-bottom: 5px;">
                        ${icon} ${d.title}
                    </div>
                    <div style="font-size: 0.85em; color: #888;">
                        ${d.type} · v${d.version} · ${new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <span style="background: ${color}20; color: ${color}; padding: 4px 12px; border-radius: 4px; font-size: 0.8em; text-transform: uppercase; font-weight: 600;">
                    ${d.priority}
                </span>
            </div>
            
            <div style="background: #0a0e1a; padding: 15px; border-radius: 6px; margin-bottom: 15px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 0.9em; line-height: 1.6; color: #d0d0d0;">
                ${escapeHtml(preview)}
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="viewFullDeliverable('${d.id}')" style="background: #3182ce; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    View Full
                </button>
                <button onclick="approveDeliverable('${d.id}')" style="background: #38a169; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    ✓ Approve
                </button>
                <button onclick="requestChanges('${d.id}')" style="background: #dd6b20; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    ↻ Request Changes
                </button>
                <button onclick="rejectDeliverable('${d.id}')" style="background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    ✗ Reject
                </button>
            </div>
        </div>
    `;
}

// View full deliverable
function viewFullDeliverable(id) {
    const d = deliverables.find(x => x.id === id);
    if (!d) return;
    
    const modal = document.getElementById('fullDeliverableModal');
    const content = document.getElementById('fullDeliverableContent');
    
    if (!modal || !content) {
        // Create modal if it doesn't exist
        const newModal = document.createElement('div');
        newModal.id = 'fullDeliverableModal';
        newModal.className = 'modal';
        newModal.style.display = 'flex';
        newModal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; width: 95%;">
                <span class="modal-close" onclick="closeFullDeliverable()">&times;</span>
                <div id="fullDeliverableContent"></div>
            </div>
        `;
        document.body.appendChild(newModal);
        return viewFullDeliverable(id); // Retry
    }
    
    content.innerHTML = `
        <h2>${d.title}</h2>
        <div style="color: #888; margin-bottom: 20px;">
            ${d.type} · v${d.version} · Created ${new Date(d.created_at).toLocaleString()}
        </div>
        <div style="background: #0a0e1a; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-family: monospace; line-height: 1.8; max-height: 60vh; overflow-y: auto;">
            ${escapeHtml(d.content)}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeFullDeliverable() {
    const modal = document.getElementById('fullDeliverableModal');
    if (modal) modal.style.display = 'none';
}

// Approve deliverable
async function approveDeliverable(id) {
    const feedback = prompt('Optional: Add feedback about what worked well:');
    
    try {
        await fetch(`${DELIVERABLES_SUPABASE_URL}/rest/v1/deliverables?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': DELIVERABLES_SUPABASE_KEY,
                'Authorization': `Bearer ${DELIVERABLES_SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'approved',
                mark_feedback: feedback,
                reviewed_at: new Date().toISOString()
            })
        });
        
        alert('✓ Approved! Allen will upload to Google Drive and archive to knowledge base.');
        showDeliverables(); // Refresh
    } catch (err) {
        alert('Error approving: ' + err.message);
    }
}

// Request changes
async function requestChanges(id) {
    const feedback = prompt('What changes do you need?');
    if (!feedback) return;
    
    try {
        await fetch(`${DELIVERABLES_SUPABASE_URL}/rest/v1/deliverables?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': DELIVERABLES_SUPABASE_KEY,
                'Authorization': `Bearer ${DELIVERABLES_SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'changes_requested',
                mark_feedback: feedback,
                reviewed_at: new Date().toISOString()
            })
        });
        
        alert('↻ Changes requested. Allen will update and resubmit.');
        showDeliverables(); // Refresh
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Reject deliverable
async function rejectDeliverable(id) {
    const feedback = prompt('Why are you rejecting this?');
    if (!confirm('Are you sure? This will permanently reject this deliverable.')) return;
    
    try {
        await fetch(`${DELIVERABLES_SUPABASE_URL}/rest/v1/deliverables?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': DELIVERABLES_SUPABASE_KEY,
                'Authorization': `Bearer ${DELIVERABLES_SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'rejected',
                mark_feedback: feedback,
                reviewed_at: new Date().toISOString()
            })
        });
        
        alert('✗ Rejected.');
        showDeliverables(); // Refresh
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Close modal
function closeDeliverables() {
    const modal = document.getElementById('deliverablesModal');
    if (modal) modal.style.display = 'none';
}

// Helper functions
function formatProjectName(project) {
    const names = {
        'snaptosell': 'SnapToSell',
        'enemy-within': 'The Enemy Within',
        'scripture-unlocked': 'Scripture Unlocked',
        'farm-flow': 'Farm Flow',
        'aeromind': 'AeroMind Ops',
        'be-do-have': 'BE DO HAVE',
        'general': 'General'
    };
    return names[project] || project;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-load on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDeliverables);
} else {
    loadDeliverables();
}

// Auto-refresh every 60 seconds
setInterval(loadDeliverables, 60000);
