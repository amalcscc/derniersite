// DOM Elements
const loginPage = document.getElementById('login-page');
const mainInterface = document.getElementById('main-interface');
const userRole = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const calendar = document.getElementById('calendar');
const timeSlots = document.getElementById('time-slots');
const consultationForm = document.getElementById('consultation-form');
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeModal = document.querySelector('.close');

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            if (user.role === 'dieteticien') {
                showMainInterface(user);
            } else {
                window.location.href = '/';
            }
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Error during logout:', error);
    }
});

function showMainInterface(user) {
    userRole.textContent = `Connecté en tant que ${user.role}`;
    initializeCalendar();
    loadTodayAppointments();
    loadStatistics();
}

// Initialize Calendar
function initializeCalendar() {
    $(calendar).fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        selectable: true,
        select: function(start, end) {
            showTimeSlots(start.format('YYYY-MM-DD'));
        },
        eventRender: function(event, element) {
            if (event.status === 'cancelled') {
                element.css('background-color', '#e74c3c');
            }
        }
    });
}

// Patient Management
async function searchPatient() {
    const searchTerm = document.getElementById('patient-search').value;
    try {
        const response = await fetch(`/api/patients?search=${searchTerm}`);
        const patients = await response.json();
        displayPatients(patients);
    } catch (error) {
        console.error('Error searching patients:', error);
        showNotification('Erreur lors de la recherche des patients', 'error');
    }
}

function displayPatients(patients) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = patients.map(patient => `
        <div class="patient-card">
            <h3>${patient.first_name} ${patient.last_name}</h3>
            <p><i class="fas fa-phone"></i> ${patient.phone || 'Non renseigné'}</p>
            <p><i class="fas fa-envelope"></i> ${patient.email || 'Non renseigné'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${patient.address || 'Non renseignée'}</p>
            <div class="action-buttons">
                <button class="edit-btn" onclick="openEditModal(${patient.id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="archive-btn" onclick="archivePatient(${patient.id})">
                    <i class="fas fa-archive"></i> Archiver
                </button>
            </div>
        </div>
    `).join('');
}

// Appointment Management
async function showTimeSlots(date) {
    try {
        const response = await fetch(`/api/appointments?date=${date}&dieticianId=${getCurrentUserId()}`);
        const appointments = await response.json();
        
        // Generate time slots (9:00 to 17:00)
        const slots = [];
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isBooked = appointments.some(apt => apt.time === time);
                slots.push({ time, isBooked });
            }
        }

        displayTimeSlots(slots, date);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        showNotification('Erreur lors de la récupération des créneaux', 'error');
    }
}

function displayTimeSlots(slots, date) {
    timeSlots.innerHTML = slots.map(slot => `
        <div class="time-slot ${slot.isBooked ? 'unavailable' : ''}" 
             onclick="${!slot.isBooked ? `bookAppointment('${date}', '${slot.time}')` : ''}">
            ${slot.time}
        </div>
    `).join('');
}

async function bookAppointment(date, time) {
    const patientId = await prompt('Entrez l\'ID du patient:');
    if (!patientId) return;

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patient_id: patientId,
                dietician_id: getCurrentUserId(),
                date,
                time
            })
        });

        if (response.ok) {
            showTimeSlots(date);
            showNotification('Rendez-vous ajouté avec succès');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification('Erreur lors de l\'ajout du rendez-vous', 'error');
    }
}

// Consultation Management
async function searchPatientForConsultation() {
    const searchTerm = document.getElementById('consultation-search').value;
    try {
        const response = await fetch(`/api/patients?search=${searchTerm}`);
        const patients = await response.json();
        if (patients.length > 0) {
            showConsultationForm(patients[0]);
        } else {
            showNotification('Aucun patient trouvé', 'error');
        }
    } catch (error) {
        console.error('Error searching patient for consultation:', error);
        showNotification('Erreur lors de la recherche du patient', 'error');
    }
}

