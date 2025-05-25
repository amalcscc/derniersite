// DOM Elements
const loginPage = document.getElementById('login-page');
const mainInterface = document.getElementById('main-interface');
const userRole = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const calendar = document.getElementById('calendar');
const timeSlots = document.getElementById('time-slots');
const patientForm = document.getElementById('patient-form');
const showAddPatientBtn = document.getElementById('show-add-patient');
const dieticianSelect = document.getElementById('dietician-select');
const patientModal = document.getElementById('patient-modal');
const closeModal = document.querySelector('.close');

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        if (response.ok) {
            const user = await response.json();
            console.log('Current user:', user);
            if (user.role === 'reception') {
                showMainInterface(user);
                loadDieticians();
            } else {
                console.warn('Rôle utilisateur non autorisé:', user.role);
                window.location.href = '/login.html';
            }
        } else {
            console.warn('Non authentifié, redirection vers login');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/login.html';
    }
});

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });
}

function showMainInterface(user) {
    if (userRole) {
        userRole.textContent = `Connecté en tant que ${user.role}`;
    }
}

// Load dieticians for selection
async function loadDieticians() {
    try {
        const response = await fetch('/api/users?role=dieteticien');
        const dieticians = await response.json();
        dieticianSelect.innerHTML = '<option value="">Sélectionner un diététicien...</option>' +
            dieticians.map(d => `<option value="${d.id}">${d.username}</option>`).join('');
    } catch (error) {
        console.error('Error loading dieticians:', error);
        showNotification('Erreur lors du chargement des diététiciens', 'error');
    }
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
            </div>
        </div>
    `).join('');
}

// Show/Hide Add Patient Form
if (showAddPatientBtn) {
    showAddPatientBtn.addEventListener('click', () => {
        const form = document.getElementById('patient-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
}

// Add new patient
if (patientForm) {
    patientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientData = {
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value
        };

        try {
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });

            if (response.ok) {
                patientForm.reset();
                patientForm.style.display = 'none';
                searchPatient();
                showNotification('Patient ajouté avec succès');
            }
        } catch (error) {
            console.error('Error adding patient:', error);
            showNotification('Erreur lors de l\'ajout du patient', 'error');
        }
    });
}

// Edit patient
function openEditModal(patientId) {
    fetch(`/api/patients/${patientId}`)
        .then(response => response.json())
        .then(patient => {
            document.getElementById('edit-patient-id').value = patient.id;
            document.getElementById('edit-first-name').value = patient.first_name;
            document.getElementById('edit-last-name').value = patient.last_name;
            document.getElementById('edit-phone').value = patient.phone;
            document.getElementById('edit-email').value = patient.email;
            document.getElementById('edit-address').value = patient.address;
            patientModal.style.display = 'block';
        });
}

// Edit patient form submission
document.getElementById('edit-patient-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const patientId = document.getElementById('edit-patient-id').value;
    const patientData = {
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        phone: document.getElementById('edit-phone').value,
        email: document.getElementById('edit-email').value,
        address: document.getElementById('edit-address').value
    };

    try {
        const response = await fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            patientModal.style.display = 'none';
            searchPatient();
            showNotification('Patient modifié avec succès');
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        showNotification('Erreur lors de la modification du patient', 'error');
    }
});

// Appointment Management
function searchDietician() {
    const dieticianId = dieticianSelect.value;
    if (!dieticianId) {
        showNotification('Veuillez sélectionner un diététicien', 'error');
        return;
    }
    document.getElementById('calendar-container').style.display = 'block';
    initializeCalendar(dieticianId);
}

function initializeCalendar(dieticianId) {
    $(calendar).fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        selectable: true,
        select: function(start) {
            showTimeSlots(start.format('YYYY-MM-DD'), dieticianId);
        },
        eventRender: function(event, element) {
            if (event.status === 'cancelled') {
                element.css('background-color', '#e74c3c');
            }
        }
    });
}

async function showTimeSlots(date, dieticianId) {
    try {
        const response = await fetch(`/api/appointments?date=${date}&dieticianId=${dieticianId}`);
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

        displayTimeSlots(slots, date, dieticianId);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        showNotification('Erreur lors de la récupération des créneaux', 'error');
    }
}

function displayTimeSlots(slots, date, dieticianId) {
    timeSlots.innerHTML = slots.map(slot => `
        <div class="time-slot ${slot.isBooked ? 'unavailable' : ''}" 
             onclick="${!slot.isBooked ? `bookAppointment('${date}', '${slot.time}', ${dieticianId})` : ''}">
            ${slot.time}
        </div>
    `).join('');
}

async function bookAppointment(date, time, dieticianId) {
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
                dietician_id: dieticianId,
                date,
                time
            })
        });

        if (response.ok) {
            showTimeSlots(date, dieticianId);
            showNotification('Rendez-vous ajouté avec succès');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification('Erreur lors de l\'ajout du rendez-vous', 'error');
    }
}

async function searchAppointments() {
    const date = document.getElementById('appointment-date').value;
    const dieticianId = dieticianSelect.value;
    if (!date || !dieticianId) {
        showNotification('Veuillez sélectionner une date et un diététicien', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/appointments?date=${date}&dieticianId=${dieticianId}`);
        const appointments = await response.json();
        displayAppointments(appointments);
    } catch (error) {
        console.error('Error searching appointments:', error);
        showNotification('Erreur lors de la recherche des rendez-vous', 'error');
    }
}

