// ISI URL GOOGLE APPS SCRIPT ANDA DI SINI
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFcEd1ZYBs2bg88-xOVyLaInSbTYX3cTtC6k08XWlbKmNr1yczJcio57KoTW2B134qBQ/exec";

function switchForm(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const message = document.getElementById('auth-message');
    message.innerText = '';

    if (type === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
}

// Handler Pendaftaran Akun
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const message = document.getElementById('auth-message');
    const btnRegister = document.getElementById('btn-register');

    if (!username || !password) return;

    message.style.color = '#fdcb6e';
    message.innerText = 'Mendaftarkan akun...';
    btnRegister.disabled = true;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'register',
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            message.style.color = '#00b894';
            message.innerText = 'Pendaftaran berhasil! Silakan login.';
            document.getElementById('register-form').reset();
            setTimeout(() => switchForm('login'), 1500);
        } else {
            message.style.color = '#ff7675';
            message.innerText = data.message;
        }
    } catch (err) {
        message.style.color = '#ff7675';
        message.innerText = 'Terjadi kesalahan koneksi ke server.';
    } finally {
        btnRegister.disabled = false;
    }
});

// Handler Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const message = document.getElementById('auth-message');
    const btnLogin = document.getElementById('btn-login');

    if (!username || !password) return;

    message.style.color = '#fdcb6e';
    message.innerText = 'Memeriksa kredensial...';
    btnLogin.disabled = true;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'login',
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            message.innerText = '';
            showDashboard(data.username);
        } else {
            message.style.color = '#ff7675';
            message.innerText = data.message;
        }
    } catch (err) {
        message.style.color = '#ff7675';
        message.innerText = 'Terjadi kesalahan koneksi ke server.';
    } finally {
        btnLogin.disabled = false;
    }
});

function showDashboard(username) {
    document.getElementById('auth-card').classList.add('hidden');
    document.getElementById('dashboard-card').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Selamat datang, ${username}!`;
    loadLeaderboard();
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat leaderboard...</td></tr>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLeaderboard`);
        const data = await response.json();

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Belum ada data pemain.</td></tr>';
            return;
        }

        data.forEach((item, index) => {
            const row = `<tr>
                <td>${index + 1}</td>
                <td>${item.username}</td>
                <td>${item.score}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Gagal memuat leaderboard.</td></tr>';
    }
}

function logout() {
    document.getElementById('dashboard-card').classList.add('hidden');
    document.getElementById('auth-card').classList.remove('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('auth-message').innerText = '';
}
