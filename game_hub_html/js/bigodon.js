// ============================================================
// EL BIGODON - O Burrito Perdido (Canvas Engine)
// ============================================================
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const W       = canvas.width;
const H       = canvas.height;

const GROUND  = H - 80; // y do chão (pés dos personagens)
const TACO_W  = 60;     // tamanho do projétil
const TACO_H  = 60;

// ---- HUD elements
const bossHpDisplay  = document.getElementById('bossHpDisplay');
const scoreDisplay   = document.getElementById('scoreDisplay');

// ---- Assets
const assets = {};
const toLoad = [
    ['bg',     '../assets/mexico.png'],
    ['player', '../assets/el_bigodon_man.png'],
    ['boss',   '../assets/la_cucaracha.png'],
    ['minion', '../assets/la_cucaracha.png'],
    ['taco',   '../assets/taco.png'],
];
let loaded = 0;

toLoad.forEach(([key, src]) => {
    const img = new Image();
    img.onload = () => { loaded++; if (loaded === toLoad.length) init(); };
    img.onerror = () => { loaded++; if (loaded === toLoad.length) init(); }; // funciona sem img tb
    img.src = src;
    assets[key] = img;
});

// ---- State
let state      = 'start'; // start | playing | win | dead
let bossHp     = 20;
let score      = 0;
let frameCount = 0;
let rafId      = null;
let lastShot   = 0;

// ---- Player
const player = {
    x: 80, y: GROUND, w: 60, h: 80,
    vx: 0, vy: 0,
    onGround: true,
    speed: 5,
    jumpForce: -16,
};

// ---- Boss (no canto direito)
const boss = {
    x: W - 200, y: GROUND - 180, w: 160, h: 180, // pés no chão
    hp: 20,
};

// ---- Minions & Projectiles
let minions     = [];
let projectiles = [];

// ---- Keys
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Previne scroll da página
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    // Qualquer tecla inicia o jogo
    if (state === 'start') startGame();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('click', () => { if (state === 'start') startGame(); });

// ---- Init (após assets carregarem)
function init() {
    rafId = requestAnimationFrame(loop);
}

function startGame() {
    state   = 'playing';
    bossHp  = 20;
    score   = 0;
    frameCount = 0;
    lastShot   = 0;
    minions    = [];
    projectiles = [];
    player.x   = 80;
    player.y   = GROUND;
    player.vx  = 0;
    player.vy  = 0;
    player.onGround = true;
    boss.hp    = 20;
    updateHUD();
}

function updateHUD() {
    bossHpDisplay.textContent = Math.max(0, bossHp);
    scoreDisplay.textContent  = score;
}

// ---- Main Loop
function loop(timestamp) {
    rafId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    drawBg();

    if (state === 'start') {
        drawStart();
        return;
    }
    if (state === 'win') {
        drawWin();
        return;
    }
    if (state === 'dead') {
        drawDead();
        return;
    }

    // --- PLAYING ---
    update(timestamp);
    draw();
}

// ---- Update
function update(ts) {
    // Player horizontal
    if (keys['ArrowLeft'] || keys['KeyA'])  player.x -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
    // Limitar para a metade esquerda da tela (o herói não passa da boss)
    player.x = Math.max(0, Math.min(W / 2 - player.w, player.x));

    // Pulo
    if ((keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }

    // Atirar com espaço
    if (keys['Space'] && ts - lastShot > 300) {
        projectiles.push({
            x: player.x + player.w,
            y: player.y - player.h / 2,
            w: TACO_W, h: TACO_H, vx: 14
        });
        lastShot = ts;
    }

    // Gravidade
    player.vy += 0.8;
    player.y  += player.vy;
    if (player.y >= GROUND) {
        player.y = GROUND;
        player.vy = 0;
        player.onGround = true;
    }

    // Spawn minions
    if (frameCount % 120 === 0 && bossHp > 0) {
        minions.push({ x: boss.x, y: GROUND, w: 45, h: 55, vx: -3, hp: 4 });
    }

    // Mover minions
    for (let i = minions.length - 1; i >= 0; i--) {
        const m = minions[i];
        m.x += m.vx;
        // Colisão minion -> jogador = game over
        if (rectsOverlap(player, { x: m.x, y: m.y - m.h, w: m.w, h: m.h })) {
            state = 'dead';
            return;
        }
        if (m.x + m.w < 0) minions.splice(i, 1);
    }

    // Mover projéteis
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;

        // Colisão com boss
        if (bossHp > 0 && rectsOverlap(
            { x: p.x, y: p.y, w: p.w, h: p.h },
            { x: boss.x, y: boss.y, w: boss.w, h: boss.h }
        )) {
            bossHp--;
            projectiles.splice(i, 1);
            updateHUD();
            if (bossHp <= 0) { state = 'win'; }
            continue;
        }

        // Colisão com minion (4 tiros para matar)
        let hit = false;
        for (let j = minions.length - 1; j >= 0; j--) {
            const m = minions[j];
            if (rectsOverlap(
                { x: p.x, y: p.y, w: p.w, h: p.h },
                { x: m.x, y: m.y - m.h, w: m.w, h: m.h }
            )) {
                m.hp--;
                if (m.hp <= 0) {
                    minions.splice(j, 1);
                    score += 40;
                    updateHUD();
                }
                hit = true;
                break;
            }
        }
        if (hit) { projectiles.splice(i, 1); continue; }

        if (p.x > W) projectiles.splice(i, 1);
    }

    frameCount++;
}

