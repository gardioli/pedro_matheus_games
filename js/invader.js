// ============================================================
// RETRO INVADER — Engine revisada
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');

const W = canvas.width;   // 800
const H = canvas.height;  // 600

// ── Estado ────────────────────────────────────────────────
let gameRunning = false;
let score = 0;
let lives = 3;
let level = 1;
let rafId = null;
let lastInvaderMove = 0;
let invaderDir = 1;
let shootCooldown = 0;

// ── Player ────────────────────────────────────────────────
const player = {
    x: W / 2 - 24,
    y: H - 70,
    w: 48,
    h: 36,
    speed: 6
};

// ── Coleções ──────────────────────────────────────────────
let bullets = [];
let alienBullets = [];
let invaders = [];
let particles = [];
let shields = [];
let stars = [];

// ── Input ─────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
    if (e.code === 'Escape') startGame();
    keys[e.code] = true;
    if (['Space','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Estrelas de fundo ─────────────────────────────────────
function initStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.4 + 0.1,
            alpha: Math.random() * 0.7 + 0.3
        });
    }
}

function updateStars() {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    });
}

function drawStars() {
    stars.forEach(s => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ── Invaders ──────────────────────────────────────────────
const INV_COLS = 10;
const INV_ROWS = 5;
const INV_W = 36;
const INV_H = 28;
const INV_GAP_X = 24;
const INV_GAP_Y = 20;

// Shapes dos aliens (pixel art 8×6 bitmap, espelhado ao centro)
// 0 = vazio, 1 = corpo, 2 = brilho
const ALIEN_SHAPES = [
    // Tipo A (linha 0) – UFO
    [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,0,0,0,1,0],
        [1,0,0,0,0,0,0,1]
    ],
    // Tipo B (linhas 1-2) – Inseto
    [
        [0,1,0,0,0,0,1,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,0,1,0,0,1,0,0]
    ],
    // Tipo C (linhas 3-4) – Caranguejo
    [
        [0,0,0,1,1,0,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,0,0,0,1,0],
        [0,0,1,0,0,1,0,0]
    ]
];

const ALIEN_COLORS = [
    { body: '#ff4d4d', glow: 'rgba(255,77,77,0.5)' },    // linha 0
    { body: '#a855f7', glow: 'rgba(168,85,247,0.5)' },   // linhas 1-2
    { body: '#22d3ee', glow: 'rgba(34,211,238,0.5)' }    // linhas 3-4
];

function getAlienType(row) {
    if (row === 0) return 0;
    if (row < 3) return 1;
    return 2;
}

function drawAlienSprite(x, y, shapeIdx, colorObj, frame) {
    const shape = ALIEN_SHAPES[shapeIdx];
    const rows = shape.length;
    const cols = shape[0].length;
    const pw = INV_W / cols;
    const ph = INV_H / rows;

    ctx.fillStyle = colorObj.body;
    ctx.shadowBlur = 8;
    ctx.shadowColor = colorObj.glow;

    // Animação: alterna pés a cada frame (frame 0 ou 1)
    shape.forEach((row, ry) => {
        row.forEach((cell, cx) => {
            if (cell === 0) return;
            // Nos 2 últimos pixels aplica offset de caminhada
            let dy = 0;
            if (ry >= rows - 2 && frame === 1) dy = 2;
            ctx.fillRect(
                x + cx * pw,
                y + ry * ph + dy,
                pw - 1,
                ph - 1
            );
        });
    });

    ctx.shadowBlur = 0;
}

function initInvaders() {
    invaders = [];
    const totalW = INV_COLS * (INV_W + INV_GAP_X) - INV_GAP_X;
    const startX = (W - totalW) / 2;
    const startY = 70;

    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
            invaders.push({
                x: startX + c * (INV_W + INV_GAP_X),
                y: startY + r * (INV_H + INV_GAP_Y),
                w: INV_W,
                h: INV_H,
                type: getAlienType(r),
                points: (INV_ROWS - r) * 10,
                frame: 0,
                alive: true
            });
        }
    }
    invaderDir = 1;
}

// ── Escudos ───────────────────────────────────────────────
// Escudo em pixel art (10×8 células de 7px)
const SHIELD_PIXELS = [
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,1,1]
];
const SHIELD_PX = 7;
const SHIELD_ROWS = SHIELD_PIXELS.length;
const SHIELD_COLS = SHIELD_PIXELS[0].length;
const SHIELD_W = SHIELD_COLS * SHIELD_PX;
const SHIELD_H = SHIELD_ROWS * SHIELD_PX;