function showConsultationForm(patient) {
    consultationForm.style.display = 'block';
    document.getElementById('selected-patient-info').innerHTML = `
        <p><strong>${patient.first_name} ${patient.last_name}</strong></p>
        <p><i class="fas fa-phone"></i> ${patient.phone || 'Non renseigné'}</p>
        <p><i class="fas fa-envelope"></i> ${patient.email || 'Non renseigné'}</p>
    `;
    
    // Enable/disable history button based on patient history
    checkPatientHistory(patient.id);
}

async function checkPatientHistory(patientId) {
    try {
        const response = await fetch(`/api/consultations/${patientId}`);
        const consultations = await response.json();
        historyBtn.disabled = consultations.length === 0;
    } catch (error) {
        console.error('Error checking patient history:', error);
    }
}

// Calculate IMC when PA+ or PB+ changes
document.getElementById('pa-plus').addEventListener('input', calculateIMC);
document.getElementById('pb-plus').addEventListener('input', calculateIMC);

function calculateIMC() {
    const paPlus = parseFloat(document.getElementById('pa-plus').value) || 0;
    const pbPlus = parseFloat(document.getElementById('pb-plus').value) || 0;
    const imc = paPlus / (pbPlus * pbPlus);
    document.getElementById('imc').value = imc.toFixed(2);
}

// Save consultation
document.getElementById('consultation-data-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const patientId = getSelectedPatientId();
    const consultationData = {
        patient_id: patientId,
        pa_plus: document.getElementById('pa-plus').value,
        pb_plus: document.getElementById('pb-plus').value,
        imc: document.getElementById('imc').value,
        compte_rendu: document.getElementById('compte-rendu').value
    };

    try {
        const response = await fetch('/api/consultations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(consultationData)
        });

        if (response.ok) {
            showNotification('Consultation enregistrée avec succès');
            document.getElementById('consultation-data-form').reset();
            loadStatistics();
        }
    } catch (error) {
        console.error('Error saving consultation:', error);
        showNotification('Erreur lors de l\'enregistrement de la consultation', 'error');
    }
});

// Show consultation history
historyBtn.addEventListener('click', async () => {
    const patientId = getSelectedPatientId();
    try {
        const response = await fetch(`/api/consultations/${patientId}`);
        const consultations = await response.json();
        displayConsultationHistory(consultations);
        historyModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading consultation history:', error);
        showNotification('Erreur lors du chargement de l\'historique', 'error');
    }
});

function displayConsultationHistory(consultations) {
    const historyList = document.getElementById('modal-history-list');
    historyList.innerHTML = consultations.map(consultation => `
        <div class="consultation-history-item">
            <div class="consultation-date">
                <i class="fas fa-calendar"></i>
                ${new Date(consultation.created_at).toLocaleDateString()}
            </div>
            <div class="consultation-data">
                <p><strong>PA+:</strong> ${consultation.pa_plus}</p>
                <p><strong>PB+:</strong> ${consultation.pb_plus}</p>
                <p><strong>IMC:</strong> ${consultation.imc}</p>
                <p><strong>Compte Rendu:</strong> ${consultation.compte_rendu}</p>
            </div>
        </div>
    `).join('');
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const stats = await response.json();
        
        document.getElementById('total-patients').textContent = stats.totalPatients;
        document.getElementById('today-appointments').textContent = stats.todayAppointments;
        document.getElementById('monthly-consultations').textContent = stats.monthlyConsultations;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Utility functions
async function getCurrentUserId() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            return user.id;
        }
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

let selectedPatientId = null;

function setSelectedPatientId(id) {
    selectedPatientId = id;
}

function getSelectedPatientId() {
    return selectedPatientId;
}

// Modal close button
closeModal.onclick = function() {
    historyModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == historyModal) {
        historyModal.style.display = 'none';
    }
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
} 