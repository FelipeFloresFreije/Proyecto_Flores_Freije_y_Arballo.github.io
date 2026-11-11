
/* ==========================================================
   PEG SOLITAIRE - VIEW
   ========================================================== */

//Se encarga de todo lo visual: canvas, imágenes, HUD, pantallas y cartel de fin. No decide reglas del juego.
export class PegView {
    //Obtiene los elementos del DOM, calcula las medidas del tablero y prepara las imágenes.
    constructor() {

        // ----- ELEMENTOS DEL DOM -----

        this.canvas = document.getElementById('pegCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.btnPlay = document.getElementById('btnPlay');
        this.stageCover = document.getElementById('stageCover');

        this.pegHud = document.getElementById('pegHud');
        this.pegTiempo = document.getElementById('pegTiempo');
        this.pegFichas = document.getElementById('pegFichas');

        this.pegFin = document.getElementById('pegFin');
        this.pegFinTexto = document.getElementById('pegFinTexto');
        this.pegFinTitulo = document.getElementById('pegFinTitulo');

        this.btnAyuda = document.getElementById('btnAyuda');

        this.btnReiniciar = document.getElementById('btnReiniciar');
        this.btnJugarOtraVez = document.getElementById('btnJugarOtraVez');

        this.btnMenu = document.getElementById('btnMenu');
        this.btnMenuFin = document.getElementById('btnMenuFin');

        // ----- CONSTANTES VISUALES -----

        this.tamCelda = this.canvas.width / 7;
        this.radioFicha = this.tamCelda * 0.38;

        // ----- IMÁGENES -----

        this.imgFondo = new Image();
        this.imgFondo.src = 'assets/img/peg/tablero.jpg';

        this.imgsFicha = [new Image(), new Image(), new Image()];

        this.imgsFicha[0].src = 'assets/img/peg/ficha1.svg';
        this.imgsFicha[1].src = 'assets/img/peg/ficha2.svg';
        this.imgsFicha[2].src = 'assets/img/peg/ficha3.svg';

        // ----- ESTADO VISUAL -----
        this.modoAyuda = false;
    }

    // ----- CARGAR IMÁGENES -----
    // Espera a que todas las imágenes estén cargadas y luego ejecuta el callback. Si alguna falla, informa en consola cuál es la ruta que no se pudo cargar.
    cargarImagenes(callback) {

        const lista = [this.imgFondo, ...this.imgsFicha];

        let pendientes = lista.length;

        lista.forEach(img => {

            img.decode().then(() => { pendientes--;
                    if (pendientes === 0) {
                        callback();
                    }
                }).catch(() => {
                    console.error('No se pudo cargar la imagen: ' + img.src);});
        });
    }

    // ----- DIBUJO -----
    //Dibuja la imagen de fondo del tablero ocupando todo el canvas.
    dibujarFondo() {

        this.ctx.drawImage(this.imgFondo, 0, 0, this.canvas.width, this.canvas.height); 
    }

    /*
    * Dibuja una ficha recortada en círculo. Si está bloqueada y el modo ayuda está activo
    * se ve transparente, y si se intentó agarrar se sacude unos 300 ms.
    */
    dibujarFicha(ficha, tiempo = 0) {

        let dx = 0;

        if (ficha.sacudidaInicio) {
            const t = tiempo - ficha.sacudidaInicio;

            if (t < 300) {
                dx = Math.sin(t / 25) * 4;
            } else {
                ficha.sacudidaInicio = 0;
            }
        }

        this.ctx.save();

        this.ctx.beginPath();

        this.ctx.arc(ficha.x + dx, ficha.y, ficha.radio, 0, Math.PI * 2);

        this.ctx.clip();

        if (ficha.bloqueada && this.modoAyuda) {
            this.ctx.globalAlpha = 0.4;
        }

        this.ctx.drawImage(ficha.img, ficha.x + dx - ficha.radio, ficha.y - ficha.radio, ficha.radio * 2, ficha.radio * 2);

        this.ctx.restore();
    }

    /*
    * Dibuja los hints animados sobre cada destino válido:
    * un círculo que pulsa y una flecha que sube y baja.
    */
    dibujarHints(destinos, tiempo) {

        for (const d of destinos) {

            const x = d.col * this.tamCelda + this.tamCelda / 2;

            const y = d.fila * this.tamCelda + this.tamCelda / 2;

            const pulso = Math.sin(tiempo / 200) * 5;
            const rebote = Math.sin(tiempo / 150) * 6;

            // Círculo del destino

            this.ctx.beginPath();

            this.ctx.arc(x, y, this.radioFicha + pulso, 0, Math.PI * 2);

            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = '#0891B2';
            this.ctx.stroke();

            // Flecha del destino
            const yf = y - this.radioFicha - 14 + rebote;

            this.ctx.beginPath();

            this.ctx.moveTo(x - 10, yf - 10);
            this.ctx.lineTo(x + 10, yf - 10);
            this.ctx.lineTo(x, yf + 6);

            this.ctx.closePath();

            this.ctx.fillStyle = '#0891B2';

            this.ctx.fill();
        }
    }

    /*
    * Redibuja toda la escena en orden: fondo, fichas, hints y,
    * arriba de todo, la ficha que se está arrastrando.
    */
    dibujarTodo(model, fichaActiva, destinos, tiempo) {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.dibujarFondo();

        model.fichas.forEach(ficha => {
            if (ficha !== fichaActiva) {
                this.dibujarFicha(ficha, tiempo);
            }
        });

        this.dibujarHints(destinos, tiempo);

        if (fichaActiva) {
            this.dibujarFicha(fichaActiva, tiempo);
        }
    }

    // ----- HUD -----
    //Actualiza en pantalla el tiempo restante y la cantidad de fichas.
    actualizarHud(model) {

        const tiempoRestante = model.tiempoRestante;

        const mm = String(Math.floor(tiempoRestante / 60)).padStart(2, '0');

        const ss = String(tiempoRestante % 60).padStart(2, '0');

        this.pegTiempo.textContent = 'Tiempo: ' + mm + ':' + ss;

        this.pegTiempo.classList.toggle('blocka-urgente', tiempoRestante <= 30);

        this.pegFichas.textContent = 'Fichas: ' + model.obtenerCantidadFichas();
    }

    // ----- PANTALLAS -----

    //Muestra el HUD y oculta el cartel de fin al comenzar una partida.
    mostrarJuego() {

        this.pegFin.classList.add('is-hidden');
        this.pegHud.classList.remove('is-hidden');
    }

    /** Vuelve a la portada: oculta HUD, cartel de fin y canvas, y muestra la imagen con el botón Comenzar. */
    mostrarPortada() {
        
    this.pegHud.classList.add('is-hidden');
    this.pegFin.classList.add('is-hidden');
    this.canvas.classList.add('is-hidden');
    this.stageCover.classList.remove('is-hidden');
    this.btnPlay.classList.remove('is-hidden');
    }

    // Oculta la portada y el botón Comenzar, y muestra el canvas. 
    mostrarCanvas() {

        this.stageCover.classList.add('is-hidden');
        this.btnPlay.classList.add('is-hidden');
        this.canvas.classList.remove('is-hidden');
    }

    // Muestra el cartel de fin con el mensaje según cómo terminó la partida.
    mostrarFin(motivo, model) {

        if (motivo === 'victoria') {

            this.pegFinTitulo.textContent = '¡Ganaste!';

            this.pegFinTexto.textContent = 'Dejaste una sola ficha en el tablero.';

        } else if (motivo === 'tiempo') {

            this.pegFinTitulo.textContent = 'Se acabó el tiempo';

            this.pegFinTexto.textContent ='Te quedaron ' + model.obtenerCantidadFichas() + ' fichas.';
        } else {

            this.pegFinTitulo.textContent = 'Sin movimientos';

            this.pegFinTexto.textContent = 'Te quedaron ' + model.obtenerCantidadFichas() + ' fichas.';
        }

        this.pegFin.classList.remove('is-hidden');
    }

    // ----- AYUDA -----

    // Activa o desactiva el modo ayuda y actualiza el texto del botón.
    cambiarModoAyuda(estado) {

        this.modoAyuda = estado;

        this.btnAyuda.textContent = 'Ayuda: ' + (estado ? 'ON' : 'OFF');
    }
}
