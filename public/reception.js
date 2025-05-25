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

// State variables for booking process
let selectedAppointmentDate = null;
let selectedAppointmentTime = null;
let selectedDieticianId = null; // We still need dietician selection, adding it back

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        if (response.ok) {
            const user = await response.json();
            console.log('Current user:', user);
            // Assume reception role can access this page
            showMainInterface(user);
            loadDieticians(); // Load dieticians on page load
            initializeCalendar(); // Initialize calendar on page load
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
    // No need to show/hide interfaces based on role, assuming this page is for reception
    if (userRole) {
        userRole.textContent = `Connecté en tant que ${user.username || user.role}`;
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
        // Add default dieticians if API call fails
        const defaultDieticians = [
            { id: 1, username: 'Dr. Marie Laurent' },
            { id: 2, username: 'Dr. Pierre Dubois' },
            { id: 3, username: 'Dr. Sophie Martin' }
        ];
        dieticianSelect.innerHTML = '<option value="">Sélectionner un diététicien...</option>' +
            defaultDieticians.map(d => `<option value="${d.id}">${d.username}</option>`).join('');
        showNotification('Chargement des diététiciens par défaut', 'info');
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
const showAddPatientBtn = document.getElementById('show-add-patient');
const patientFormElement = document.getElementById('patient-form');
if (showAddPatientBtn && patientFormElement) {
    showAddPatientBtn.addEventListener('click', () => {
        patientFormElement.style.display = patientFormElement.style.display === 'none' ? 'block' : 'none';
    });
}

// Add new patient
if (patientFormElement) {
    patientFormElement.addEventListener('submit', async (e) => {
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
                patientFormElement.reset();
                patientFormElement.style.display = 'none';
                searchPatient();
                showNotification('Patient ajouté avec succès');
            } else {
                 const errorData = await response.json();
                 showNotification(`Erreur: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('Error adding patient:', error);
            showNotification('Erreur lors de l'ajout du patient', 'error');
        }
    });
}

// Edit patient modal
const patientModalElement = document.getElementById('patient-modal');
const closeModalElement = document.querySelector('.modal .close');
const editPatientFormElement = document.getElementById('edit-patient-form');

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
            if (patientModalElement) patientModalElement.style.display = 'block';
        }).catch(error => {
            console.error('Error fetching patient for edit:', error);
            showNotification('Erreur lors du chargement du patient', 'error');
        });
}

if (editPatientFormElement) {
    editPatientFormElement.addEventListener('submit', async (e) => {
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
                if (patientModalElement) patientModalElement.style.display = 'none';
                searchPatient();
                showNotification('Patient modifié avec succès');
            } else {
                 const errorData = await response.json();
                 showNotification(`Erreur: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            showNotification('Erreur lors de la modification du patient', 'error');
        }
    });
}

if (closeModalElement && patientModalElement) {
    closeModalElement.onclick = function() {
        patientModalElement.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == patientModalElement) {
            patientModalElement.style.display = 'none';
        }
    }
}

// --- Appointment Booking --- (Update booking logic)

// Step 1: Date Selection (FullCalendar initialized in HTML script tag)

// Handle date selection (called by FullCalendar select callback)
// The selectDate function is now in the HTML script tag to access calendar object

// Step 2: Time Selection
function showTimeSlotsForDate(date) {
    // Generate simple time slots from 8h to 17h
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({ time }); // All slots are initially available in this simple view
    }
    displaySimpleTimeSlots(slots);
}

function displaySimpleTimeSlots(slots) {
    const timeSlotsContainer = document.getElementById('time-slots');
    timeSlotsContainer.innerHTML = `
        <div class="time-slots-list">
            ${slots.map(slot => `
                <button class="time-slot" data-time="${slot.time}">${slot.time}</button>
            `).join('')}
        </div>
    `;

    // Add event listeners to the new time slot buttons
    const timeSlotButtons = timeSlotsContainer.querySelectorAll('.time-slot');
    timeSlotButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            timeSlotButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to the clicked button
            this.classList.add('selected');
            // Enable continue button for time selection
            document.getElementById('continue-time-btn').disabled = false;
            // Store selected time
            selectedAppointmentTime = this.dataset.time;
        });
    });
}

// Function to move from Step 1 (Date) to Step 2 (Time)
// This function is now triggered by the button in Step 1 HTML
function selectDate() {
     if (window.selectedAppointmentDate) {
        // Hide current step
        document.getElementById('step1').classList.remove('active');
        // Show next step
        document.getElementById('step2').classList.add('active');
        // Update progress bar
        document.getElementById('progress-step1').classList.add('completed');
        document.getElementById('progress-step2').classList.add('active');

        // Now that date is selected, show simple time slots
        showTimeSlotsForDate(window.selectedAppointmentDate);
     }
}

