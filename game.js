```javascript
"use strict";


/* =====================================================
   GHOST HUNTER
   2D HTML5 Canvas Game

   PC:
   WASD / Arrow = movement
   SPACE = shoot

   Android:
   D-Pad + flashlight button
   ===================================================== */


/* =====================================================
   GOOGLE APPS SCRIPT URL
   ===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycbxE3vlHdwU8BD4t4fyfw-Tog8gakfAZNLevJyPdTfyO4iMHLezN-H254mf84Uu3fgZd/exec";


/* =====================================================
   DOM
   ===================================================== */

const loginScreen =
    document.getElementById("loginScreen");

const gameScreen =
    document.getElementById("gameScreen");

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =====================================================
   GAME STATE
   ===================================================== */

let currentUser = null;

let gameRunning = false;

let score = 0;
let coins = 0;
let level = 1;
let hp = 100;
let highScore = 0;

let lastTime = 0;

let saveTimer = null;


/* =====================================================
   OBJECTS
   ===================================================== */

const player = {

    x: 0,
    y: 0,

    radius: 20,

    speed: 260,

    shootCooldown: 0

};

let ghosts = [];
let bullets = [];
let particles = [];


/* =====================================================
   INPUT
   ===================================================== */

const keys = {

    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false

};


/* =====================================================
   RESIZE
   ===================================================== */

function resizeCanvas() {

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        Math.floor(
            window.innerWidth * dpr
        );

    canvas.height =
        Math.floor(
            window.innerHeight * dpr
        );

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =====================================================
   KEYBOARD
   ===================================================== */

window.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (
            key === "w" ||
            key === "arrowup"
        ) {
            keys.up = true;
        }

        if (
            key === "s" ||
            key === "arrowdown"
        ) {
            keys.down = true;
        }

        if (
            key === "a" ||
            key === "arrowleft"
        ) {
            keys.left = true;
        }

        if (
            key === "d" ||
            key === "arrowright"
        ) {
            keys.right = true;
        }

        if (
            key === " " ||
            key === "enter"
        ) {

            keys.shoot = true;

            event.preventDefault();

        }

    }
);


window.addEventListener(
    "keyup",
    function(event) {

        const key =
            event.key.toLowerCase();

        if (
            key === "w" ||
            key === "arrowup"
        ) {
            keys.up = false;
        }

        if (
            key === "s" ||
            key === "arrowdown"
        ) {
            keys.down = false;
        }

        if (
            key === "a" ||
            key === "arrowleft"
        ) {
            keys.left = false;
        }

        if (
            key === "d" ||
            key === "arrowright"
        ) {
            keys.right = false;
        }

        if (
            key === " " ||
            key === "enter"
        ) {
            keys.shoot = false;
        }

    }
);


/* =====================================================
   MOBILE BUTTON
   ===================================================== */

function mobileButton(
    id,
    property
) {

    const button =
        document.getElementById(id);

    if (!button) {
        return;
    }


    const start =
        function(event) {

            event.preventDefault();

            keys[property] = true;

        };


    const stop =
        function(event) {

            event.preventDefault();

            keys[property] = false;

        };


    button.addEventListener(
        "touchstart",
        start,
        { passive: false }
    );

    button.addEventListener(
        "touchend",
        stop,
        { passive: false }
    );

    button.addEventListener(
        "touchcancel",
        stop,
        { passive: false }
    );

    button.addEventListener(
        "mousedown",
        start
    );

    button.addEventListener(
        "mouseup",
        stop
    );

    button.addEventListener(
        "mouseleave",
        stop
    );

}


mobileButton(
    "up",
    "up"
);

mobileButton(
    "down",
    "down"
);

mobileButton(
    "left",
    "left"
);

mobileButton(
    "right",
    "right"
);

mobileButton(
    "shoot",
    "shoot"
);


/* =====================================================
   API
   ===================================================== */

async function apiRequest(data) {

    if (
        !API_URL ||
        API_URL.includes(
            "GANTI_DENGAN"
        )
    ) {

        throw new Error(
            "API_URL belum diisi."
        );

    }


    const response =
        await fetch(
            API_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(data)

            }
        );


    if (!response.ok) {

        throw new Error(
            "Server HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    let result;

    try {

        result =
            JSON.parse(text);

    }
    catch (error) {

        console.error(
            "Response server:",
            text
        );

        throw new Error(
            "Server tidak mengirim JSON."
        );

    }


    return result;

}


/* =====================================================
   LOGIN
   ===================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            await login();

        }
    );


async function login() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;


    setLoginMessage(
        "Menghubungkan ke server...",
        false
    );


    if (
        username.length < 3
    ) {

        setLoginMessage(
            "Username minimal 3 karakter.",
            true
        );

        return;

    }


    if (
        password.length < 6
    ) {

        setLoginMessage(
            "Password minimal 6 karakter.",
            true
        );

        return;

    }


    try {

        const result =
            await apiRequest({

                action: "login",

                username:
                    username,

                password:
                    password

            });


        if (!result.success) {

            setLoginMessage(
                result.message ||
                "Login gagal.",
                true
            );

            return;

        }


        currentUser =
            result.user;


        score =
            Number(
                currentUser.score || 0
            );

        coins =
            Number(
                currentUser.coins || 0
            );

        level =
            Math.max(
                1,
                Number(
                    currentUser.level || 1
                )
            );

        highScore =
            Number(
                currentUser.highScore || 0
            );


        startGame();

    }
    catch (error) {

        console.error(error);

        setLoginMessage(
            "Tidak dapat terhubung ke Google Sheets API.",
            true
        );

    }

}


/* =====================================================
   LOGIN MESSAGE
   ===================================================== */

function setLoginMessage(
    message,
    error = true
) {

    const element =
        document.getElementById(
            "loginMessage"
        );

    element.textContent =
        message;

    element.style.color =
        error
            ? "#ff8d8d"
            : "#80e6a5";

}


/* =====================================================
   REGISTER
   ===================================================== */

document
    .getElementById("registerBtn")
    .addEventListener(
        "click",
        register
    );


async function register() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;


    if (
        username.length < 3
    ) {

        setLoginMessage(
            "Username minimal 3 karakter.",
            true
        );

        return;

    }


    if (
        password.length < 6
    ) {

        setLoginMessage(
            "Password minimal 6 karakter.",
            true
        );

        return;

    }


    setLoginMessage(
        "Membuat akun...",
        false
    );


    try {

        const result =
            await apiRequest({

                action: "register",

                username:
                    username,

                password:
                    password

            });


        setLoginMessage(
            result.message ||
            "Selesai.",
            !result.success
        );


        if (result.success) {

            document
                .getElementById("password")
                .value = "";

        }

    }
    catch (error) {

        console.error(error);

        setLoginMessage(
            error.message,
            true
        );

    }

}


/* =====================================================
   START GAME
   ===================================================== */

function startGame() {

    loginScreen
        .classList
        .add("hidden");

    gameScreen
        .classList
        .remove("hidden");


    document
        .getElementById("playerName")
        .textContent =
        currentUser.username;


    player.x =
        window.innerWidth / 2;

    player.y =
        window.innerHeight / 2;


    hp = 100;

    bullets = [];

    particles = [];


    gameRunning = true;


    document
        .getElementById("gameOver")
        .classList
        .add("hidden");


    spawnLevel();


    updateHUD();


    lastTime =
        performance.now();


    cancelAnimationFrame(
        window.gameAnimation
    );


    window.gameAnimation =
        requestAnimationFrame(
            gameLoop
        );


    if (saveTimer) {

        clearInterval(
            saveTimer
        );

    }


    saveTimer =
        setInterval(
            saveGame,
            30000
        );

}


/* =====================================================
   SPAWN LEVEL
   ===================================================== */

function spawnLevel() {

    ghosts = [];


    const amount =
        Math.min(
            3 + level * 2,
            20
        );


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        let x;
        let y;


        const side =
            Math.floor(
                Math.random() * 4
            );


        if (side === 0) {

            x =
                Math.random()
                * window.innerWidth;

            y = -40;

        }
        else if (side === 1) {

            x =
                window.innerWidth + 40;

            y =
                Math.random()
                * window.innerHeight;

        }
        else if (side === 2) {

            x =
                Math.random()
                * window.innerWidth;

            y =
                window.innerHeight + 40;

        }
        else {

            x = -40;

            y =
                Math.random()
                * window.innerHeight;

        }


        ghosts.push({

            x: x,

            y: y,

            radius:
                18 +
                Math.random() * 10,

            speed:
                35 +
                Math.random() * 30 +
                level * 5

        });

    }

}


/* =====================================================
   SHOOT
   ===================================================== */

function shoot() {

    if (!gameRunning) {
        return;
    }


    if (
        player.shootCooldown > 0
    ) {
        return;
    }


    if (
        ghosts.length === 0
    ) {
        return;
    }


    let nearest =
        ghosts[0];

    let nearestDistance =
        Infinity;


    for (
        const ghost of ghosts
    ) {

        const dx =
            ghost.x -
            player.x;

        const dy =
            ghost.y -
            player.y;

        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance <
            nearestDistance
        ) {

            nearestDistance =
                distance;

            nearest =
                ghost;

        }

    }


    const dx =
        nearest.x -
        player.x;

    const dy =
        nearest.y -
        player.y;


    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;


    bullets.push({

        x: player.x,

        y: player.y,

        vx:
            dx / distance * 650,

        vy:
            dy / distance * 650,

        life: 1.5

    });


    player.shootCooldown =
        0.18;

}


/* =====================================================
   UPDATE
   ===================================================== */

function update(delta) {

    if (!gameRunning) {
        return;
    }


    /* -------------------------
       PLAYER MOVEMENT
    ------------------------- */

    let moveX = 0;
    let moveY = 0;


    if (keys.left) {
        moveX--;
    }

    if (keys.right) {
        moveX++;
    }

    if (keys.up) {
        moveY--;
    }

    if (keys.down) {
        moveY++;
    }


    if (
        moveX !== 0 ||
        moveY !== 0
    ) {

        const length =
            Math.hypot(
                moveX,
                moveY
            );


        moveX /= length;
        moveY /= length;


        player.x +=
            moveX *
            player.speed *
            delta;

        player.y +=
            moveY *
            player.speed *
            delta;

    }


    /* -------------------------
       PLAYER BOUNDS
    ------------------------- */

    player.x =
        Math.max(
            player.radius,
            Math.min(
                window.innerWidth -
                player.radius,
                player.x
            )
        );


    player.y =
        Math.max(
            player.radius,
            Math.min(
                window.innerHeight -
                player.radius,
                player.y
            )
        );


    /* -------------------------
       SHOOT
    ------------------------- */

    if (keys.shoot) {

        shoot();

    }


    player.shootCooldown =
        Math.max(
            0,
            player.shootCooldown -
            delta
        );


    /* -------------------------
       BULLETS
    ------------------------- */

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx *
            delta;

        bullet.y +=
            bullet.vy *
            delta;

        bullet.life -=
            delta;


        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.x >
                window.innerWidth + 50 ||
            bullet.y < -50 ||
            bullet.y >
                window.innerHeight + 50
        ) {

            bullets.splice(
                i,
                1
            );

            continue;

        }


        /* BULLET COLLISION */

        for (
            let g =
                ghosts.length - 1;
            g >= 0;
            g--
        ) {

            const ghost =
                ghosts[g];


            const distance =
                Math.hypot(
                    bullet.x -
                    ghost.x,

                    bullet.y -
                    ghost.y
                );


            if (
                distance <
                ghost.radius + 6
            ) {

                createExplosion(
                    ghost.x,
                    ghost.y
                );


                ghosts.splice(
                    g,
                    1
                );

                bullets.splice(
                    i,
                    1
                );


                score +=
                    10 * level;

                coins += 1;


                break;

            }

        }

    }


    /* -------------------------
       GHOSTS
    ------------------------- */

    for (
        const ghost of ghosts
    ) {

        const dx =
            player.x -
            ghost.x;

        const dy =
            player.y -
            ghost.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        ghost.x +=
            dx / distance *
            ghost.speed *
            delta;

        ghost.y +=
            dy / distance *
            ghost.speed *
            delta;


        /* PLAYER COLLISION */

        if (
            distance <
            player.radius +
            ghost.radius
        ) {

            hp -=
                25 * delta;

        }

    }


    /* -------------------------
       PARTICLES
    ------------------------- */

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];


        particle.x +=
            particle.vx *
            delta;

        particle.y +=
            particle.vy *
            delta;


        particle.life -=
            delta;


        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }


    /* -------------------------
       NEXT LEVEL
    ------------------------- */

    if (
        ghosts.length === 0
    ) {

        level++;

        score +=
            level * 50;

        spawnLevel();

    }


    /* -------------------------
       GAME OVER
    ------------------------- */

    if (
        hp <= 0
    ) {

        gameOver();

    }


    updateHUD();

}


/* =====================================================
   DRAW
   ===================================================== */

function draw() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    /* BACKGROUND */

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.fillStyle =
        "#070713";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* GRID */

    ctx.strokeStyle =
        "rgba(130,120,210,0.07)";

    ctx.lineWidth = 1;


    const grid = 50;


    for (
        let x = 0;
        x <= width;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= height;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }


    /* BULLETS */

    for (
        const bullet of bullets
    ) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#d8d0ff";

        ctx.shadowBlur = 15;

        ctx.shadowColor =
            "#8978ff";

        ctx.fill();

        ctx.shadowBlur = 0;

    }


    /* GHOSTS */

    for (
        const ghost of ghosts
    ) {

        drawGhost(
            ghost.x,
            ghost.y,
            ghost.radius
        );

    }


    /* PLAYER */

    drawPlayer(
        player.x,
        player.y
    );


    /* PARTICLES */

    for (
        const particle of particles
    ) {

        ctx.globalAlpha =
            Math.max(
                0,
                particle.life
            );

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


/* =====================================================
   PLAYER DRAW
   ===================================================== */

function drawPlayer(
    x,
    y
) {

    ctx.save();

    ctx.translate(
        x,
        y
    );


    /* GLOW */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#6254ed";

    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#6254ed";

    ctx.fill();

    ctx.shadowBlur = 0;


    /* EYES */

    ctx.fillStyle =
        "white";


    ctx.beginPath();

    ctx.arc(
        -7,
        -4,
        5,
        0,
        Math.PI * 2
    );

    ctx.arc(
        7,
        -4,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* MOUTH */

    ctx.strokeStyle =
        "#20203a";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        0,
        5,
        7,
        0,
        Math.PI
    );

    ctx.stroke();


    ctx.restore();

}


/* =====================================================
   GHOST DRAW
   ===================================================== */

function drawGhost(
    x,
    y,
    radius
) {

    ctx.save();

    ctx.translate(
        x,
        y
    );


    /* BODY */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius,
        Math.PI,
        0
    );


    ctx.lineTo(
        radius,
        radius
    );

    ctx.lineTo(
        radius * 0.45,
        radius * 0.55
    );

    ctx.lineTo(
        0,
        radius
    );

    ctx.lineTo(
        -radius * 0.45,
        radius * 0.55
    );

    ctx.lineTo(
        -radius,
        radius
    );

    ctx.closePath();


    ctx.fillStyle =
        "#eeeeff";

    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#ffffff";

    ctx.fill();

    ctx.shadowBlur = 0;


    /* EYES */

    ctx.fillStyle =
        "#17172a";


    ctx.beginPath();

    ctx.arc(
        -radius * 0.32,
        -radius * 0.1,
        radius * 0.12,
        0,
        Math.PI * 2
    );

    ctx.arc(
        radius * 0.32,
        -radius * 0.1,
        radius * 0.12,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =====================================================
   EXPLOSION
   ===================================================== */

function createExplosion(
    x,
    y
) {

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            40 +
            Math.random() * 120;


        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                2 +
                Math.random() * 4,

            life:
                0.5 +
                Math.random() * 0.5

        });

    }

}


/* =====================================================
   HUD
   ===================================================== */

function updateHUD() {

    document
        .getElementById("hp")
        .textContent =
        Math.max(
            0,
            Math.ceil(hp)
        );


    document
        .getElementById("score")
        .textContent =
        score;


    document
        .getElementById("coins")
        .textContent =
        coins;


    document
        .getElementById("level")
        .textContent =
        level;

}


/* =====================================================
   GAME LOOP
   ===================================================== */

function gameLoop(
    timestamp
) {

    if (!gameRunning) {
        return;
    }


    let delta =
        (timestamp - lastTime) /
        1000;


    lastTime =
        timestamp;


    /* prevent huge frame jump */

    delta =
        Math.min(
            delta,
            0.05
        );


    update(delta);

    draw();


    window.gameAnimation =
        requestAnimationFrame(
            gameLoop
        );

}


/* =====================================================
   GAME OVER
   ===================================================== */
```
