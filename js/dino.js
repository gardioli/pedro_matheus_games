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
let rafId = null; // ID do requestAnimationFrame para evitar loops duplos
let score = 0;
let highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
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
    color: '#2dd4bf'
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
    dino.height = dino.baseHeight;
    dino.width = dino.baseWidth;
    dino.y = canvas.height - dino.height - 20;
    dino.grounded = true;
}

window.addEventListener('resize', resize);
resize();

// Controles
const keys = {};
window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') startGame();
    keys[e.code] = true;
    if (e.code === 'ArrowDown' && gameActive) {
        dino.isCrouching = true;
    }
    if ((e.code === 'Space' || e.code === 'ArrowUp') && dino.grounded && gameActive) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
        dino.isCrouching = false;
    }
    // Prevenir scroll da página com teclas do jogo
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code) && gameActive) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'ArrowDown') {
        dino.isCrouching = false;
    }
});

// Suporte para mobile/toque
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameActive) return;
    if (dino.grounded) {
        dino.dy = -dino.jumpForce;
        dino.grounded = false;
        dino.isCrouching = false;
    }
}, { passive: false });

// Loop do Jogo
function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ajustar dimensões conforme agachamento
    if (dino.isCrouching && dino.grounded) {
        dino.height = dino.baseHeight * 0.6;
        dino.width = dino.baseWidth * 1.2;
    } else {
        dino.height = dino.baseHeight;
        dino.width = dino.baseWidth;
    }

    // Gravidade e Pulo
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    const groundY = canvas.height - dino.height - 20;
    if (dino.y >= groundY) {
        dino.y = groundY;
        dino.dy = 0;
        dino.grounded = true;
    } else {
        dino.grounded = false;
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
    if (dinoImg.complete && dinoImg.naturalWidth > 0) {
        if (dino.grounded && !dino.isCrouching) {
            ctx.translate(dino.x + dino.width / 2, dino.y + dino.height / 2 + runOffset);
            ctx.rotate(Math.sin(frameCount * 0.2) * 0.05);
            ctx.drawImage(dinoImg, -dino.width / 2, -dino.height / 2, dino.width, dino.height);
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

    // Gerar Obstáculos - Frequência aumenta com a velocidade e pontuação
    const spawnInterval = Math.max(40, 130 - Math.floor(speed * 4) - Math.floor(score / 400));
    if (frameCount > 0 && frameCount % spawnInterval === 0) {
        const isFlying = Math.random() > 0.7;
        if (isFlying) {
            obstacles.push({
                type: 'pterodactyl',
                x: canvas.width,
                y: canvas.height - 110 - Math.random() * 40,
                width: 60,
                height: 40,
                speed: speed * 1.2
            });
        } else {
            const obsWidth = 30 + Math.random() * 20;
            const obsHeight = 50;
            obstacles.push({
                type: 'cactus',
                x: canvas.width,
                y: canvas.height - obsHeight - 20,
                width: obsWidth,
                height: obsHeight,
                speed: speed
            });
        }
    }

    // Atualizar e Desenhar Obstáculos
    let collided = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obs.speed;

        // Calcular offset de animação do pterodáctilo (usado tanto para desenho quanto para colisão)
        let obsDrawY = obs.y;
        if (obs.type === 'pterodactyl') {
            obsDrawY = obs.y + Math.sin(frameCount * 0.3) * 5;
        }

        // Desenhar Obstáculo
        if (obs.type === 'cactus') {
            if (cactusImg.complete && cactusImg.naturalWidth > 0) {
                ctx.drawImage(cactusImg, obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }
        } else {
            if (pterodactylImg.complete && pterodactylImg.naturalWidth > 0) {
                ctx.drawImage(pterodactylImg, obs.x, obsDrawY, obs.width, obs.height);
            } else {
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(obs.x, obsDrawY, obs.width, obs.height);
            }
        }

        // Colisão (hitbox reduzida para ser mais justa, usando posição real de desenho)
        const hitPadding = 10;
        const obsHitY = (obs.type === 'pterodactyl') ? obsDrawY : obs.y;
        if (
            !collided &&
            dino.x + hitPadding < obs.x + obs.width - hitPadding &&
            dino.x + dino.width - hitPadding > obs.x + hitPadding &&
            dino.y + hitPadding < obsHitY + obs.height - hitPadding &&
            dino.y + dino.height - hitPadding > obsHitY + hitPadding
        ) {
            collided = true;
        }

        // Remover obstáculos fora da tela
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    if (collided) {
        endGame();
        return;
    }

    // Pontuação baseada em frames (mais fluida)
    frameCount++;
    // Aceleração progressiva baseada na pontuação (menos agressiva)
    if (frameCount % 60 === 0) {
        speed += 0.1;
    }
    
    if (frameCount % 6 === 0) {
        score++;
        updateScore();
    }

    rafId = requestAnimationFrame(update);
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
    // Cancelar loop anterior para evitar loops duplos
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

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
    rafId = requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
