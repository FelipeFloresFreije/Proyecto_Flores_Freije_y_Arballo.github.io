document.addEventListener('DOMContentLoaded', function () {

    const stage = document.getElementById('gameStage');
    const form = document.getElementById('commentForm');
    const input = document.getElementById('comment');
    const list = document.getElementById('commentList');

    document.querySelectorAll('.game-action').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const action = btn.dataset.action;

            if (action === 'fullscreen') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (stage.requestFullscreen) {
                    stage.requestFullscreen();
                }
                return;
            }

            if (action === 'like' || action === 'dislike') {
                const other = document.querySelector(
                    '.game-action[data-action="' + (action === 'like' ? 'dislike' : 'like') + '"]'
                );
                other.classList.remove('active');
            }

            btn.classList.toggle('active');
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const text = input.value.trim();
        if (!text) return;

        const comment = document.createElement('article');
        comment.className = 'comment comment-new';

        const author = document.createElement('div');
        author.className = 'comment-author';

        const avatar = document.createElement('img');
        avatar.src = 'assets/icons/user icon.svg';
        avatar.alt = '';
        avatar.className = 'icons';

        const name = document.createElement('span');
        name.className = 'small';
        name.textContent = 'Usuario';

        author.append(avatar, name);

        const body = document.createElement('p');
        body.className = 'small';
        body.textContent = '"' + text + '"';

        const time = document.createElement('span');
        time.className = 'comment-time';
        time.textContent = 'Ahora';

        comment.append(author, body, time);

        list.prepend(comment);
        input.value = '';
    });
});