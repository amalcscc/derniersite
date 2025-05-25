document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            if (user.role === 'reception') {
                const userRoleElement = document.getElementById('user-role');
                const receptionContentElement = document.getElementById('reception-content');
                
                if (userRoleElement) {
                    userRoleElement.textContent = `Connecté en tant que ${user.role}`;
                }
                if (receptionContentElement) {
                    receptionContentElement.innerHTML = `<p>Bienvenue, ${user.username} !</p>`;
                }
            } else {
                window.location.href = '/';
            }
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/login.html';
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });
} 