// Function to move from Step 2 (Time) to Step 3 (Patient Info)
// This function is triggered by the button in Step 2 HTML
function selectTime() {
     if (selectedAppointmentTime) {
        // Hide current step
        document.getElementById('step2').classList.remove('active');
        // Show next step
        document.getElementById('step3').classList.add('active');
        // Update progress bar
        document.getElementById('progress-step2').classList.add('completed');
        document.getElementById('progress-step3').classList.add('active');
     }
}

// Step 3: Patient Info
// Function to move from Step 3 (Patient Info) to Step 4 (Confirmation)
// Triggered by button in Step 3 HTML
function validatePatientInfo() {
    const patientName = document.getElementById('patient-name').value;
    const patientFirstname = document.getElementById('patient-firstname').value;

    if (!patientName || !patientFirstname) {
        showNotification('Veuillez entrer le nom et le prénom du patient', 'error');
        return;
    }

    // Store patient info
    window.patientInfo = { name: patientName, firstname: patientFirstname };

    // Hide current step
    document.getElementById('step3').classList.remove('active');
    // Show next step
    document.getElementById('step4').classList.add('active');
    // Update progress bar
    document.getElementById('progress-step3').classList.add('completed');
    document.getElementById('progress-step4').classList.add('active');

    // Display summary
    displayAppointmentSummary();
}

// Step 4: Confirmation
function displayAppointmentSummary() {
    document.getElementById('summary-date').textContent = new Date(selectedAppointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('summary-time').textContent = selectedAppointmentTime;
    document.getElementById('summary-patient').textContent = `${window.patientInfo.firstname} ${window.patientInfo.name}`;
}

// Function to confirm and book the appointment (triggered by button in Step 4 HTML)
async function confirmAppointment() {
    // We also need to select a dietician somewhere, maybe add a step 0 or integrate into step 1?
    // For now, let's use a hardcoded dietician or prompt, but this needs proper UI.
    // Let's prompt for dietician ID for now, similar to previous version.
     selectedDieticianId = dieticianSelect.value; // Use the value from the select input
     if (!selectedDieticianId || selectedDieticianId === '') {
         showNotification('Veuillez sélectionner un diététicien d'abord.', 'error');
         // Ideally, this check should be earlier in the process.
         return;
     }

    if (!selectedAppointmentDate || !selectedAppointmentTime || !window.patientInfo) {
        showNotification('Erreur: Informations de rendez-vous manquantes.', 'error');
        return;
    }

    const appointmentData = {
        first_name: window.patientInfo.firstname,
        last_name: window.patientInfo.name,
        dietician_id: selectedDieticianId, // Use the selected dietician ID
        date: selectedAppointmentDate,
        time: selectedAppointmentTime
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },\n            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            showNotification('Rendez-vous validé avec succès');
            // Reset the booking process
            resetBookingSteps();
            // Refresh the list of today's appointments
            loadTodayAppointments(); // Assuming this function exists and fetches today's appointments
        } else {
             const errorData = await response.json();
             showNotification(`Erreur: ${errorData.message}`, 'error');
        }
    } catch (error) {
        console.error('Error validating appointment:', error);
        showNotification('Erreur lors de la validation du rendez-vous', 'error');
    }
}

// Function to navigate back to the previous step
function previousStep(currentStep) {
    // Hide current step
    document.getElementById(`step${currentStep}`).classList.remove('active');
    // Show previous step
    document.getElementById(`step${currentStep - 1}`).classList.add('active');
    // Update progress bar
    document.getElementById(`progress-step${currentStep}`).classList.remove('active');
    document.getElementById(`progress-step${currentStep - 1}`).classList.remove('completed');
    document.getElementById(`progress-step${currentStep - 1}`).classList.add('active');
}

// Function to reset booking steps to initial state
function resetBookingSteps() {
    // Hide all steps except step 1
    for (let i = 2; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.remove('active');
    }
    document.getElementById('step1').classList.add('active');

    // Reset progress bar
     for (let i = 2; i <= 4; i++) {
        document.getElementById(`progress-step${i}`).classList.remove('active', 'completed');
    }
     document.getElementById('progress-step1').classList.add('active');

    // Reset state variables
    selectedAppointmentDate = null;
    selectedAppointmentTime = null;
    window.patientInfo = null;
    selectedDieticianId = null; // Reset dietician selection

    // Reset form fields (patient name/firstname)
    const patientNameInput = document.getElementById('patient-name');
    const patientFirstnameInput = document.getElementById('patient-firstname');
    if(patientNameInput) patientNameInput.value = '';
    if(patientFirstnameInput) patientFirstnameInput.value = '';

    // Reset dietician select
    if(dieticianSelect) dieticianSelect.value = '';

    // Disable continue buttons
    const continueDateBtn = document.getElementById('continue-date-btn');
    if(continueDateBtn) continueDateBtn.disabled = true;
    const continueTimeBtn = document.getElementById('continue-time-btn');
     if(continueTimeBtn) continueTimeBtn.disabled = true;

    // Reset selected date display
     const displaySelectedDate = document.getElementById('display-selected-date');
     if(displaySelectedDate) displaySelectedDate.textContent = 'Aucune date sélectionnée';

    // Clear time slots display
     const timeSlotsContainer = document.getElementById('time-slots');
     if(timeSlotsContainer) timeSlotsContainer.innerHTML = '';
}

