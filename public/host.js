let allRegistrations = [];

function initFirebaseListener() {
    if (typeof firebase !== 'undefined' && firebase.database) {
        const dbRef = firebase.database().ref('registrations');
        
        // Realtime sync from Firebase
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const list = [];
            let slNo = 1;

            if (data && typeof data === 'object') {
                for (let key in data) {
                    if (data[key]) {
                        list.push({
                            firebaseKey: key,
                            ...data[key],
                            slNo: slNo++
                        });
                    }
                }
            }

            allRegistrations = list;
            filterRegistrations();
        }, (err) => {
            console.warn('Firebase realtime listener error, falling back to REST API:', err);
            fetchRegistrations();
        });
    } else {
        fetchRegistrations();
    }
}

async function fetchRegistrations() {
    try {
        const response = await fetch('/api/registrations');
        if (!response.ok) {
            throw new Error('Failed to fetch registration data.');
        }
        allRegistrations = await response.json();
        filterRegistrations();
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

        const idParam = item.firebaseKey ? `'${item.firebaseKey}'` : item.id;

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
                    <button onclick="deleteRegistration(${idParam})" class="btn-delete" title="Delete Entry">
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

async function deleteRegistration(keyOrId) {
    if (!confirm('Are you sure you want to delete this registration?')) {
        return;
    }

    let deletedLocally = false;

    // Delete from Firebase if key present
    if (typeof firebase !== 'undefined' && firebase.database && typeof keyOrId === 'string') {
        try {
            await firebase.database().ref('registrations/' + keyOrId).remove();
            deletedLocally = true;
        } catch (fbErr) {
            console.warn('Firebase direct delete warning:', fbErr);
        }
    }

    // Also call local API delete endpoint
    try {
        const response = await fetch('/api/registrations/' + keyOrId, { method: 'DELETE' });
        if (response.ok) {
            deletedLocally = true;
        }
    } catch (err) {
        console.warn('Local API delete bypassed:', err);
    }

    if (!deletedLocally && typeof keyOrId !== 'string') {
        alert('Failed to delete entry.');
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

document.addEventListener('DOMContentLoaded', initFirebaseListener);