function initShields() {
    shields = [];
    const count = 4;
    const spacing = (W - count * SHIELD_W) / (count + 1);
    for (let i = 0; i < count; i++) {
        const cells = SHIELD_PIXELS.map(row => [...row]); // 1=intacto, 0=destruído
        shields.push({
            x: spacing + i * (SHIELD_W + spacing),
            y: H - 155,
            w: SHIELD_W,
            h: SHIELD_H,
            cells
        });
    }
}

function drawShieldAt(s) {
    s.cells.forEach((row, ry) => {
        row.forEach((cell, cx) => {
            if (!cell) return;
            const px = s.x + cx * SHIELD_PX;
            const py = s.y + ry * SHIELD_PX;
            const brightness = 0.4 + cell * 0.6;
            ctx.fillStyle = `rgba(34,197,94,${brightness})`;
            ctx.fillRect(px, py, SHIELD_PX - 1, SHIELD_PX - 1);
        });
    });
}

function damageShield(s, bx, by) {
    // Destrói alguns pixels em redor do ponto de impacto
    const cx = Math.floor((bx - s.x) / SHIELD_PX);
    const cy = Math.floor((by - s.y) / SHIELD_PX);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const r = cy + dy;
            const c = cx + dx;
            if (r >= 0 && r < SHIELD_ROWS && c >= 0 && c < SHIELD_COLS) {
                if (Math.random() > 0.3) s.cells[r][c] = 0;
            }
        }
    }
}

function shieldHit(s, bullet) {
    if (bullet.x + bullet.w < s.x || bullet.x > s.x + s.w) return false;
    if (bullet.y + bullet.h < s.y || bullet.y > s.y + s.h) return false;
    // Verifica pixel a pixel
    const cx = Math.floor((bullet.x + bullet.w / 2 - s.x) / SHIELD_PX);
    const cy = Math.floor((bullet.y + bullet.h / 2 - s.y) / SHIELD_PX);
    if (cy >= 0 && cy < SHIELD_ROWS && cx >= 0 && cx < SHIELD_COLS && s.cells[cy][cx]) {
        damageShield(s, bullet.x + bullet.w / 2, bullet.y + bullet.h / 2);
        return true;
    }
    return false;
}

// ── Player Draw ───────────────────────────────────────────
function drawPlayer() {
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;

    ctx.save();

    // Motor / thruster
    const grad = ctx.createLinearGradient(px + pw/2, py + ph, px + pw/2, py + ph + 12);
    grad.addColorStop(0, 'rgba(59,130,246,0.9)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px + pw/2 - 6, py + ph - 4, 12, 16);

    // Corpo principal
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3b82f6';

    // Fuselagem central
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(px + pw/2, py);
    ctx.lineTo(px + pw/2 + 10, py + 16);
    ctx.lineTo(px + pw/2 + 14, py + ph);
    ctx.lineTo(px + pw/2 - 14, py + ph);
    ctx.lineTo(px + pw/2 - 10, py + 16);
    ctx.closePath();
    ctx.fill();

    // Asas
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(px + pw/2 - 10, py + 14);
    ctx.lineTo(px, py + ph);
    ctx.lineTo(px + pw/2 - 14, py + ph);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + pw/2 + 10, py + 14);
    ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px + pw/2 + 14, py + ph);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#bfdbfe';
    ctx.beginPath();
    ctx.ellipse(px + pw/2, py + 10, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
}

// ── Partículas ────────────────────────────────────────────
function spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 1.5 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            color,
            r: 1.5 + Math.random() * 2
        });
    }
}

// ── Draw Helpers ──────────────────────────────────────────
function drawBullet(b, color, glowColor) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // brilho no topo
    ctx.fillStyle = '#fff';
    ctx.fillRect(b.x + 1, b.y, b.w - 2, 3);
    ctx.shadowBlur = 0;
}

// ── Update ────────────────────────────────────────────────
let alienAnimFrame = 0;
let lastAnimTime = 0;

