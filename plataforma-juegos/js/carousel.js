const games = [
    { title: "Batman Arkham", rating: "9.5", genre: "Acción", img: "batman-arkham.jpg", plays: "2.5M" },
    { title: "Candy Crush", rating: "8.8", genre: "Puzzle", img: "candy-crush.jpg", plays: "5M" },
    { title: "Flappy Bird", rating: "7.5", genre: "Arcade", img: "flappy-bird.jpg", plays: "10M" },
    { title: "Tetris", rating: "9.0", genre: "Puzzle", img: "tetris.jpg", plays: "3M" },
    { title: "2048", rating: "8.2", genre: "Estrategia", img: "2048.jpg", plays: "1.5M" },
    { title: "Pac-Man", rating: "8.9", genre: "Arcade", img: "pacman.jpg", plays: "4M" },
];

function createGameCard(game) {
    return `
        <div class="game-card">
            <img src="img/juegos/${game.img}" alt="${game.title}">
            <div class="game-card-info">
                <div class="game-card-title">${game.title}</div>
                <div class="game-card-rating">⭐ ${game.rating}</div>
                <div class="game-card-genre">${game.genre}</div>
                <button class="game-card-play">Jugar</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    // Llenar carruseles
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach(carousel => {
        const container = carousel.querySelector('.carousel-container');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        
        // Agregar juegos
        games.forEach(game => {
            container.innerHTML += createGameCard(game);
        });

        // Navegación
        let scrollAmount = 0;
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                scrollAmount += 200;
                container.scrollLeft = scrollAmount;
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                scrollAmount -= 200;
                container.scrollLeft = scrollAmount;
            });
        }
    });
});