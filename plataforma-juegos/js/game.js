const board = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0]
];

let selectedPeg = null;

function renderBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (cell === 1) {
                const peg = document.createElement('div');
                peg.className = 'peg';
                peg.dataset.row = i;
                peg.dataset.col = j;
                peg.addEventListener('click', () => handlePegClick(i, j, peg));
                gameBoard.appendChild(peg);
            }
        });
    });
}

function handlePegClick(row, col, element) {
    if (!selectedPeg) {
        selectedPeg = { row, col, element };
        element.classList.add('selected');
    } else {
        // Lógica del movimiento aquí
        selectedPeg.element.classList.remove('selected');
        selectedPeg = null;
        element.classList.add('selected');
        selectedPeg = { row, col, element };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderBoard();
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            renderBoard();
            selectedPeg = null;
        });
    }
});