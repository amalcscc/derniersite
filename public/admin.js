document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            if (user.role === 'admin') {
                document.getElementById('user-role').textContent = `Connecté en tant que ${user.role}`;
                document.getElementById('admin-content').innerHTML = `<p>Bienvenue, ${user.username} !</p>`;
            } else {
                window.location.href = '/';
            }
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        window.location.href = '/login.html';
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
}); 