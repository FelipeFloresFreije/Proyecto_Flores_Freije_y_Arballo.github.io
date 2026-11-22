

class GameAudio {
    constructor() {
        this.menu = new Audio('assets/quinta_parte/music/menu.mp3');
        this.gameplay = new Audio('assets/quinta_parte/music/gameplay.mp3');
        this.gameover = new Audio('assets/quinta_parte/music/gameover.mp3');
        this.victoria = new Audio('assets/quinta_parte/music/victory.wav');

        this.menu.loop = true;
        this.gameplay.loop = true;
        this.gameover.loop = false;
        this.victoria.loop = false;

        this.menu.volume = 0.25;
        this.gameplay.volume = 0.25;
        this.gameover.volume = 0.35;
        this.victoria.volume = 0.35;

        this.actual = null;
    }

    reproducir(cancion) {
        if (this.actual === cancion && !cancion.paused) {
            return;
        }

        this.detenerTodas();

        cancion.currentTime = 0;

        cancion.play()
            .then(() => {
                this.actual = cancion;
            })
            .catch(error => {
                this.actual = null;
                console.error('Error al reproducir:', cancion.src, error);
            });
    }

    detenerTodas() {
        [this.menu, this.gameplay, this.gameover, this.victoria].forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });

        this.actual = null;
    }

    actualizar(estado) {
        if (estado === 'esperando') {
            this.reproducir(this.menu);
        } else if (estado === 'jugando') {
            this.reproducir(this.gameplay);
        } else if (estado === 'terminado') {
            this.reproducir(this.gameover);
        } else if (estado === 'victoria') {
            this.reproducir(this.victoria);
        }
    }
}



class RunnerController {
    constructor(contenedor, modo = 'normal') {
        this.model = new RunnerModel(modo);
        this.view = new RunnerView(contenedor, this.model);
        this.audio = new GameAudio();

        this.ultimoTiempo = 0;
        this.rafId = null;
        this.estadoAnterior = null;

        this.onTecla = this.onTecla.bind(this);
        this.onClick = this.onClick.bind(this);
        this.loop = this.loop.bind(this);
    }

    iniciar() {
        document.addEventListener('keydown', this.onTecla);
        this.view.canvas.addEventListener('mousedown', this.onClick);
        this.view.canvas.focus();

        this.actualizarMusica();

        this.ultimoTiempo = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    detener() {
        cancelAnimationFrame(this.rafId);
        document.removeEventListener('keydown', this.onTecla);
        this.view.canvas.removeEventListener('mousedown', this.onClick);

        this.audio.detenerTodas();
    }

    onTecla(e) {
        if (e.code !== 'Space' && e.code !== 'ArrowUp') return;

        const destino = e.target;

        if (destino && destino.closest &&
            destino.closest('input, textarea, select')) return;

        e.preventDefault();

        if (!e.repeat) {
            this.accion();
        }
    }

    onClick() {
        this.accion();
    }

    accion() {
        const m = this.model;

        if (m.estado === 'esperando') {
            m.iniciar();
            m.aletear();

        } else if (m.estado === 'jugando') {
            m.aletear();

        } else if (m.estado === 'terminado' || m.estado === 'victoria') {
            m.reiniciar();
        }

        this.actualizarMusica();
    }

    actualizarMusica() {
        const estado = this.model.estado;

        if (estado !== this.estadoAnterior) {
            this.audio.actualizar(estado);
            this.estadoAnterior = estado;
        }
    }

    loop(ahora) {
        const dt = Math.min((ahora - this.ultimoTiempo) / 1000, 0.05);
        this.ultimoTiempo = ahora;

        this.model.actualizar(dt);

        this.actualizarMusica();

        this.view.render(this.model);

        this.rafId = requestAnimationFrame(this.loop);
    }
}


// Arranque: el botón "Jugar" de la portada reemplaza la imagen por el juego.
document.addEventListener('DOMContentLoaded', function () {
    const stage = document.getElementById('gameStage');
    const boton = stage ? stage.querySelector('.game-play') : null;
    const selector = stage ? stage.querySelector('#gameMode') : null;

    if (!boton) return;

    let runner = null;

    boton.addEventListener('click', function () {
        if (runner) return;

        const modo = selector ? selector.value : 'normal';

        runner = new RunnerController(stage, modo);
        runner.iniciar();
    });
});