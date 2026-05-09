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

const TILE_SIZE = 16;
const ROWS = 31;
const COLS = 28;

// 0: Vazio, 1: Parede, 2: Pílula, 3: Pílula Especial, 4: Portão Fantasma
const mapTemplate = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = [];
let score = 0;
let lives = 3;
let gameRunning = false;
let pelletsRemaining = 0;
let ghostFrightenedTimer = 0;

const pacman = {
    x: 14 * TILE_SIZE,
    y: 23 * TILE_SIZE,
    dir: 0, // 0: Right, 1: Down, 2: Left, 3: Up
    nextDir: 0,
    speed: 2,
    radius: 7,
    mouthOpen: 0,
    mouthDir: 1
};

const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
const ghosts = [];

function initGhosts() {
    ghosts.length = 0;
    for (let i = 0; i < 4; i++) {
        ghosts.push({
            x: (13 + i % 2) * TILE_SIZE,
            y: (14 + Math.floor(i / 2)) * TILE_SIZE,
            dir: 3,
            speed: 1.5,
            color: ghostColors[i],
            frightened: false,
            flash: false
        });
    }
}

function drawMap() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = map[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (tile === 1) {
                ctx.strokeStyle = '#2b3a9e';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 3) {
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 4) {
                ctx.strokeStyle = '#ffb8ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + TILE_SIZE / 2);
                ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
                ctx.stroke();
            }
        }
    }
}

function drawPacman() {
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    const centerX = pacman.x + TILE_SIZE / 2;
    const centerY = pacman.y + TILE_SIZE / 2;
    
    let startAngle, endAngle;
    const rotation = pacman.dir * Math.PI / 2;
    const mouthSize = 0.2 * Math.PI * pacman.mouthOpen;

    startAngle = rotation + mouthSize;
    endAngle = rotation + 2 * Math.PI - mouthSize;

    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, pacman.radius, startAngle, endAngle);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(g => {
        const x = g.x + TILE_SIZE / 2;
        const y = g.y + TILE_SIZE / 2;
        
        ctx.fillStyle = g.frightened ? (g.flash ? '#fff' : '#2b3a9e') : g.color;
        
        // Corpo do fantasma
        ctx.beginPath();
        ctx.arc(x, y, 7, Math.PI, 0);
        ctx.lineTo(x + 7, y + 8);
        ctx.lineTo(x - 7, y + 8);
        ctx.fill();

        // Pernas (ondas)
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x - 4 + i * 4, y + 8, 2.5, 0, Math.PI);
            ctx.fill();
        }

        // Olhos
        if (!g.frightened) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - 3, y - 2, 2.5, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 3, y - 2, 1.2, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 2, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function canMove(x, y, dir) {
    let nx = x;
    let ny = y;
    
    // Simplificado para tiles
    if (x % TILE_SIZE !== 0 || y % TILE_SIZE !== 0) return true;

    const r = y / TILE_SIZE;
    const c = x / TILE_SIZE;

    if (dir === 0) nx += TILE_SIZE;
    else if (dir === 1) ny += TILE_SIZE;
    else if (dir === 2) nx -= TILE_SIZE;
    else if (dir === 3) ny -= TILE_SIZE;

    // Teletransporte túnel
    if (nx < 0 || nx >= COLS * TILE_SIZE) return true;

    const nr = ny / TILE_SIZE;
    const nc = nx / TILE_SIZE;
    
    if (nr < 0 || nr >= ROWS) return false;
    
    const tile = map[nr][nc];
    return tile !== 1 && tile !== 4;
}

