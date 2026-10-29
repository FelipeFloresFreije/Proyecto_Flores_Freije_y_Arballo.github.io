/* ==========================================================
   PEG SOLITAIRE
   ========================================================== */

// ----- ELEMENTOS DEL DOM -----
const canvas = document.getElementById('pegCanvas');     
const ctx = canvas.getContext('2d');                     
const btnPlay = document.getElementById('btnPlay');       
const stageCover = document.getElementById('stageCover');  

// ----- CONSTANTES DEL TABLERO -----
const FILAS = 7;                          
const COLUMNAS = 7;                        
const TAM_CELDA = canvas.width / COLUMNAS;  
const RADIO_FICHA = TAM_CELDA * 0.38;      

// Tablero inicial: -1 = fuera del tablero, 0 = casilla vacía, 1 = casilla con ficha
const tableroInicial = [
    [-1, -1,  1,  1,  1, -1, -1],
    [-1, -1,  1,  1,  1, -1, -1],
    [ 1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  0,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1],
    [-1, -1,  1,  1,  1, -1, -1],
    [-1, -1,  1,  1,  1, -1, -1]
];

// Direcciones de salto permitidas: arriba, abajo, izquierda, derecha
const DIRECCIONES = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// ----- ESTADO DEL JUEGO -----
let fichas = [];        
let tablero = [];      

// ----- ESTADO DEL DRAG AND DROP -----
let fichaActiva = null;  
let destinos = [];          
let offsetX = 0;        
let offsetY = 0;           
let juegoTerminado = false; 
let animando = false;       

// ----- IMÁGENES -----
const imgFondo = new Image();  
imgFondo.src = 'assets/img/peg/tablero.jpg';

const imgsFicha = [new Image(), new Image()];

imgsFicha[0].src = 'assets/img/peg/ficha1.svg';
imgsFicha[1].src = 'assets/img/peg/ficha2.svg'; 

// ----- HUD, TIMER Y FIN -----
const TIEMPO_LIMITE = 300;
const pegHud = document.getElementById('pegHud');
const pegTiempo = document.getElementById('pegTiempo');
const pegFichas = document.getElementById('pegFichas');
const pegFin = document.getElementById('pegFin');
const pegFinTexto = document.getElementById('pegFinTexto');
const pegFinTitulo = document.getElementById('pegFinTitulo');
let tiempoRestante = TIEMPO_LIMITE;
let intervaloTimer = null;

/**
 * Espera a que todas las imágenes estén cargadas y luego ejecuta el callback.
 * Si alguna falla, informa en consola cuál es la ruta que no se pudo cargar.
 * @param {HTMLImageElement[]} lista - imágenes a esperar
 * @param {Function} callback - función a ejecutar cuando todas estén listas
 */
function cargarImagenes(lista, callback) {
    let pendientes = lista.length;
    lista.forEach(img => {
        img.decode()
            .then(() => { if (--pendientes === 0) callback(); })
            .catch(() => console.error('No se pudo cargar la imagen: ' + img.src));
    });
}

/* ==========================================================
   CLASE FICHA
   ========================================================== */
class Ficha {
    /**
     * Crea una ficha en la casilla indicada.
     * @param {number} fila - fila de la matriz donde está la ficha
     * @param {number} col - columna de la matriz donde está la ficha
     * @param {HTMLImageElement} img - imagen con la que se dibuja
     */
    constructor(fila, col, img) {
        this.fila = fila;
        this.col = col;
        this.img = img;
        this.radio = RADIO_FICHA;
        this.x = col * TAM_CELDA + TAM_CELDA / 2;
        this.y = fila * TAM_CELDA + TAM_CELDA / 2;
    }