// --- Appointment List and Today's Appointments --- (Keep and update display logic)

async function searchAppointments() {
    const date = document.getElementById('appointment-date').value;
    // We need dietician ID for searching appointments
    const dieticianId = dieticianSelect.value; // Using the main dietician select for searching too

    if (!date || !dieticianId || dieticianId === '') {
        showNotification('Veuillez sélectionner une date et un diététicien pour rechercher les rendez-vous', 'error');
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
    const listDiv = document.getElementById('appointment-list-results');
    if (!listDiv) return; // Ensure element exists

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
     if (appointments.length === 0) {
         listDiv.innerHTML = '<p>Aucun rendez-vous trouvé pour cette date et ce diététicien.</p>';
     }
}

async function loadTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
     // We also need dietician ID for loading today's appointments
     const dieticianId = dieticianSelect.value; // Using the main dietician select for today's appointments too

    if (!dieticianId || dieticianId === '') {
        showNotification('Veuillez sélectionner un diététicien pour voir les rendez-vous du jour', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/appointments?date=${today}&dieticianId=${dieticianId}`);
        const appointments = await response.json();
        displayTodayAppointments(appointments);
    } catch (error) {
        console.error('Error loading today's appointments:', error);
        showNotification('Erreur lors du chargement des rendez-vous du jour', 'error');
    }
}

// Update displayTodayAppointments to show in a single line
function displayTodayAppointments(appointments) {
    const todayList = document.getElementById('today-list');
    if (!todayList) return; // Ensure element exists

    todayList.innerHTML = appointments.map(apt => `
        <div class="appointment-item ${apt.status === 'cancelled' ? 'cancelled' : ''}">
            <div class="appointment-summary-line">
                <strong>${apt.time}</strong> - ${apt.first_name} ${apt.last_name}
                ${apt.status === 'cancelled' ? ' (Annulé)' : ''}
            </div>
            <div class="action-buttons">
                <button onclick="validateAppointmentById(${apt.id})" class="btn btn-success btn-sm">
                    <i class="fas fa-check"></i> Valider
                </button>
                <button onclick="cancelAppointment(${apt.id})" class="btn btn-danger btn-sm">
                    <i class="fas fa-times"></i> Annuler
                </button>
            </div>
        </div>
    `).join('');
     if (appointments.length === 0) {
         todayList.innerHTML = '<p>Aucun rendez-vous pour aujourd'hui avec ce diététicien.</p>';
     }
}

// Need a separate function to validate by ID for the list display
async function validateAppointmentById(appointmentId) {
     try {
        const response = await fetch(`/api/appointments/${appointmentId}/validate`, {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('Rendez-vous validé avec succès');
            loadTodayAppointments(); // Refresh the list after validation
        } else {
             const errorData = await response.json();
             showNotification(`Erreur: ${errorData.message}`, 'error');
        }
    } catch (error) {
        console.error('Error validating appointment by ID:', error);
        showNotification('Erreur lors de la validation du rendez-vous', 'error');
    }
}

// Need a function to cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Rendez-vous annulé avec succès');
            // Refresh both lists
            searchAppointments();
            loadTodayAppointments();
        } else {
             const errorData = await response.json();
             showNotification(`Erreur: ${errorData.message}`, 'error');
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showNotification('Erreur lors de l'annulation du rendez-vous', 'error');
    }
}

// Notification system (Keep existing notification code)
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

// Initialize dietician select and load today's appointments on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDieticians();
    // Initial load of today's appointments might need a default dietician selected
    // Or load them after a dietician is selected for the first time.
    // For now, let's add an event listener to the dietician select to load today's appointments
    const dieticianSelectElement = document.getElementById('dietician-select');
    if (dieticianSelectElement) {
        dieticianSelectElement.addEventListener('change', () => {
            loadTodayAppointments();
            searchAppointments(); // Also refresh the general list
        });
    }
}); 