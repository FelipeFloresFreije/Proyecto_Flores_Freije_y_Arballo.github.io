class GameAudio {
    constructor() {
        this.menu = new Audio('assets/quinta_parte/music/menu.mp3');
        this.gameplay = new Audio('assets/quinta_parte/music/gameplay.mp3');
        this.gameover = new Audio('assets/quinta_parte/music/gameover.mp3');
        this.victoria = new Audio('assets/quinta_parte/music/victory.wav');
        this.newRecord = new Audio('assets/quinta_parte/music/new-record.wav');

        this.menu.loop = true;
        this.gameplay.loop = true;
        this.gameover.loop = false;
        this.victoria.loop = false;
        this.newRecord.loop = false;

        this.menu.volume = 0.50;
        this.gameplay.volume = 0.25;
        this.gameover.volume = 0.35;
        this.victoria.volume = 0.35;
        this.newRecord.volume = 0.50;

        this.actual = null;
    }

    reproducir(cancion) {
        if (this.actual === cancion && !cancion.paused){ 
            return;
        }

        this.detenerTodas();
        this.actual = cancion;

        const promesa = cancion.play();
        if (promesa) {
            promesa.catch(error => {
                if (this.actual === cancion){ 
                    this.actual = null;
                }
                if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                    console.error('Error al reproducir:', cancion.src, error);
                }
            });
        }
    }

    detenerTodas() {
        [this.menu, this.gameplay, this.gameover, this.victoria, this.newRecord].forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });

        this.actual = null;
    }

    actualizar(estado, nuevoRecord = false) {
        if (estado === 'esperando') {
            this.reproducir(this.menu);
        } else if (estado === 'jugando') {
            this.reproducir(this.gameplay);
        } else if (estado === 'terminado') {
            this.reproducir(nuevoRecord ? this.newRecord : this.gameover);
        } else if (estado === 'victoria') {
            this.reproducir(this.victoria);
        }else if (estado === 'explotando'){ 
            this.detenerTodas();
        }    
    }
}



class RunnerController {
    // alSalir: función opcional que se llama al apretar M o Esc (volver al menú).
    constructor(contenedor, modo = 'normal', personaje = 'murcielago', alSalir = null) {
        this.model = new RunnerModel(modo, personaje);
        this.view = new RunnerView(contenedor, this.model);
        this.audio = new GameAudio();
        this.alSalir = alSalir;

        this.ultimoTiempo = 0;
        this.rafId = null;
        this.estadoAnterior = null;

        this.tGolpePrev = this.model.tGolpe;
        this.estadoFx = null;

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
        const destino = e.target;

        // Si el usuario está escribiendo (comentarios, buscador), no es una tecla del juego.
        if (destino && destino.closest && destino.closest('input, textarea, select')) { 
            return;
        }

        if (e.code === 'KeyM' && this.alSalir) {
            e.preventDefault();
            this.alSalir();
            return;
        }

        if (e.code !== 'Space' && e.code !== 'ArrowUp') return;

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
            this.audio.actualizar(estado, this.model.nuevoRecord);
            this.estadoAnterior = estado;
        }
    }

    loop(ahora) {
        const dt = Math.min((ahora - this.ultimoTiempo) / 1000, 0.05);
        this.ultimoTiempo = ahora;

        this.model.actualizar(dt);

        this.actualizarEfectos();

        this.actualizarMusica();

        this.view.render(this.model);

        this.rafId = requestAnimationFrame(this.loop);
    }

    efecto(clase) {
        const c = this.view.canvas;
        c.classList.remove(clase);
        void c.offsetWidth;          // reinicia la animación
        c.classList.add(clase);
    }

    actualizarEfectos() {
        const m = this.model;
        const c = this.view.canvas;

        // tGolpe vuelve a 0 cuando el enemigo te toca
        if (m.tGolpe < this.tGolpePrev) this.efecto('fx-hit');
        this.tGolpePrev = m.tGolpe;

        if (m.estado !== this.estadoFx) {
            c.classList.remove('fx-crash', 'fx-hit');
            if (m.estado === 'explotando') this.efecto('fx-crash');
            this.estadoFx = m.estado;
        }
    }
}


// Selector de personaje: se arma a partir de PERSONAJES (runner-view.js),
// así que para agregar un personaje alcanza con sumarlo ahí.
function crearSelectorPersonaje(elegido) {
    const grupo = document.createElement('fieldset');
    grupo.className = 'char-picker';

    let html = '<legend class="card-text">Elegí tu personaje</legend>';
    Object.keys(PERSONAJES).forEach(function (id) {
        const p = PERSONAJES[id];
        html += '<label class="char-option">' +
            '<input type="radio" name="personaje" value="' + id + '"' +
            (id === elegido ? ' checked' : '') + '>' +
            '<span class="char-thumb" style="background-image:url(\'' + p.img + '\');' +
            'background-size:' + (p.frames * 100) + '% 100%;filter:' + p.filtro + ';' +
            '--n:' + p.frames + ';' +
            (p.frames > 1 ? 'animation-timing-function:steps(' + p.frames + ')' : 'animation:none') +
            '"></span>' +
            '</label>';
    });

    grupo.innerHTML = html;
    return grupo;
}


// Arranque: el botón "Jugar" de la portada reemplaza la imagen por el juego.
// M o Esc durante la partida vuelven a la portada para cambiar modo o personaje.
document.addEventListener('DOMContentLoaded', function () {
    const stage = document.getElementById('gameStage');
    if (!stage || !stage.querySelector('.game-play')) return;

    let runner = null;
    let ultimoModo = 'normal';
    let ultimoPersonaje = 'murcielago';

    function montarPortada() {
        const menu = stage.querySelector('.game-menu');
        if (menu && !stage.querySelector('.char-picker')) {
            stage.insertBefore(crearSelectorPersonaje(ultimoPersonaje), menu);
        }

        const boton = stage.querySelector('.game-play');
        const selector = stage.querySelector('#gameMode');
        if (selector) selector.value = ultimoModo;

        boton.addEventListener('click', function () {
            const elegido = stage.querySelector('input[name="personaje"]:checked');

            ultimoModo = selector ? selector.value : 'normal';
            ultimoPersonaje = elegido ? elegido.value : 'murcielago';

            runner = new RunnerController(stage, ultimoModo, ultimoPersonaje, volverAlMenu);
            runner.iniciar();
        });
    }

    function volverAlMenu() {
        if (!runner) return;

        runner.detener();
        runner = null;

        stage.innerHTML = portadaHTML;
        montarPortada();
    }

    // Se guarda la portada original (con la imagen de fondo y el menú) para poder restaurarla.
    const portadaHTML = stage.innerHTML;

    montarPortada();
});
