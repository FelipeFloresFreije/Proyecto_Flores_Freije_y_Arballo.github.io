(function () {
    const SESSION_KEY = 'minijuegos_session';

    let session = null;
    try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {}

    document.addEventListener('DOMContentLoaded', function () {
        const box = document.getElementById('sidebarUser');
        if (box && session) {
            box.textContent = '';
            box.append(
                session.nombre + ' ' + session.apellido + '.',
                document.createElement('br'),
                '@' + (session.apodo || session.nombre)
            );
        }

        document.querySelectorAll('.sidebar-logout').forEach(function (link) {
            link.addEventListener('click', function () {
                localStorage.removeItem(SESSION_KEY);
            });
        });
    });
})();