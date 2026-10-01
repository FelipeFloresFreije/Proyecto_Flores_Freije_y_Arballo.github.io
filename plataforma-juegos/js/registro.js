const USERS_KEY = 'minijuegos_users';
const SESSION_KEY = 'minijuegos_session';
const HOME_PAGE = 'index.html';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// esta es una cuenta para poder probar el login

function seedDemoUser() {
    if (getUsers().length === 0) {
        saveUsers([{
            nombre: 'Bruce', apellido: 'Wayne', apodo: 'Batman fan',
            email: 'demo@minijuegos.com', password: 'Batman123'
        }]);
    }
}

function anchorOf(input) {
    return input.closest('.checkbox-row') || input;
}

function clearError(input) {
    input.classList.remove('invalid');
    const next = anchorOf(input).nextElementSibling;
    if (next && next.classList.contains('field-error')) next.remove();
}

function showError(input, message) {
    clearError(input);
    input.classList.add('invalid');

    const p = document.createElement('p');
    p.className = 'field-error';
    p.setAttribute('role', 'alert');
    p.textContent = message;

    anchorOf(input).insertAdjacentElement('afterend', p);
}

function showFormMessage(form, message) {
    clearFormMessage(form);

    const p = document.createElement('p');
    p.className = 'form-message';
    p.setAttribute('role', 'alert');
    p.textContent = message;

    form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', p);
}

function clearFormMessage(form) {
    const old = form.querySelector('.form-message');
    if (old) old.remove();
}


document.addEventListener('DOMContentLoaded', function () {

    seedDemoUser();

    // LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const f = loginForm.elements;

        loginForm.addEventListener('input', (e) => {
            clearError(e.target);
            clearFormMessage(loginForm);
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            [f.email, f.password].forEach(clearError);
            clearFormMessage(loginForm);

            const email = f.email.value.trim().toLowerCase();
            let valid = true;

            if (!EMAIL_RE.test(email)) {
                showError(f.email, 'Ingresá un email válido.');
                valid = false;
            }
            if (!f.password.value) {
                showError(f.password, 'Ingresá tu contraseña.');
                valid = false;
            }
            if (!valid) return;

            const user = getUsers().find(
                (u) => u.email === email && u.password === f.password.value
            );

            if (!user) {
                showFormMessage(loginForm, 'Email o contraseña incorrectos. Si todavía no tenés cuenta, creala primero.');
                return;
            }

            localStorage.setItem(SESSION_KEY, JSON.stringify({
                nombre: user.nombre,
                apellido: user.apellido,
                apodo: user.apodo,
                email: user.email
            }));

            window.location.href = HOME_PAGE;
        });
    }

    // REGISTRO
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const f = registerForm.elements;
        const overlay = document.getElementById('success-overlay');
        const fields = [f.nombre, f.apellido, f.email, f.password, f['password-repeat'], f.terms];

        registerForm.addEventListener('input', (e) => clearError(e.target));

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            fields.forEach(clearError);

            let valid = true;
            function fail(input, message) {
                if (valid) input.focus();
                showError(input, message);
                valid = false;
            }

            const email = f.email.value.trim().toLowerCase();
            const pass = f.password.value;

            if (!f.nombre.value.trim()) fail(f.nombre, 'Ingresá tu nombre.');
            if (!f.apellido.value.trim()) fail(f.apellido, 'Ingresá tu apellido.');

            if (!EMAIL_RE.test(email)) {
                fail(f.email, 'Ingresá un email válido.');
            } else if (getUsers().some((u) => u.email === email)) {
                fail(f.email, 'Ya existe una cuenta con ese email.');
            }

            if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) {
                fail(f.password, 'Mínimo 8 caracteres, con letras y números.');
            }
            if (f['password-repeat'].value !== pass) {
                fail(f['password-repeat'], 'Las contraseñas no coinciden.');
            }
            if (!f.terms.checked) {
                fail(f.terms, 'Tenés que aceptar los términos y condiciones.');
            }

            if (!valid) return;

            const users = getUsers();
            users.push({
                nombre: f.nombre.value.trim(),
                apellido: f.apellido.value.trim(),
                apodo: f.apodo.value.trim(),
                email: email,
                password: pass
            });
            saveUsers(users);

            if (overlay) overlay.classList.add('show');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        });
    }
});