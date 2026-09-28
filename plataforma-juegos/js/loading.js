document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');
    const percentElement = document.getElementById('loadingPercent');
    
    let percent = 0;
    const duration = 5000; // 5 segundos
    const interval = 50;
    const increment = 100 / (duration / interval);
    
    const loadingInterval = setInterval(() => {
        percent += increment;
        
        if (percent >= 100) {
            percent = 100;
            clearInterval(loadingInterval);
            
            setTimeout(() => {
                loading.style.display = 'none';
                mainContent.style.display = 'block';
            }, 300);
        }
        
        percentElement.textContent = Math.floor(percent);
    }, interval);
});