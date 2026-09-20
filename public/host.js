let allRegistrations = [];

async function fetchRegistrations() {
    try {
        const response = await fetch('/api/registrations');
        if (!response.ok) {
            throw new Error('Failed to fetch registration data.');
        }
        allRegistrations = await response.json();
        renderTable(allRegistrations);
    } catch (err) {
        console.error('Error loading registrations:', err);
        document.getElementById('registrationsTableBody').innerHTML = 
            `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load data from server.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('registrationsTableBody');
    const emptyMsg = document.getElementById('emptyMessage');

    if (!data || data.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';

    tbody.innerHTML = data.map(item => {
        // Handle multi-programme array or legacy single-programme
        const progs = item.programmes || [{ programme: item.programme, detailType: item.detailType, detail: item.detail }];

        const progsHtml = progs.map(p => `
            <span class="programme-tag" style="margin-bottom: 0.25rem; display: inline-block;">
                ${escapeHtml(p.programme)}
            </span>
        `).join(' ');

        const detailsHtml = progs.map(p => `
            <div style="margin-bottom: 0.4rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.3rem;">
                <strong style="color: #4f46e5; font-size: 0.8rem;">[${escapeHtml(p.programme)}]:</strong> 
                <span style="color: #64748b; font-size: 0.8rem;">${escapeHtml(p.detailType)}:</span> 
                <span style="color: #0f172a; font-weight: 600;">"${escapeHtml(p.detail)}"</span>
            </div>
        `).join('');

        return `
            <tr>
                <td style="text-align: center;">
                    <span class="sl-no-badge">${item.slNo}</span>
                </td>
                <td style="font-weight: 700; color: #0f172a;">${escapeHtml(item.name)}</td>
                <td>${progsHtml}</td>
                <td>${detailsHtml}</td>
                <td style="color: #64748b; font-size: 0.88rem;">${escapeHtml(item.registeredAt)}</td>
                <td style="text-align: center;">
                    <button onclick="deleteRegistration(${item.id})" class="btn-delete" title="Delete Entry">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterRegistrations() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedProg = document.getElementById('programmeFilter').value;

    const filtered = allRegistrations.filter(item => {
        const progs = item.programmes || [{ programme: item.programme, detailType: item.detailType, detail: item.detail }];

        const progsText = progs.map(p => p.programme).join(' ').toLowerCase();
        const detailsText = progs.map(p => p.detail).join(' ').toLowerCase();

        const matchesSearch = !search || 
            item.name.toLowerCase().includes(search) || 
            progsText.includes(search) ||
            detailsText.includes(search);

        const matchesProg = !selectedProg || progs.some(p => p.programme === selectedProg);

        return matchesSearch && matchesProg;
    });

    renderTable(filtered);
}

async function deleteRegistration(id) {
    if (!confirm('Are you sure you want to delete this registration?')) {
        return;
    }

    try {
        const response = await fetch('/api/registrations/' + id, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (response.ok && data.success) {
            fetchRegistrations();
        } else {
            alert('Error: ' + (data.error || 'Failed to delete entry.'));
        }
    } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to connect to the server.');
    }
}

function exportCSV() {
    window.location.href = '/api/export';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', fetchRegistrations);
setInterval(fetchRegistrations, 10000);
