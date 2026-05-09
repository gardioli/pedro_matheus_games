const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Configurações do Jogo
let gameActive = false;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let speed = 5;
let frameCount = 0;

highScoreElement.textContent = String(highScore).padStart(5, '0');

// Carregar Imagem do Dino
const dinoImg = new Image();
dinoImg.src = '../assets/dino.png';

// Entidades
const dino = {
    x: 50,
    y: 0,
    width: 60,
    height: 60,
    dy: 0,
    jumpForce: 15,
    gravity: 0.8,
    grounded: false,
    color: '#2dd4bf'
};

let obstacles = [];

// Redimensionar Canvas
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    dino.y = canvas.height - dino.height - 20;
}

window.addEventListener('resize', resize);
resize();

// Controles
function handleInput(e) {
    if ((e.code === 'Space' || e.type === 'mousedown' || e.type === 'touchstart') && dino.grounded && gameActive) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
    }
}

window.addEventListener('keydown', handleInput);
window.addEventListener('mousedown', handleInput);

// Loop do Jogo
function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gravidade e Pulo
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    const groundY = canvas.height - dino.height - 20;
    if (dino.y > groundY) {
        dino.y = groundY;
        dino.dy = 0;
        dino.grounded = true;
    }

    // Chão
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Desenhar Dino (com imagem ou fallback neon)
    if (dinoImg.complete) {
        ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    } else {
        ctx.fillStyle = dino.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = dino.color;
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
        ctx.shadowBlur = 0;
    }

    // Gerar Obstáculos
    if (frameCount % Math.max(70, 150 - Math.floor(speed * 2)) === 0) {
        obstacles.push({
            x: canvas.width,
            y: canvas.height - 60,
            width: 20 + Math.random() * 30,
            height: 40 + Math.random() * 20,
            color: '#f43f5e'
        });
    }

    // Atualizar Obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        // Desenhar Obstáculo (Estilo Neon)
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.shadowBlur = 0;

        // Colisão
        if (
            dino.x < obs.x + obs.width &&
            dino.x + dino.width > obs.x &&
            dino.y < obs.y + obs.height &&
            dino.y + dino.height > obs.y
        ) {
            endGame();
        }

        // Remover obstáculos fora da tela
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
            updateScore();
        }
    }

    frameCount++;
    speed += 0.001;
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.textContent = String(score).padStart(5, '0');
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = String(highScore).padStart(5, '0');
        localStorage.setItem('dinoHighScore', highScore);
    }
}

function startGame() {
    gameActive = true;
    score = 0;
    speed = 6;
    obstacles = [];
    frameCount = 0;
    updateScore();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
