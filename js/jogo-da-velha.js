// Variáveis do jogo
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let isVsAI = false;
let difficulty = 'medio';
let scores = { X: 0, O: 0, draw: 0 };

const characters = {
    pvp: {
        X: { name: 'Mario', color: '#2dd4bf', icon: '../assets/mario.png' },
        O: { name: 'Luigi', color: '#fb923c', icon: '../assets/luigi.png' }
    },
    pve: {
        X: { name: 'Sonic', color: '#2dd4bf', icon: '../assets/sonic.png' },
        O: { name: 'Shadow', color: '#fb923c', icon: '../assets/shadow.png' }
    }
};

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Criar tabuleiro
function createBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = `cell`;
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardEl.appendChild(cell);
    }
}

// Atualizar status
function updateStatus(message = null) {
    const statusEl = document.getElementById('status');
    const turnLabel = document.getElementById('turnLabel');
    const chars = isVsAI ? characters.pve : characters.pvp;

    if (message) {
        statusEl.innerHTML = message;
        return;
    }

    if (!gameActive) return;

    const player = chars[currentPlayer];
    statusEl.innerHTML = `Vez do <span id="turnLabel" style="color: ${player.color}; font-weight: bold;">${player.name}</span>`;
}

// Verificar vitória
function checkWin(boardState, player) {
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
            return condition;
        }
    }
    return null;
}

// Verificar empate
function checkDraw(boardState) {
    return boardState.every(cell => cell !== '');
}

// Destacar células vencedoras
function highlightWinningCells(winningLine) {
    const cells = document.querySelectorAll('#board .cell');
    winningLine.forEach(index => {
        cells[index].classList.add('winning-cell');
    });
}

// Lidar com clique na célula
function handleCellClick(index) {
    if (!gameActive || board[index] !== '') return;
    if (isVsAI && currentPlayer === 'O') return; 

    makeMove(index, currentPlayer);

    if (!gameActive) return;

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (isVsAI && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 600);
    }
}

function makeMove(index, player) {
    board[index] = player;
    updateCellUI(index, player);

    const winningLine = checkWin(board, player);
    if (winningLine) {
        gameActive = false;
        highlightWinningCells(winningLine);
        scores[player]++;
        updateScores();
        
        const chars = isVsAI ? characters.pve : characters.pvp;
        const pData = chars[player];
        updateStatus(`🎉 <span style="color: ${pData.color}; font-weight: bold;">${pData.name} venceu!</span>`);
        return;
    }

    if (checkDraw(board)) {
        gameActive = false;
        scores.draw++;
        updateScores();
        updateStatus('🤝 <span style="color: #f59e0b; font-weight: bold;">Empate!</span>');
        return;
    }
}

function updateCellUI(index, player) {
    const cells = document.querySelectorAll('#board .cell');
    const cell = cells[index];
    cell.innerHTML = player;
    cell.classList.add(player.toLowerCase());
    cell.style.pointerEvents = 'none';
}

function makeAIMove() {
    if (!gameActive) return;
    
    let moveIndex;
    
    if (difficulty === 'facil') {
        moveIndex = getRandomMove();
    } else if (difficulty === 'medio') {
        // 50% de chance de fazer a melhor jogada
        moveIndex = Math.random() < 0.5 ? getRandomMove() : getBestMove();
    } else {
        moveIndex = getBestMove();
    }

    makeMove(moveIndex, 'O');

    if (gameActive) {
        currentPlayer = 'X';
        updateStatus();
    }
}

function getRandomMove() {
    const available = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    return available[Math.floor(Math.random() * available.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

const scoresMinimax = { O: 10, X: -10, draw: 0 };

function minimax(boardState, depth, isMaximizing) {
    if (checkWin(boardState, 'O')) return scoresMinimax.O - depth;
    if (checkWin(boardState, 'X')) return scoresMinimax.X + depth;
    if (checkDraw(boardState)) return scoresMinimax.draw;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = 'O';
                let score = minimax(boardState, depth + 1, false);
                boardState[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === '') {
                boardState[i] = 'X';
                let score = minimax(boardState, depth + 1, true);
                boardState[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function updateScores() {
    document.getElementById('scoreX').textContent = scores.X;
    document.getElementById('scoreO').textContent = scores.O;
    document.getElementById('scoreDraw').textContent = scores.draw;
}

function setMode(vsAI) {
    isVsAI = vsAI;
    const btn2p = document.getElementById('btn2p');
    const btnAI = document.getElementById('btnAI');
    const diffSelector = document.getElementById('difficulty-selector');
    const themeContainer = document.getElementById('game-theme-container');

    if (vsAI) {
        btn2p.classList.remove('active');
        btnAI.classList.add('active');
        diffSelector.classList.add('active');
        themeContainer.className = 'grid-container theme-sonic-shadow';
        updateUICharacters('pve');
    } else {
        btnAI.classList.remove('active');
        btn2p.classList.add('active');
        diffSelector.classList.remove('active');
        themeContainer.className = 'grid-container theme-mario-luigi';
        updateUICharacters('pvp');
    }
    resetScores();
    resetGame();
}

function updateUICharacters(mode) {
    const chars = characters[mode];
    document.getElementById('labelX').textContent = chars.X.name;
    document.getElementById('labelO').textContent = chars.O.name;
    document.getElementById('iconX').style.backgroundImage = `url('${chars.X.icon}')`;
    document.getElementById('iconO').style.backgroundImage = `url('${chars.O.icon}')`;
}

function setDifficulty(level) {
    difficulty = level;
    document.querySelectorAll('.difficulty-selector .btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn${level.charAt(0).toUpperCase() + level.slice(1)}`).classList.add('active');
    resetGame();
}

function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameActive = true;
    const cells = document.querySelectorAll('#board .cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('x', 'o', 'winning-cell');
        cell.style.pointerEvents = 'auto';
    });
    updateStatus();
}

function resetScores() {
    scores = { X: 0, O: 0, draw: 0 };
    updateScores();
}

window.onload = () => {
    createBoard();
    updateUICharacters('pvp');
    updateScores();
    updateStatus();
};