    /** Dibuja la ficha con su imagen recortada en forma de círculo. */
    dibujar() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.clip(); // todo lo que se dibuje después queda limitado al círculo
        ctx.drawImage(this.img, this.x - this.radio, this.y - this.radio,
                      this.radio * 2, this.radio * 2);
        ctx.restore();
    }

    /**
     * Indica si un punto cae dentro de la ficha (sirve para detectar el click).
     * @param {number} px - coordenada X del punto
     * @param {number} py - coordenada Y del punto
     * @returns {boolean} true si el punto está dentro del círculo de la ficha
     */
    contiene(px, py) {
        return Math.hypot(px - this.x, py - this.y) <= this.radio;
    }

    /**
     * Ubica la ficha en el centro de la casilla indicada.
     * También se usa para devolverla a su lugar cuando el movimiento es inválido.
     * @param {number} fila - fila destino
     * @param {number} col - columna destino
     */
    colocarEn(fila, col) {
        this.fila = fila;
        this.col = col;
        this.x = col * TAM_CELDA + TAM_CELDA / 2;
        this.y = fila * TAM_CELDA + TAM_CELDA / 2;
    }
}

/* ==========================================================
   CREACIÓN Y DIBUJO
   ========================================================== */

/** Recorre la matriz inicial y crea una Ficha por cada casilla con valor 1. */
function crearFichas() {
    fichas = [];
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLUMNAS; c++) {
            if (tableroInicial[f][c] == 1) {
                fichas.push(new Ficha(f, c, imgsFicha[Math.floor(Math.random() * imgsFicha.length)]));
            }
        }
    }
}

/** Dibuja la imagen de fondo del tablero ocupando todo el canvas. */
function dibujarFondo() {
    ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);
}

/**
 * Redibuja toda la escena en orden: fondo, fichas, hints y,
 * arriba de todo, la ficha que se está arrastrando.
 * @param {number} tiempo - tiempo en ms (lo usan los hints para animarse)
 */
function dibujarTodo(tiempo = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dibujarFondo();
    fichas.forEach(f => { if (f !== fichaActiva) f.dibujar(); });
    dibujarHints(tiempo);
    if (fichaActiva) fichaActiva.dibujar();
}

/**
 * Loop de animación: redibuja en cada frame para que los hints se muevan.
 * @param {number} tiempo - timestamp que entrega requestAnimationFrame
 */
function animar(tiempo) {
    dibujarTodo(tiempo);
    requestAnimationFrame(animar);
}

/**
 * Inicia (o reinicia) la partida: copia el tablero inicial,
 * resetea el estado, crea las fichas y arranca el loop de animación una sola vez.
 */
function iniciarJuego() {
    tablero = tableroInicial.map(fila => fila.slice()); // copia, no referencia
    juegoTerminado = false;
    fichaActiva = null;
    destinos = [];
    crearFichas();
    pegFin.classList.add('is-hidden');   
    pegHud.classList.remove('is-hidden'); 
    iniciarTimer();
    if (!animando) {
        animando = true;
        requestAnimationFrame(animar);
    }
}

/* ==========================================================
   LÓGICA DEL JUEGO
   ========================================================== */

/**
 * Indica si una posición está dentro de los límites de la matriz.
 * @param {number} fila - fila a verificar
 * @param {number} col - columna a verificar
 * @returns {boolean} true si la posición existe en la matriz
 */
function dentroDelTablero(fila, col) {
    return fila >= 0 && fila < FILAS && col >= 0 && col < COLUMNAS;
}

/**
 * Calcula los saltos válidos desde una casilla: tiene que haber una ficha
 * contigua y una casilla vacía justo detrás de ella, en línea recta.
 * @param {number} fila - fila de la ficha
 * @param {number} col - columna de la ficha
 * @returns {Array} lista de objetos {fila, col, saltadaFila, saltadaCol}
 *          con el destino y la ficha que sería saltada
 */
