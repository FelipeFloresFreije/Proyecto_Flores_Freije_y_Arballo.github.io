document.addEventListener('DOMContentLoaded', function () {

    const stage = document.getElementById('gameStage');
    const form = document.getElementById('commentForm');
    const input = document.getElementById('comment');
    const list = document.getElementById('commentList');
    const charCount = document.getElementById('charCount');
    const commentCount = document.getElementById('commentCount');

    /* ---------- Acciones del reproductor ---------- */

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

    /* ---------- Comunidad ---------- */

    function updateCommentCount() {
        const n = list.querySelectorAll('.comment').length;
        commentCount.textContent = n + (n === 1 ? ' comentario' : ' comentarios');
    }

    function createComment(text) {
        const article = document.createElement('article');
        article.className = 'comment comment-new';

        const avatar = document.createElement('img');
        avatar.src = 'assets/icons/user icon.svg';
        avatar.alt = '';
        avatar.className = 'icons comment-avatar';

        const main = document.createElement('div');
        main.className = 'comment-main';

        const meta = document.createElement('div');
        meta.className = 'comment-meta';

        const name = document.createElement('span');
        name.className = 'small comment-name';
        name.textContent = 'Usuario';

        const time = document.createElement('span');
        time.className = 'comment-time';
        time.textContent = 'Ahora';

        meta.append(name, time);

        const body = document.createElement('p');
        body.className = 'small';
        body.textContent = '"' + text + '"';

        main.append(meta, body);

        const like = document.createElement('button');
        like.type = 'button';
        like.className = 'comment-like';
        like.setAttribute('aria-label', 'Me gusta este comentario');

        const likeIcon = document.createElement('img');
        likeIcon.src = 'assets/icons/pulgar-arriba.svg';
        likeIcon.alt = '';
        likeIcon.className = 'icons';

        const likeNum = document.createElement('span');
        likeNum.className = 'card-text';
        likeNum.textContent = '0';

        like.append(likeIcon, likeNum);

        article.append(avatar, main, like);
        return article;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const text = input.value.trim();
        if (!text) return;

        list.prepend(createComment(text));

        input.value = '';
        charCount.textContent = '0/' + input.maxLength;
        updateCommentCount();
    });

    input.addEventListener('input', function () {
        charCount.textContent = input.value.length + '/' + input.maxLength;
    });

    // like con contador (delegado: funciona también con comentarios nuevos)
    list.addEventListener('click', function (e) {
        const btn = e.target.closest('.comment-like');
        if (!btn) return;

        const num = btn.querySelector('span');
        const activo = btn.classList.toggle('active');
        num.textContent = Number(num.textContent) + (activo ? 1 : -1);
    });

    updateCommentCount();
});