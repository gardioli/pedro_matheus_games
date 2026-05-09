const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');

const gridSize = 20;
let tileCount;
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameSpeed = 100; // ms
let lastTime = 0;
let gameRunning = false;
let rafId = null;
let nextDirection = { dx: 0, dy: 0 };
let currentDirection = { dx: 0, dy: 0 };

highScoreEl.textContent = highScore;

function init() {
    tileCount = canvas.width / gridSize;
    resetGame();
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    generateFood();
    dx = 0;
    dy = 0;
    nextDirection = { dx: 0, dy: 0 };
    currentDirection = { dx: 0, dy: 0 };
    score = 0;
    updateScore();
    gameRunning = true;
    gameOverOverlay.classList.remove('active');
    
    if (rafId) cancelAnimationFrame(rafId);
    lastTime = performance.now();
    rafId = requestAnimationFrame(gameLoop);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Don't spawn on snake
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generateFood();
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTime;
    if (deltaTime > gameSpeed) {
        lastTime = timestamp;
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Apply buffered direction
    dx = nextDirection.dx;
    dy = nextDirection.dy;
    currentDirection = { dx, dy };

    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        generateFood();
        // Slightly speed up
        if (gameSpeed > 60) gameSpeed -= 1;
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#091c1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(23, 68, 64, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#fb923c';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fb923c';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#2dd4bf' : '#14b8a6';
        
        if (isHead) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#2dd4bf';
        }

        // Rounded segments
        // Compatibility-friendly rounded segments
        const r = 4;
        const x = segment.x * gridSize + 2;
        const y = segment.y * gridSize + 2;
        const s = gridSize - 4;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, s, s, r);
        } else {
            ctx.rect(x, y, s, s);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function updateScore() {
    scoreEl.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function gameOver() {
    gameRunning = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    finalScoreEl.textContent = score;
    gameOverOverlay.classList.add('active');
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') restartGame();
    switch (e.key) {
        case 'ArrowUp':
            if (currentDirection.dy === 1) break;
            nextDirection = { dx: 0, dy: -1 };
            break;
        case 'ArrowDown':
            if (currentDirection.dy === -1) break;
            nextDirection = { dx: 0, dy: 1 };
            break;
        case 'ArrowLeft':
            if (currentDirection.dx === 1) break;
            nextDirection = { dx: -1, dy: 0 };
            break;
        case 'ArrowRight':
            if (currentDirection.dx === -1) break;
            nextDirection = { dx: 1, dy: 0 };
            break;
    }
});

function restartGame() {
    gameSpeed = 100;
    resetGame();
}

// Start
init();
