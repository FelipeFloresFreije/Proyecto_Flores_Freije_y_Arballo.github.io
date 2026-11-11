document.addEventListener('DOMContentLoaded', function () {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');
    const percentElement = document.getElementById('loadingPercent');
    const bar = document.getElementById('loadingBar');

    const DURATION = 5000; // 5 segundos exactos
    const start = performance.now();

    function update(now) {
        const progress = Math.min((now - start) / DURATION, 1);
        const percent = Math.floor(progress * 100);

        percentElement.textContent = percent + '%';
        bar.style.width = percent + '%';

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            setTimeout(finish, 300);
        }
    }

    function finish() {
        loading.classList.add('hidden');
        mainContent.classList.remove('is-hidden');

        loading.addEventListener('transitionend', () => {
            loading.style.display = 'none';
        }, { once: true });
    }

    requestAnimationFrame(update);
});