const TOPIC_PROGRAMMES = ['Malayalam Speech', 'Kathaprasangam', 'Conversation Malayalam'];

// Store intermediate values while user edits
let pendingRegistration = {
    name: '',
    programmes: []
};

function updateDynamicFields() {
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="programme"]:checked'));
    const container = document.getElementById('dynamicDetailsContainer');

    // Preserve already typed values when checkboxes change
    const currentValues = {};
    document.querySelectorAll('.dynamic-programme-input').forEach(input => {
        const prog = input.getAttribute('data-programme');
        currentValues[prog] = input.value;
    });

    if (checkedBoxes.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    checkedBoxes.forEach((cb, index) => {
        const progName = cb.value;
        const isTopic = TOPIC_PROGRAMMES.includes(progName);
        const labelText = isTopic ? 'Topic' : 'First line of the song';
        const placeholderText = isTopic ? `Enter the topic for ${progName}` : `Enter the first line of the song for ${progName}`;
        const existingVal = currentValues[progName] || '';

        html += `
            <div class="form-group" style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
                <label class="form-label" style="color: #4f46e5; margin-bottom: 0.4rem;">
                    📌 ${progName} — <span style="color: #334155;">${labelText}</span> <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    class="input-box dynamic-programme-input" 
                    data-programme="${progName}"
                    data-label-type="${labelText}"
                    placeholder="${placeholderText}" 
                    value="${escapeHtml(existingVal)}"
                    required 
                    autocomplete="off"
                >
            </div>
        `;
    });

    container.innerHTML = html;
}

function handleProceedToReview(event) {
    event.preventDefault();

    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="programme"]:checked'));

    if (!name) {
        alert('Please enter the participant name.');
        return;
    }

    if (checkedBoxes.length === 0) {
        alert('Please select at least one programme.');
        return;
    }

    const dynamicInputs = document.querySelectorAll('.dynamic-programme-input');
    const programmesList = [];

    for (let input of dynamicInputs) {
        const progName = input.getAttribute('data-programme');
        const detailType = input.getAttribute('data-label-type');
        const val = input.value.trim();

        if (!val) {
            alert(`Please enter the ${detailType.toLowerCase()} for "${progName}".`);
            input.focus();
            return;
        }

        programmesList.push({
            programme: progName,
            detailType: detailType,
            detail: val
        });
    }

    // Save pending registration
    pendingRegistration = {
        name: name,
        programmes: programmesList
    };

    // Render Review Screen
    document.getElementById('reviewName').textContent = name;
    
    const reviewListContainer = document.getElementById('reviewProgrammesList');
    reviewListContainer.innerHTML = programmesList.map((item, idx) => `
        <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 0.6rem;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 0.25rem;">
                ${idx + 1}. ${escapeHtml(item.programme)}
            </div>
            <div style="font-size: 0.9rem; color: #475569;">
                <span style="font-weight: 600; color: #64748b;">${escapeHtml(item.detailType)}:</span> 
                "${escapeHtml(item.detail)}"
            </div>
        </div>
    `).join('');

    // Switch view to Review Card
    document.getElementById('registrationCard').style.display = 'none';
    document.getElementById('reviewCard').style.display = 'block';
}

function backToEdit() {
    // Return to form card without clearing typed values
    document.getElementById('reviewCard').style.display = 'none';
    document.getElementById('registrationCard').style.display = 'block';
}

async function confirmAndSubmit() {
    const finalBtn = document.getElementById('finalSubmitBtn');
    finalBtn.disabled = true;
    finalBtn.textContent = 'Submitting...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pendingRegistration)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Render confirmation details
            document.getElementById('confirmName').textContent = data.registration.name;
            document.getElementById('confirmSlNo').textContent = '#' + data.registration.slNo;

            const confirmListContainer = document.getElementById('confirmProgrammesList');
            confirmListContainer.innerHTML = data.registration.programmes.map((item, idx) => `
                <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 0.5rem; font-size: 0.92rem;">
                    <span style="font-weight: 700; color: #3730a3;">${idx + 1}. ${escapeHtml(item.programme)}</span>
                    <div style="color: #475569; margin-top: 0.2rem;">
                        <strong>[${escapeHtml(item.detailType)}]:</strong> ${escapeHtml(item.detail)}
                    </div>
                </div>
            `).join('');

            // Show confirmation screen
            document.getElementById('reviewCard').style.display = 'none';
            document.getElementById('confirmationBox').style.display = 'block';
        } else {
            alert('Error: ' + (data.error || 'Failed to submit registration.'));
        }
    } catch (error) {
        console.error('Submission failed:', error);
        alert('Failed to connect to the server. Please try again.');
    } finally {
        finalBtn.disabled = false;
        finalBtn.textContent = '✅ Confirm & Submit';
    }
}

function registerAnother() {
    // Reset form and pending state
    document.getElementById('registrationForm').reset();
    document.getElementById('dynamicDetailsContainer').innerHTML = '';
    pendingRegistration = { name: '', programmes: [] };

    // Toggle view back to form
    document.getElementById('confirmationBox').style.display = 'none';
    document.getElementById('registrationCard').style.display = 'block';
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