// ---- Draw
function draw() {
    // Chão
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, GROUND + 5, W, H - GROUND);

    // Boss (direita)
    if (bossHp > 0) {
        if (assets.boss.complete) {
            ctx.drawImage(assets.boss, boss.x, boss.y, boss.w, boss.h);
        } else {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        }
        // HP Bar da boss
        const barW = boss.w;
        ctx.fillStyle = '#333';
        ctx.fillRect(boss.x, boss.y - 18, barW, 10);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(boss.x, boss.y - 18, barW * (bossHp / 20), 10);
    }

    // Minions
    for (const m of minions) {
        if (assets.minion.complete) {
            ctx.drawImage(assets.minion, m.x, m.y - m.h, m.w, m.h);
        } else {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(m.x, m.y - m.h, m.w, m.h);
        }
        // HP bar das baratas pequenas
        const barW = m.w;
        ctx.fillStyle = '#333';
        ctx.fillRect(m.x, m.y - m.h - 10, barW, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(m.x, m.y - m.h - 10, barW * (m.hp / 4), 6);
    }

    // Projéteis (Tacos)
    for (const p of projectiles) {
        if (assets.taco.complete) {
            ctx.drawImage(assets.taco, p.x, p.y, p.w, p.h);
        } else {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }
    }

    // Player (desenhado por último = na frente)
    const px = player.x;
    const py = player.y - player.h;
    if (assets.player.complete) {
        ctx.drawImage(assets.player, px, py, player.w, player.h);
    } else {
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(px, py, player.w, player.h);
    }
}

function drawBg() {
    if (assets.bg && assets.bg.complete) {
        ctx.drawImage(assets.bg, 0, 0, W, H);
    } else {
        ctx.fillStyle = '#042f2e';
        ctx.fillRect(0, 0, W, H);
    }
}

function drawStart() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 52px Outfit';
    ctx.fillText('EL BIGODON', W/2, H/2 - 70);
    ctx.font = '24px Outfit';
    ctx.fillStyle = '#2dd4bf';
    ctx.fillText('A Cucaracha Gigante roubou o TACO!', W/2, H/2 - 20);
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText('Dê 20 tiros nela para recuperar!', W/2, H/2 + 20);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px Outfit';
    ctx.fillText('A/D ou ←/→ para mover  |  W ou ↑ para pular  |  ESPAÇO para atirar', W/2, H/2 + 70);
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 20px Outfit';
    ctx.fillText('[ Clique ou pressione qualquer tecla para começar ]', W/2, H/2 + 120);
}

function drawWin() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 60px Outfit';
    ctx.fillText('VICTÓRIA!', W/2, H/2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '26px Outfit';
    ctx.fillText('Você recuperou o Taco Sagrado!', W/2, H/2 + 20);
    ctx.fillStyle = '#2dd4bf';
    ctx.font = '20px Outfit';
    ctx.fillText('Score: ' + score, W/2, H/2 + 65);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px Outfit';
    ctx.fillText('[ Clique para voltar ao Hub ]', W/2, H/2 + 115);
    canvas.onclick = () => window.location.href = '../index.html';
}

function drawDead() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 60px Outfit';
    ctx.fillText('GAME OVER', W/2, H/2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Outfit';
    ctx.fillText('Uma cucaracha te pegou!', W/2, H/2 + 20);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px Outfit';
    ctx.fillText('[ Clique para tentar novamente ]', W/2, H/2 + 80);
    canvas.onclick = () => { canvas.onclick = null; startGame(); };
}

// ---- Collision Helper
function rectsOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}
