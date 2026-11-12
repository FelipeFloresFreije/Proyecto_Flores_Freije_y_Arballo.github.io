import { PegModel } from '../model/peg-model.js';
import { PegView } from '../view/peg-view.js';
/* ==========================================================
   PEG SOLITAIRE - CONTROLLER
   ========================================================== */

// Conecta Model y View: escucha los eventos del usuario, maneja el drag and drop y el timer.
class PegController {

    // Guarda el modelo y la vista, inicializa el estado del drag and drop y registra los eventos.
    constructor(model, view) {

        this.model = model;
        this.view = view;

        // ----- ESTADO DEL DRAG AND DROP -----

        this.fichaActiva = null;
        this.destinos = [];

        this.offsetX = 0;
        this.offsetY = 0;

        // ----- ESTADO DEL JUEGO -----

        this.animando = false;
        this.intervaloTimer = null;

        this.intentosFueraTablero = 0;

        this.configurarEventos();
    }

    // ----- EVENTOS -----

    //Registra los listeners del mouse sobre el canvas y de todos los botones.
    configurarEventos() {

        const canvas = this.view.canvas;

        // Comenzar partida

        this.view.btnPlay.addEventListener('click', () => {

            this.view.mostrarCanvas();

            this.view.cargarImagenes(() => { this.iniciarJuego();});

            // Volver al menú (desde el HUD o desde el cartel de fin)
            this.view.btnMenu.addEventListener('click', () => this.volverAlMenu());
            this.view.btnMenuFin.addEventListener('click', () => this.volverAlMenu());

        });

        // Seleccionar ficha

        canvas.addEventListener('mousedown', e => {
            this.seleccionarFicha(e);
        });

        // Arrastrar ficha

        canvas.addEventListener('mousemove', e => {
            this.arrastrarFicha(e);
        });

        // Soltar ficha

        canvas.addEventListener('mouseup', e => {
            this.soltarFicha(e);
        });

        // Si el mouse sale del canvas

        canvas.addEventListener('mouseleave', () => {
            this.devolverFicha();
        });

        // Modo ayuda

        this.view.btnAyuda.addEventListener('click', () => {

            const nuevoEstado = !this.view.modoAyuda;

            this.view.cambiarModoAyuda(nuevoEstado);
        });

        // Reiniciar partida

        this.view.btnReiniciar.addEventListener('click', () => {
            this.iniciarJuego();
        });

        // Jugar otra vez

        this.view.btnJugarOtraVez.addEventListener('click', () => {
            this.iniciarJuego();
        });
    }

    // ----- INICIAR JUEGO -----

    // Inicia (o reinicia) la partida: resetea el modelo y el estado del drag, arranca el timer y la animación.
    iniciarJuego() {

        this.model.iniciarJuego();

        this.fichaActiva = null;
        this.destinos = [];

        this.view.mostrarJuego();
        this.view.actualizarHud(this.model);

        this.iniciarTimer();
        this.intentosFueraTablero = 0;
        if (!this.animando) {

            this.animando = true;

            requestAnimationFrame(tiempo => {
                this.animar(tiempo);
            });
        }
    }

    // ----- ANIMACIÓN -----

    //Loop de animación: redibuja la escena en cada frame para que los efectos se muevan.
    animar(tiempo) {

        this.view.dibujarTodo(this.model, this.fichaActiva, this.destinos, tiempo);

        requestAnimationFrame(t => {this.animar(t);});
    }

    // ----- POSICIÓN DEL MOUSE -----

    // Convierte la posición del mouse a coordenadas internas del canvas, compensando que el CSS puede escalar el canvas en pantalla.
    posMouse(e) {

        const r = this.view.canvas.getBoundingClientRect();

        return {
            x: (e.clientX - r.left) *
                (this.view.canvas.width / r.width),

            y: (e.clientY - r.top) *
                (this.view.canvas.height / r.height)
        };
    }

    // ----- SELECCIONAR FICHA -----