function update(ts) {
    if (!gameRunning) return;

    // Animação aliens
    if (ts - lastAnimTime > 500) {
        alienAnimFrame ^= 1;
        lastAnimTime = ts;
    }

    // Player
    if (keys['ArrowLeft']  && player.x > 0)          player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.w < W) player.x += player.speed;

    // Tiro do jogador
    if (shootCooldown > 0) shootCooldown--;
    if (keys['Space'] && shootCooldown === 0) {
        bullets.push({
            x: player.x + player.w / 2 - 2,
            y: player.y - 4,
            w: 4, h: 18
        });
        shootCooldown = 16;
    }

    // Mover balas do jogador
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= 12;
        if (b.y + b.h < 0) { bullets.splice(i, 1); continue; }

        // Colide com escudos
        let shieldHit_ = false;
        for (let j = 0; j < shields.length; j++) {
            if (shieldHit(shields[j], b)) { shieldHit_ = true; break; }
        }
        if (shieldHit_) { bullets.splice(i, 1); continue; }

        // Colide com invaders
        let hitInv = false;
        for (let j = invaders.length - 1; j >= 0; j--) {
            const inv = invaders[j];
            if (rectOverlap(b, inv)) {
                spawnParticles(inv.x + inv.w/2, inv.y + inv.h/2, ALIEN_COLORS[inv.type].body);
                score += inv.points * level;
                scoreEl.textContent = score.toString().padStart(4, '0');
                invaders.splice(j, 1);
                hitInv = true;
                break;
            }
        }
        if (hitInv) { bullets.splice(i, 1); continue; }
    }

    // Mover invaders
    const moveInterval = Math.max(80, 700 - level * 60 - (INV_COLS * INV_ROWS - invaders.length) * 8);
    if (ts - lastInvaderMove > moveInterval) {
        let hitEdge = false;
        invaders.forEach(inv => {
            inv.x += 18 * invaderDir;
            if (inv.x + inv.w > W - 10 || inv.x < 10) hitEdge = true;
        });
        if (hitEdge) {
            invaderDir *= -1;
            invaders.forEach(inv => inv.y += 20);
        }
        lastInvaderMove = ts;

        // Aliens atiram
        if (invaders.length > 0 && Math.random() < 0.25) {
            const shooter = invaders[Math.floor(Math.random() * invaders.length)];
            alienBullets.push({
                x: shooter.x + shooter.w / 2 - 2,
                y: shooter.y + shooter.h,
                w: 4, h: 14
            });
        }
    }

    // Mover balas dos aliens
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const b = alienBullets[i];
        b.y += 4 + level * 0.5;
        if (b.y > H) { alienBullets.splice(i, 1); continue; }

        // Colide com escudos
        let shieldHit_ = false;
        for (let j = 0; j < shields.length; j++) {
            if (shieldHit(shields[j], b)) { shieldHit_ = true; break; }
        }
        if (shieldHit_) { alienBullets.splice(i, 1); continue; }

        // Colide com player
        if (rectOverlap(b, { x: player.x, y: player.y, w: player.w, h: player.h })) {
            alienBullets.splice(i, 1);
            die();
            continue;
        }
    }

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Vitória
    if (invaders.length === 0) win();

    // Touchdown
    if (invaders.some(inv => inv.y + inv.h >= player.y)) gameOver();
}

// ── Render ────────────────────────────────────────────────
function draw() {
    // Fundo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    // Estrelas
    updateStars();
    drawStars();

    // Linha de chão
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 30);
    ctx.lineTo(W, H - 30);
    ctx.stroke();

    if (!gameRunning) return;

    // ① Escudos (DEBAIXO de tudo no plano do jogador)
    shields.forEach(drawShieldAt);

    // ② Balas dos aliens
    alienBullets.forEach(b => drawBullet(b, '#f87171', '#ef4444'));

    // ③ Balas do jogador
    bullets.forEach(b => drawBullet(b, '#fff', '#bfdbfe'));

    // ④ Invaders
    invaders.forEach(inv => {
        drawAlienSprite(inv.x, inv.y, inv.type, ALIEN_COLORS[inv.type], alienAnimFrame);
    });

    // ⑤ Partículas
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ⑥ Player POR ÚLTIMO (sempre na frente)
    drawPlayer();
}

// ── Helpers ───────────────────────────────────────────────
function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

function die() {
    lives--;
    livesEl.textContent = lives;
    spawnParticles(player.x + player.w/2, player.y + player.h/2, '#60a5fa');
    if (lives <= 0) {
        gameOver();
    } else {
        gameRunning = false;
        setTimeout(() => {
            player.x = W / 2 - 24;
            bullets = [];
            alienBullets = [];
            gameRunning = true;
        }, 900);
    }
}

// ── Game Flow ─────────────────────────────────────────────
function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    scoreEl.textContent = '0000';
    livesEl.textContent = '3';
    shootCooldown = 0;
    lastInvaderMove = 0;
    lastAnimTime = 0;
    alienAnimFrame = 0;
    initStars();
    resetLevel();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    if (!rafId) rafId = requestAnimationFrame(mainLoop);
}

function resetLevel() {
    bullets = [];
    alienBullets = [];
    particles = [];
    initInvaders();
    initShields();
    player.x = W / 2 - 24;
}

function win() {
    gameRunning = false;
    winScreen.classList.remove('hidden');
}

function gameOver() {
    gameRunning = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// ── Loop Principal ────────────────────────────────────────
function mainLoop(ts) {
    update(ts);
    draw();
    rafId = requestAnimationFrame(mainLoop);
}

// ── Eventos ───────────────────────────────────────────────
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', () => {
    level++;
    resetLevel();
    winScreen.classList.add('hidden');
    gameRunning = true;
});

// Tela inicial
initStars();
draw();