function displayAppointments(appointments) {
    const listDiv = document.getElementById('appointment-list');
    listDiv.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <h3>${apt.first_name} ${apt.last_name}</h3>
            <p><i class="fas fa-calendar"></i> ${apt.date}</p>
            <p><i class="fas fa-clock"></i> ${apt.time}</p>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editAppointment(${apt.id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="cancel-btn" onclick="cancelAppointment(${apt.id})">
                    <i class="fas fa-times"></i> Annuler
                </button>
            </div>
        </div>
    `).join('');
}

async function editAppointment(appointmentId) {
    // Show calendar for rescheduling
    $(calendar).fullCalendar('today');
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            searchAppointments();
            showNotification('Rendez-vous annulé avec succès');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showNotification('Erreur lors de l\'annulation du rendez-vous', 'error');
    }
}

async function loadTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const dieticianId = dieticianSelect.value;
    if (!dieticianId) {
        showNotification('Veuillez sélectionner un diététicien', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/appointments?date=${today}&dieticianId=${dieticianId}`);
        const appointments = await response.json();
        displayTodayAppointments(appointments);
    } catch (error) {
        console.error('Error loading today\'s appointments:', error);
        showNotification('Erreur lors du chargement des rendez-vous du jour', 'error');
    }
}

function displayTodayAppointments(appointments) {
    const todayList = document.getElementById('today-list');
    todayList.innerHTML = appointments.map(apt => `
        <div class="appointment-item ${apt.status === 'cancelled' ? 'cancelled' : ''}">
            <div>
                <strong>${apt.time}</strong> - ${apt.first_name} ${apt.last_name}
            </div>
            <div class="action-buttons">
                <button onclick="validateAppointment(${apt.id})">
                    <i class="fas fa-check"></i> Valider
                </button>
                <button onclick="cancelAppointment(${apt.id})">
                    <i class="fas fa-times"></i> Annuler
                </button>
            </div>
        </div>
    `).join('');
}

async function validateAppointment(appointmentId) {
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/validate`, {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('Rendez-vous validé avec succès');
            loadTodayAppointments();
        }
    } catch (error) {
        console.error('Error validating appointment:', error);
        showNotification('Erreur lors de la validation du rendez-vous', 'error');
    }
}

// Modal close button
if (closeModal) {
    closeModal.onclick = function() {
        patientModal.style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target == patientModal) {
        patientModal.style.display = 'none';
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