    //Mouse down: busca la ficha clickeada y calcula sus destinos válidos. Si la ficha no puede moverse, se sacude y no se agarra.
    seleccionarFicha(e) {

        if (this.model.juegoTerminado) {
            return;
        }

        const { x, y } = this.posMouse(e);

        const ficha = this.model.fichas.slice().reverse().find(f => f.contiene(x, y));

        if (!ficha) {
            return;
        }

        const posibles = this.model.calcularDestinos(ficha.fila, ficha.col);

        // Si no puede moverse, se sacude

        if (posibles.length === 0) {

            ficha.sacudidaInicio = performance.now();

            return;
        }

        this.fichaActiva = ficha;
        this.destinos = posibles;

        // Evita que la ficha salte al centro del mouse

        this.offsetX = x - ficha.x;
        this.offsetY = y - ficha.y;
    }

    // ----- ARRASTRAR FICHA -----

    //Mouse move: hace que la ficha activa siga al mouse.
    arrastrarFicha(e) {

        if (!this.fichaActiva) {
            return;
        }

        const { x, y } = this.posMouse(e);

        this.fichaActiva.x = x - this.offsetX;
        this.fichaActiva.y = y - this.offsetY;
    }

    // ----- SOLTAR FICHA -----

    //Mouse up: si se suelta sobre un destino válido hace el salto y verifica el fin; si no, la ficha vuelve a su casilla.
    soltarFicha(e) {

        if (!this.fichaActiva) {
            return;
        }

        const { x, y } = this.posMouse(e);

        const destino = this.destinos.find(d => {

            const cx = d.col * this.view.tamCelda + this.view.tamCelda / 2;

            const cy = d.fila * this.view.tamCelda + this.view.tamCelda / 2;

            return Math.hypot(x - cx, y - cy) <= this.view.tamCelda / 2;
        });

        if (destino) {

            this.model.aplicarMovimiento(this.fichaActiva, destino);

            this.view.actualizarHud(this.model.obtenerCantidadFichas(), this.model.tiempoRestante);

            const motivo = this.model.verificarFin();

            if (motivo) {
                this.terminarJuego(motivo);
            }

        } else {
            const fila = Math.floor(y / this.view.tamCelda);
            const col = Math.floor(x/this.view.tamCelda);

            if(
                fila >=0 && fila < 7 && col >= 0 && col < 7 &&
                this.model.tablero[fila][col] === -1
            ){
                this.intentosFueraTablero++;
                if (this.intentosFueraTablero > 3){
                   this.terminarJuego('fueraTablero'); 
                }
            }
            this.fichaActiva.colocarEn(
            this.fichaActiva.fila,
            this.fichaActiva.col,
            this.view.tamCelda);
        }

        this.fichaActiva = null;
        this.destinos = [];
    }

    // ----- DEVOLVER FICHA -----

    // Devuelve la ficha agarrada a su casilla original y limpia el estado del drag.
    devolverFicha() {

        if (!this.fichaActiva) {
            return;
        }

        this.fichaActiva.colocarEn(this.fichaActiva.fila, this.fichaActiva.col, this.model.tamCelda);

        this.fichaActiva = null;
        this.destinos = [];
    }

    // ----- TEMPORIZADOR -----

    // Detiene el temporizador del juego.
    detenerTimer() {

        clearInterval(this.intervaloTimer);

        this.intervaloTimer = null;
    }

    //Inicia el temporizador: descuenta un segundo por vez y termina la partida cuando se agota el tiempo.
    iniciarTimer() {

        this.detenerTimer();

        this.model.reiniciarTiempo();

        this.view.actualizarHud(this.model);

        this.intervaloTimer = setInterval(() => {

            const tiempoTerminado = this.model.actualizarTiempo();

            this.view.actualizarHud(this.model);

            if (tiempoTerminado) {
                this.terminarJuego('tiempo');
            }
        }, 1000);
    }

    // ----- FIN DE PARTIDA -----
    
    //Finaliza la partida, detiene el timer y muestra el cartel de fin.
    terminarJuego(motivo) {

        if (this.model.juegoTerminado) {
            return;
        }

        this.model.juegoTerminado = true;

        this.detenerTimer();

        this.devolverFicha();

        this.view.mostrarFin(motivo, this.model);
    }

    /** Abandona la partida: frena el timer, suelta la ficha y vuelve a la portada. */
    volverAlMenu() {
        this.detenerTimer();
        this.fichaActiva = null;
        this.destinos = [];
        this.model.juegoTerminado = true;   // bloquea clicks mientras no se juega
        this.view.mostrarPortada();
    }
}

// ----- CREACIÓN DEL MVC -----

const view = new PegView();

const model = new PegModel(view.tamCelda, view.imgsFicha);

const controller = new PegController(model, view);
