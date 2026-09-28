// Manejar formularios
document.addEventListener('DOMContentLoaded', function() {
    
    // LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Aquí iría la validación/envío
            alert('Iniciando sesión...');
            // window.location.href = 'index.html';
        });
    }

    // REGISTER
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            registerForm.style.animation = 'scaleSuccess 0.6s ease-out';
            
            const message = document.createElement('p');
            message.textContent = '✓ ¡Cuenta creada exitosamente!';
            message.style.cssText = 'color: green; text-align: center; font-weight: bold; margin-top: 15px; font-size: 16px;';
            registerForm.appendChild(message);
            
            setTimeout(() => {
                registerForm.style.animation = '';
                message.remove();
                registerForm.reset();
            }, 2000);
        });
    }
});