// GANTI DENGAN URL GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwy5-sfPiJgFHuRgLanUKjs9vZThqozEkLokkVaGWuylkWXUM34TBNDv9qnTL6mYluMg/execA";

let currentUser = "";
let currentScore = 0;
let currentLevel = 1;
let lives = 5;
let levelTarget = 0;
let caughtInLevel = 0;
let timer = 0;
let gameInterval = null;
let spawnInterval = null;

// JSONP Helper untuk mencegah error CORS
function jsonpRequest(url, params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_cb_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const queryString = Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');

        const script = document.createElement('script');
        script.src = `${url}?${queryString}&callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Gagal terhubung ke server'));
        };
        document.body.appendChild(script);
    });
}

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

// Handler Register
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
        const data = await jsonpRequest(SCRIPT_URL, { action: 'register', username, password });
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
        message.innerText = 'Gagal terhubung ke Google Sheets.';
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
        const data = await jsonpRequest(SCRIPT_URL, { action: 'login', username, password });
        if (data.status === 'success') {
            message.innerText = '';
            currentUser = data.username;
            showDashboard();
        } else {
            message.style.color = '#ff7675';
            message.innerText = data.message;
        }
    } catch (err) {
        message.style.color = '#ff7675';
        message.innerText = 'Gagal terhubung ke Google Sheets.';
    } finally {
        btnLogin.disabled = false;
    }
});

function showDashboard() {
    document.getElementById('auth-card').classList.add('hidden');
    document.getElementById('game-card').classList.add('hidden');
    document.getElementById('dashboard-card').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Selamat datang, ${currentUser}!`;
    loadLeaderboard();
}

async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat leaderboard...</td></tr>';

    try {
        const data = await jsonpRequest(SCRIPT_URL, { action: 'getLeaderboard' });
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
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

// Logic Game 50 Level & 5 Nyawa
function startGame() {
    currentScore = 0;
    currentLevel = 1;
    lives = 5;
    
    document.getElementById('dashboard-card').classList.add('hidden');
    document.getElementById('game-card').classList.remove('hidden');
    
    startLevel();
}

function updateLivesUI() {
    let hearts = "";
    for (let i = 0; i < 5; i++) {
        hearts += i < lives ? "❤️" : "🖤";
    }
    document.getElementById('game-lives').innerText = hearts;
}

function startLevel() {
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    document.getElementById('game-arena').innerHTML = '';

    caughtInLevel = 0;
    levelTarget = 2 + Math.floor(currentLevel * 1.2); // Target meningkat seiring level
    timer = Math.max(5, 12 - Math.floor(currentLevel / 5)); // Waktu makin sempit di level tinggi

    document.getElementById('game-level').innerText = currentLevel;
    document.getElementById('game-score').innerText = currentScore;
    document.getElementById('target-info').innerText = `Tangkap ${levelTarget} hantu!`;
    document.getElementById('game-timer').innerText = timer;
    updateLivesUI();

    // Loop Timer Per Detik
    gameInterval = setInterval(() => {
        timer--;
        document.getElementById('game-timer').innerText = timer;
        if (timer <= 0) {
            handleLevelTimeout();
        }
    }, 1000);

    // Kecepatan Spawn Hantu Makin Cepat Seiring Level
    let spawnSpeed = Math.max(400, 1000 - (currentLevel * 12));
    spawnInterval = setInterval(spawnTarget, spawnSpeed);
}

function spawnTarget() {
    const arena = document.getElementById('game-arena');
    if (!arena) return;

    // Bersihkan objek lama jika terlalu banyak
    if (arena.children.length > 5) {
        arena.removeChild(arena.firstChild);
    }

    const item = document.createElement('div');
    item.classList.add('target-item');

    // Peluang muncul Bom (Rintangan) makin tinggi di level atas
    const isBomb = Math.random() < Math.min(0.4, 0.05 + (currentLevel * 0.01));
    const ghosts = ['👻', '🎃', '🦇', '💀', '🧛'];
    
    if (isBomb) {
        item.innerText = '💣';
    } else {
        item.innerText = ghosts[Math.floor(Math.random() * ghosts.length)];
    }

    const x = Math.random() * (arena.clientWidth - 40);
    const y = Math.random() * (arena.clientHeight - 40);
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;

    item.onclick = () => {
        if (isBomb) {
            lives--;
            updateLivesUI();
            item.remove();
            if (lives <= 0) gameOver();
        } else {
            caughtInLevel++;
            currentScore += (10 * currentLevel);
            document.getElementById('game-score').innerText = currentScore;
            item.remove();

            if (caughtInLevel >= levelTarget) {
                if (currentLevel >= 50) {
                    gameWin();
                } else {
                    currentLevel++;
                    startLevel();
                }
            }
        }
    };

    arena.appendChild(item);

    // Hilangkan objek setelah durasi tertentu
    setTimeout(() => {
        if (item.parentNode === arena) {
            item.remove();
        }
    }, Math.max(600, 1500 - (currentLevel * 18)));
}

function handleLevelTimeout() {
    lives--;
    updateLivesUI();
    if (lives <= 0) {
        gameOver();
    } else {
        alert(`Waktu habis! Nyawa berkurang. Mengulang Level ${currentLevel}`);
        startLevel();
    }
}

async function gameOver() {
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    alert(`GAME OVER! Kamu bertahan hingga Level ${currentLevel} dengan Skor: ${currentScore}`);
    await saveScore();
    showDashboard();
}

async function gameWin() {
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    alert(`SELAMAT! Kamu berhasil menyelesaikan semua 50 LEVEL! Total Skor: ${currentScore}`);
    await saveScore();
    showDashboard();
}

async function saveScore() {
    try {
        await jsonpRequest(SCRIPT_URL, {
            action: 'saveScore',
            username: currentUser,
            score: currentScore
        });
    } catch (e) {
        console.log("Gagal menyimpan skor.");
    }
}

function exitGame() {
    if (confirm("Yakin ingin menyerah dan kembali ke menu utama?")) {
        clearInterval(gameInterval);
        clearInterval(spawnInterval);
        saveScore();
        showDashboard();
    }
}

function logout() {
    currentUser = "";
    document.getElementById('dashboard-card').classList.add('hidden');
    document.getElementById('auth-card').classList.remove('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('auth-message').innerText = '';
}
