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
let speed = 6;
let frameCount = 0;

highScoreElement.textContent = String(highScore).padStart(5, '0');

// Carregar Imagens
const dinoImg = new Image();
dinoImg.src = '../assets/dino.png';

const pterodactylImg = new Image();
pterodactylImg.src = '../assets/pterodactyl.png';

const cactusImg = new Image();
cactusImg.src = '../assets/cactus.png';

// Entidades
const dino = {
    x: 50,
    y: 0,
    baseWidth: 60,
    baseHeight: 60,
    width: 60,
    height: 60,
    dy: 0,
    jumpForce: 14,
    gravity: 0.7,
    grounded: false,
    isCrouching: false,
    color: '#2dd4bf',
    animationFrame: 0
};

let obstacles = [];

// Redimensionar Canvas
function resize() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    resetDinoPosition();
}

function resetDinoPosition() {
    dino.y = canvas.height - dino.height - 20;
}

window.addEventListener('resize', resize);
resize();

// Controles
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowDown' && gameActive) {
        dino.isCrouching = true;
    }
    if ((e.code === 'Space' || e.code === 'ArrowUp') && dino.grounded && gameActive) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
        dino.isCrouching = false;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'ArrowDown') {
        dino.isCrouching = false;
    }
});

// Suporte para mobile/clique (apenas pulo)
canvas.addEventListener('touchstart', (e) => {
    if (dino.grounded && gameActive) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
    }
});

// Loop do Jogo
function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ajustar altura conforme agachamento
    if (dino.isCrouching && dino.grounded) {
        dino.height = dino.baseHeight * 0.6;
        dino.width = dino.baseWidth * 1.2; // Alarga um pouco ao agachar
    } else {
        dino.height = dino.baseHeight;
        dino.width = dino.baseWidth;
    }

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

    // Animação de corrida (oscilação leve)
    let runOffset = 0;
    if (dino.grounded && !dino.isCrouching) {
        runOffset = Math.sin(frameCount * 0.2) * 3;
    }

    // Desenhar Dino
    ctx.save();
    if (dinoImg.complete) {
        // Efeito de animação: inclinação leve ao correr
        if (dino.grounded && !dino.isCrouching) {
            ctx.translate(dino.x + dino.width/2, dino.y + dino.height/2 + runOffset);
            ctx.rotate(Math.sin(frameCount * 0.2) * 0.05);
            ctx.drawImage(dinoImg, -dino.width/2, -dino.height/2, dino.width, dino.height);
        } else {
            ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
        }
    } else {
        ctx.fillStyle = dino.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = dino.color;
        ctx.fillRect(dino.x, dino.y + runOffset, dino.width, dino.height);
    }
    ctx.restore();

    // Gerar Obstáculos
    if (frameCount % Math.max(60, 140 - Math.floor(speed * 3)) === 0) {
        const isFlying = Math.random() > 0.7; // 30% de chance de ser um dinossauro voador
        if (isFlying) {
            obstacles.push({
                type: 'pterodactyl',
                x: canvas.width,
                y: canvas.height - 110 - (Math.random() * 40), // Altura variável para forçar agachamento ou pulo
                width: 60,
                height: 40,
                speed: speed * 1.2
            });
        } else {
            obstacles.push({
                type: 'cactus',
                x: canvas.width,
                y: canvas.height - 70,
                width: 30 + Math.random() * 20,
                height: 50,
                speed: speed
            });
        }
    }

    // Atualizar Obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obs.speed;

        // Desenhar Obstáculo
        if (obs.type === 'cactus') {
            if (cactusImg.complete) {
                ctx.drawImage(cactusImg, obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
        } else {
            // Pterodáctilo com animação de bater asas
            const wingFlap = Math.sin(frameCount * 0.3) * 5;
            if (pterodactylImg.complete) {
                ctx.drawImage(pterodactylImg, obs.x, obs.y + wingFlap, obs.width, obs.height);
            } else {
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(obs.x, obs.y + wingFlap, obs.width, obs.height);
            }
        }

        // Colisão (Ajustada para ser mais justa)
        const hitPadding = 10;
        if (
            dino.x + hitPadding < obs.x + obs.width - hitPadding &&
            dino.x + dino.width - hitPadding > obs.x + hitPadding &&
            dino.y + hitPadding < obs.y + obs.height - hitPadding &&
            dino.y + dino.height - hitPadding > obs.y + hitPadding
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
    speed += 0.0015;
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
    dino.isCrouching = false;
    dino.dy = 0;
    resetDinoPosition();
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
