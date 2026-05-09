const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const finalScoreEl = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 35;

// Cores dos Tetrominos
const COLORS = {
    I: '#00f0f0',
    J: '#0000f0',
    L: '#f0a000',
    O: '#f0f000',
    S: '#00f000',
    T: '#a000f0',
    Z: '#f00000'
};

const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
};

let grid = createGrid();
let score = 0;
let level = 1;
let linesCleared = 0;
let gameRunning = false;
let piece = null;
let nextPiece = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let requestId = null;

function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
    }

    draw(context, offsetX = 0, offsetY = 0, isGhost = false) {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(context, this.x + x + offsetX, this.y + y + offsetY, this.color, isGhost);
                }
            });
        });
    }

    rotate() {
        const newShape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
        
        // Basic Wall Kick: tentar rotacionar na posição atual, 
        // se falhar tenta empurrar 1 pra esquerda ou 1 pra direita
        const xOffsets = [0, -1, 1, -2, 2];
        for (const offset of xOffsets) {
            if (!checkCollision(this.x + offset, this.y, newShape)) {
                this.x += offset;
                this.shape = newShape;
                return;
            }
        }
    }
}

function drawBlock(context, x, y, color, isGhost = false) {
    const size = context === ctx ? BLOCK_SIZE : 20;
    const px = x * size;
    const py = y * size;

    context.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.1)' : color;
    context.strokeStyle = isGhost ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 2;

    if (!isGhost) {
        // Efeito de brilho/gradiente no bloco
        const grad = context.createLinearGradient(px, py, px + size, py + size);
        grad.addColorStop(0, color);
        grad.addColorStop(1, darkenColor(color, 40));
        context.fillStyle = grad;
    }

    context.fillRect(px + 1, py + 1, size - 2, size - 2);
    context.strokeRect(px + 1, py + 1, size - 2, size - 2);
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
}

function checkCollision(x, y, shape = piece.shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                if (piece.y + y < 0) {
                    gameOver();
                    return;
                }
                grid[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

function clearLines() {
    let lines = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(value => value !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(COLS).fill(0));
            lines++;
            y++; // Check the same row again
        }
    }
    if (lines > 0) {
        updateScore(lines);
    }
}

function updateScore(lines) {
    const points = [0, 100, 300, 500, 800]; // Original Nintendo scoring
    score += points[lines] * level;
    linesCleared += lines;
    
    if (linesCleared >= level * 10) {
        level++;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
    
    scoreEl.textContent = score;
    levelEl.textContent = level;
}

function randomPiece() {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    return new Piece(SHAPES[type], COLORS[type]);
}

function spawnPiece() {
    piece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    
    if (checkCollision(piece.x, piece.y)) {
        gameOver();
    }
    drawNext();
}

function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const shape = nextPiece.shape;
    const color = nextPiece.color;
    
    // Centralizar (usando Math.floor para evitar blur)
    const offsetX = Math.floor((nextCanvas.width / 20 - shape[0].length) / 2);
    const offsetY = Math.floor((nextCanvas.height / 20 - shape.length) / 2);
    
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(nextCtx, x + offsetX, y + offsetY, color);
            }
        });
    });
}

function drawGhost() {
    let ghostY = piece.y;
    while (!checkCollision(piece.x, ghostY + 1)) {
        ghostY++;
    }
    piece.draw(ctx, 0, ghostY - piece.y, true);
}

function drawGrid() {
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, x, y, value);
            }
        });
    });
}

function update(time = 0) {
    if (!gameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        dropPiece();
    }

    draw();
    requestId = requestAnimationFrame(update);
}

function dropPiece() {
    if (!checkCollision(piece.x, piece.y + 1)) {
        piece.y++;
    } else {
        mergePiece();
        clearLines();
        spawnPiece();
    }
    dropCounter = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, canvas.height); ctx.stroke();
    }
    for(let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(canvas.width, y * BLOCK_SIZE); ctx.stroke();
    }

    drawGrid();
    if (piece) {
        drawGhost();
        piece.draw(ctx);
    }
}

function startGame() {
    grid = createGrid();
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    updateScore(0);
    
    nextPiece = randomPiece();
    spawnPiece();
    
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    lastTime = performance.now();
    if (requestId) cancelAnimationFrame(requestId);
    update();
}

function gameOver() {
    gameRunning = false;
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
    if (requestId) cancelAnimationFrame(requestId);
}

window.addEventListener('keydown', event => {
    if (event.code === 'Escape') startGame();
    if (!gameRunning) return;

    switch (event.code) {
        case 'ArrowLeft':
            if (!checkCollision(piece.x - 1, piece.y)) piece.x--;
            break;
        case 'ArrowRight':
            if (!checkCollision(piece.x + 1, piece.y)) piece.x++;
            break;
        case 'ArrowDown':
            dropPiece();
            break;
        case 'ArrowUp':
        case 'KeyX':
            piece.rotate();
            break;
    }
    draw();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Iniciar com um draw vazio
draw();
