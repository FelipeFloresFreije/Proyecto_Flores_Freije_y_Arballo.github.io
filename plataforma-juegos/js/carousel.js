document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.carousel').forEach(initCarousel);
});

const MAX_VISIBLE = 8;   
const CARD_W = 220;      

function initCarousel(carousel) {
    const grid = carousel.querySelector('.games-grid');
    const buttons = carousel.querySelectorAll(':scope > .btn-square');
    const prevBtn = buttons[0];
    const nextBtn = buttons[1];
    if (!grid || !prevBtn || !nextBtn) return;

    const cards = Array.from(grid.querySelectorAll('.game-card'));
    if (cards.length === 0) return;

    const track = document.createElement('div');
    track.className = 'games-track';
    cards.forEach(card => track.appendChild(card));
    grid.appendChild(track);

    let index = 0;          
    let visible = MAX_VISIBLE;
    let step = CARD_W + 8;  

    function maxIndex() {
        return Math.max(0, cards.length - visible);
    }

    function layout() {

        if (window.matchMedia('(max-width: 768px)').matches) {
            grid.style.width = '';
            grid.style.removeProperty('--card-w');
            track.style.transform = '';
            index = 0;
            return;
        }

        const gap = parseFloat(getComputedStyle(track).columnGap) || 8;
        const carouselGap = parseFloat(getComputedStyle(carousel).columnGap) || 8;
        const cs = getComputedStyle(grid);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);

        const available = carousel.clientWidth
            - prevBtn.offsetWidth - nextBtn.offsetWidth
            - carouselGap * 2 - padX;

        if (available <= 0) return; // todavía oculto (loading)

        const cardW = Math.min(CARD_W, available);
        visible = (available + gap) / (cardW + gap);
        if (visible < 1) {
            visible = 1;
        } else {
            visible = parseInt(visible);

            if (visible > MAX_VISIBLE) {
                visible = MAX_VISIBLE;
            }
        }
        step = cardW + gap;

        grid.style.setProperty('--card-w', cardW + 'px');
        grid.style.width = (visible * cardW + (visible - 1) * gap + padX) + 'px';

        index = Math.min(index, maxIndex());
        render();
    }

    function render() {
        track.style.transform = 'translateX(' + (-index * step) + 'px)';
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= maxIndex();
    }

    // Animación de entrada escalonada solo para las cards que aparecen
    function animateEntering(from, to, dir) {
        for (let i = from; i < to && i < cards.length; i++) {
            const card = cards[i];
            card.classList.remove('entering');
            void card.offsetWidth; // reinicia la animación
            card.style.setProperty('--dir', dir);
            card.style.animationDelay = ((i - from) * 0.08) + 's';
            card.classList.add('entering');
        }
    }

    function move(direction) {
        const newIndex = Math.max(0, Math.min(maxIndex(), index + direction * visible));
        if (newIndex === index) return;

        index = newIndex;
        render();                                  
        animateEntering(index, index + visible, direction);
    }

    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move(1));

    cards.forEach(card => {
        card.addEventListener('animationend', () => {
            card.classList.remove('entering');
            card.style.animationDelay = '';
        });
    });

    new ResizeObserver(layout).observe(carousel);
    layout();
}