function calcularDestinos(fila, col) {
    const lista = [];
    for (const [df, dc] of DIRECCIONES) {
        const medioF = fila + df, medioC = col + dc;    
        const destF = fila + 2 * df, destC = col + 2 * dc;
        if (dentroDelTablero(destF, destC) &&
            tablero[medioF][medioC] === 1 &&
            tablero[destF][destC] === 0) {
            lista.push({ fila: destF, col: destC,
                         saltadaFila: medioF, saltadaCol: medioC });
        }
    }
    return lista;
}

/**
 * Revisa todo el tablero para saber si queda al menos un movimiento posible.
 * @returns {boolean} true si alguna ficha puede saltar
 */
function hayMovimientos() {
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLUMNAS; c++) {
            if (tablero[f][c] == 1 && calcularDestinos(f, c).length > 0) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Ejecuta un salto: actualiza la matriz, elimina la ficha saltada
 * y mueve la ficha activa a su nueva casilla.
 * @param {Ficha} ficha - ficha que se mueve
 * @param {Object} destino - destino elegido (viene de calcularDestinos)
 */
function aplicarMovimiento(ficha, destino) {
    tablero[ficha.fila][ficha.col] = 0;                        
    tablero[destino.saltadaFila][destino.saltadaCol] = 0;         
    tablero[destino.fila][destino.col] = 1;                     

    // Quita del arreglo de fichas la que fue saltada
    fichas = fichas.filter(f =>
        !(f.fila === destino.saltadaFila && f.col === destino.saltadaCol));

    ficha.colocarEn(destino.fila, destino.col);
}

/** Verifica después de cada movimiento si el juego terminó (sin movimientos posibles). */
function verificarFin() {
    if (!hayMovimientos()) {
        terminarJuego(fichas.length === 1 ? 'victoria' : 'sinMovimientos');
    }
}

/**
 * Dibuja los hints animados sobre cada destino válido:
 * un círculo que pulsa y una flecha que sube y baja.
 * @param {number} tiempo - tiempo en ms, usado para calcular la animación
 */
function dibujarHints(tiempo) {
    for (const d of destinos) {
        // Centro de la casilla destino
        const x = d.col * TAM_CELDA + TAM_CELDA / 2;
        const y = d.fila * TAM_CELDA + TAM_CELDA / 2;
        const pulso = Math.sin(tiempo / 200) * 5;
        const rebote = Math.sin(tiempo / 150) * 6; 

        // Círculo pulsante
        ctx.beginPath();
        ctx.arc(x, y, RADIO_FICHA + pulso, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0891B2';
        ctx.stroke();

        // Flecha que baja y sube sobre el destino
        const yf = y - RADIO_FICHA - 14 + rebote;
        ctx.beginPath();
        ctx.moveTo(x - 10, yf - 10);
        ctx.lineTo(x + 10, yf - 10);
        ctx.lineTo(x, yf + 6);
        ctx.closePath();
        ctx.fillStyle = '#0891B2';
        ctx.fill();
    }
}

/* ==========================================================
   EVENTOS
   ========================================================== */

// Click en "Comenzar": oculta portada y botón, muestra el canvas e inicia el juego
btnPlay.addEventListener('click', () => {
    stageCover.classList.add('is-hidden');
    btnPlay.classList.add('is-hidden');
    canvas.classList.remove('is-hidden');
    cargarImagenes([imgFondo, ...imgsFicha], iniciarJuego);
});

/**
 * Convierte la posición del mouse a coordenadas internas del canvas,
 * compensando que el CSS puede escalar el canvas en pantalla.
 * @param {MouseEvent} e - evento del mouse
 * @returns {{x: number, y: number}} posición en coordenadas del canvas
 */
function posMouse(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height)
    };
}

// MouseDown: busca la ficha clickeada y calcula sus destinos válidos
canvas.addEventListener('mousedown', (e) => {
    if (juegoTerminado) {
        return;
    }

    const { x, y } = posMouse(e);

    // Busca desde la última ficha dibujada, que es la que está visualmente arriba
    const f = fichas.slice().reverse().find(f => f.contiene(x, y));

    if (!f) {
        return; // el click no cayó sobre ninguna ficha
    }

    const posibles = calcularDestinos(f.fila, f.col);

    if (posibles.length === 0) {
        return; // ficha sin movimientos: no se puede agarrar
    }

    fichaActiva = f;
    destinos = posibles;
    // Guarda la distancia entre el mouse y el centro para que la ficha no "salte"
    offsetX = x - f.x;
    offsetY = y - f.y;
});