function updatePacman() {
    // Tentar mudar de direção
    if (pacman.x % TILE_SIZE === 0 && pacman.y % TILE_SIZE === 0) {
        if (canMove(pacman.x, pacman.y, pacman.nextDir)) {
            pacman.dir = pacman.nextDir;
        }
        
        // Comer pílulas
        const r = pacman.y / TILE_SIZE;
        const c = pacman.x / TILE_SIZE;
        if (map[r][c] === 2) {
            map[r][c] = 0;
            score += 10;
            pelletsRemaining--;
        } else if (map[r][c] === 3) {
            map[r][c] = 0;
            score += 50;
            pelletsRemaining--;
            frightenGhosts();
        }
        scoreEl.textContent = score;
        
        if (pelletsRemaining === 0) win();
    }

    if (canMove(pacman.x, pacman.y, pacman.dir)) {
        if (pacman.dir === 0) pacman.x += pacman.speed;
        else if (pacman.dir === 1) pacman.y += pacman.speed;
        else if (pacman.dir === 2) pacman.x -= pacman.speed;
        else if (pacman.dir === 3) pacman.y -= pacman.speed;
    }

    // Túnel
    if (pacman.x < -TILE_SIZE) pacman.x = COLS * TILE_SIZE;
    if (pacman.x > COLS * TILE_SIZE) pacman.x = -TILE_SIZE;

    // Animação boca
    pacman.mouthOpen += 0.1 * pacman.mouthDir;
    if (pacman.mouthOpen > 1 || pacman.mouthOpen < 0) pacman.mouthDir *= -1;
}

function frightenGhosts() {
    ghostFrightenedTimer = 600;
    ghosts.forEach(g => g.frightened = true);
}

function updateGhosts() {
    if (ghostFrightenedTimer > 0) {
        ghostFrightenedTimer--;
        if (ghostFrightenedTimer === 0) {
            ghosts.forEach(g => g.frightened = false);
        }
        ghosts.forEach(g => g.flash = (ghostFrightenedTimer < 180 && Math.floor(ghostFrightenedTimer / 15) % 2 === 0));
    }

    ghosts.forEach(g => {
        if (g.x % TILE_SIZE === 0 && g.y % TILE_SIZE === 0) {
            const possibleDirs = [];
            for (let i = 0; i < 4; i++) {
                // Não permite voltar imediatamente
                if (Math.abs(i - g.dir) === 2) continue;
                if (canMove(g.x, g.y, i)) possibleDirs.push(i);
            }
            if (possibleDirs.length > 0) {
                g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            } else {
                g.dir = (g.dir + 2) % 4; // Bateu na parede, volta
            }
        }

        const speed = g.frightened ? g.speed * 0.5 : g.speed;
        if (g.dir === 0) g.x += speed;
        else if (g.dir === 1) g.y += speed;
        else if (g.dir === 2) g.x -= speed;
        else if (g.dir === 3) g.y -= speed;

        if (g.x < -TILE_SIZE) g.x = COLS * TILE_SIZE;
        if (g.x > COLS * TILE_SIZE) g.x = -TILE_SIZE;

        // Colisão com Pacman
        const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (dist < 10) {
            if (g.frightened) {
                g.x = 13 * TILE_SIZE;
                g.y = 14 * TILE_SIZE;
                g.frightened = false;
                score += 200;
                scoreEl.textContent = score;
            } else {
                die();
            }
        }
    });
}

function die() {
    lives--;
    updateLivesDisplay();
    if (lives <= 0) {
        gameOver();
    } else {
        resetPositions();
    }
}

function resetPositions() {
    pacman.x = 14 * TILE_SIZE;
    pacman.y = 23 * TILE_SIZE;
    pacman.dir = 0;
    pacman.nextDir = 0;
    initGhosts();
}

function updateLivesDisplay() {
    livesEl.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const icon = document.createElement('div');
        icon.className = 'life-icon';
        livesEl.appendChild(icon);
    }
}

function startGame() {
    map = mapTemplate.map(row => [...row]);
    score = 0;
    lives = 3;
    pelletsRemaining = map.flat().filter(t => t === 2 || t === 3).length;
    scoreEl.textContent = '0';
    updateLivesDisplay();
    resetPositions();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function win() {
    gameRunning = false;
    winScreen.classList.remove('hidden');
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMap();
    updatePacman();
    drawPacman();
    updateGhosts();
    drawGhosts();
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', event => {
    if (event.code === 'Escape') startGame();
    if (!gameRunning) return;
    if (event.key === 'ArrowRight') pacman.nextDir = 0;
    else if (event.key === 'ArrowDown') pacman.nextDir = 1;
    else if (event.key === 'ArrowLeft') pacman.nextDir = 2;
    else if (event.key === 'ArrowUp') pacman.nextDir = 3;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
nextLevelBtn.addEventListener('click', startGame);
