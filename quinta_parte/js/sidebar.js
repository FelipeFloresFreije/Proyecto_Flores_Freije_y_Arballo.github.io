document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('sidebarClose');

    if (!sidebar || !openBtn) return;

    function setOpen(open) {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('show', open);
        sidebar.setAttribute('aria-hidden', String(!open));
        openBtn.setAttribute('aria-expanded', String(open));
        (open ? closeBtn : openBtn).focus();
    }

    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    overlay.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('profileBtn');
    const panel = document.getElementById('profilePanel');
    const overlay = document.getElementById('profileOverlay');
    const closeBtn = document.getElementById('profileClose');
    if (!btn || !panel || !overlay || !closeBtn) return;

    function open() {
        panel.classList.add('open');
        overlay.classList.add('show');
        panel.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
        panel.classList.remove('open');
        overlay.classList.remove('show');
        panel.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
    }

    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });
});