// MouseMove: la ficha activa sigue al mouse
canvas.addEventListener('mousemove', (e) => {
    if (!fichaActiva) {
        return;
    }
    const { x, y } = posMouse(e);

    fichaActiva.x = x - offsetX;
    fichaActiva.y = y - offsetY;
});

// MouseUp: si se suelta sobre un destino válido se hace el salto; si no, la ficha vuelve
canvas.addEventListener('mouseup', (e) => {
    if (!fichaActiva) {
        return;
    }
    const { x, y } = posMouse(e);

    // Busca si el mouse quedó dentro de alguna casilla destino válida
    const destino = destinos.find(d => {
        const cx = d.col * TAM_CELDA + TAM_CELDA / 2;
        const cy = d.fila * TAM_CELDA + TAM_CELDA / 2;
        return Math.hypot(x - cx, y - cy) <= TAM_CELDA / 2;
    });

    if (destino) {
        aplicarMovimiento(fichaActiva, destino);
        actualizarHud();
        verificarFin();
    } else {
        // Movimiento inválido: la ficha vuelve a su casilla original
        fichaActiva.colocarEn(fichaActiva.fila, fichaActiva.col);
    }
    fichaActiva = null;
    destinos = [];
});

// MouseLeave: si el mouse sale del canvas con una ficha agarrada, la devuelve a su lugar
canvas.addEventListener('mouseleave', () => {
    if (!fichaActiva) {
        return;
    }
    fichaActiva.colocarEn(fichaActiva.fila, fichaActiva.col);
    fichaActiva = null;
    destinos = [];
});

function actualizarHud(){
    const mm = String(Math.floor(tiempoRestante / 60)).padStart(2, '0');
    const ss = String(tiempoRestante % 60).padStart(2, '0');

    pegTiempo.textContent = 'Tiempo: ' + mm + ':' + ss;
    pegTiempo.classList.toggle('blocka-urgente', tiempoRestante <= 30);
    pegFichas.textContent = 'Fichas: ' + fichas.length; 
}

function detenerTimer(){
    clearInterval(intervaloTimer);
}

function iniciarTimer(){
    detenerTimer();
    tiempoRestante = TIEMPO_LIMITE;
    actualizarHud();
    intervaloTimer = setInterval(() => {
        tiempoRestante--;
        actualizarHud();
        if(tiempoRestante <= 0){
            terminarJuego('tiempo');
        }
    }, 1000);
}

/**
 * Finaliza la partida y muestra el cartel correspondiente.
 * @param {string} motivo - 'victoria', 'sinMovimientos' o 'tiempo'
 */

function terminarJuego(motivo) {
    juegoTerminado = true;
    detenerTimer();
    fichaActiva = null;
    destinos = [];

    if (motivo === 'victoria') {
        pegFinTitulo.textContent = '¡Ganaste!';
        pegFinTexto.textContent = 'Dejaste una sola ficha en el tablero.';
    } else if (motivo === 'tiempo') {
        pegFinTitulo.textContent = 'Se acabó el tiempo';
        pegFinTexto.textContent = 'Te quedaron ' + fichas.length + ' fichas.';
    } else {
        pegFinTitulo.textContent = 'Sin movimientos';
        pegFinTexto.textContent = 'Te quedaron ' + fichas.length + ' fichas.';
    }
    pegFin.classList.remove('is-hidden');
}

document.getElementById('btnReiniciar').addEventListener('click', iniciarJuego);
document.getElementById('btnJugarOtraVez').addEventListener('click', iniciarJuego);