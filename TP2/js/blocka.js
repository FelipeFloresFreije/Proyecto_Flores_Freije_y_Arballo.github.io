// ==========================================================
// BLOCKA
// - banco de imágenes con elección al azar
// - temporizador que arranca al elegir "Comenzar"
// - detección de victoria, récord por nivel y pantalla final
// ==========================================================

const canvas = document.getElementById('blockaCanvas');
const ctx = canvas.getContext('2d');
const cover = document.getElementById('stageCover');
const btnPlay = document.getElementById('btnPlay');
const stage = document.getElementById('gameStage');

const SIZE = canvas.width;
const HALF = SIZE / 2;

const IMAGENES = [
    'img1.jpg', 'img2.jpg', 'img3.jpg',
    'img4.jpg', 'img5.jpg', 'img6.jpg'
].map(nombre => 'assets/img/blocka/' + nombre);

const NIVELES = [
    { nombre: 'Escala de grises' },
    { nombre: 'Brillo' },
    { nombre: 'Negativo' }
];

// ---------- Estado ----------
let img = new Image();
let ultimaImagen = -1;
let rotaciones = [];      
let nivelActual = 0;
let jugando = false;
let inicio = 0;
let intervalo = null;
let records = cargarRecords(); 

// ==========================================================
// INTERFAZ: HUD (nivel, tiempo, récord) y panel de fin de nivel
// ==========================================================
const hud = document.createElement('div');
hud.className = 'blocka-hud is-hidden';
hud.innerHTML = `
    <span class="body" id="hudNivel"></span>
    <span class="body" id="hudTiempo">00:00.0</span>
    <span class="body" id="hudRecord"></span>
`;
stage.appendChild(hud);

const fin = document.createElement('div');
fin.className = 'blocka-fin is-hidden';
fin.innerHTML = `
    <h2 id="finTitulo"></h2>
    <p class="body" id="finTiempo"></p>
    <p class="body" id="finRecord"></p>
    <div class="blocka-fin-botones">
        <button type="button" class="btn btn-medium btn-primary" id="btnSiguiente">Siguiente nivel</button>
        <button type="button" class="btn btn-medium btn-secondary" id="btnMenu">Menú principal</button>
    </div>
`;
stage.appendChild(fin);

const hudNivel = document.getElementById('hudNivel');
const hudTiempo = document.getElementById('hudTiempo');
const hudRecord = document.getElementById('hudRecord');
const finTitulo = document.getElementById('finTitulo');
const finTiempo = document.getElementById('finTiempo');
const finRecord = document.getElementById('finRecord');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnMenu = document.getElementById('btnMenu');

// ==========================================================
// RÉCORDS (se guardan en el navegador)
// ==========================================================
function cargarRecords() {
    try {
        return JSON.parse(localStorage.getItem('blocka-records')) || {};
    } catch (e) {
        return {};
    }
}

function guardarRecords() {
    try {
        localStorage.setItem('blocka-records', JSON.stringify(records));
    } catch (e) {
        // si el navegador no deja guardar, el récord vale solo para esta sesión
    }
}

// ==========================================================
// TIEMPO
// ==========================================================
function formatear(ms) {
    const min = Math.floor(ms / 60000);
    const seg = ((ms % 60000) / 1000).toFixed(1);
    return String(min).padStart(2, '0') + ':' + seg.padStart(4, '0');
}

function iniciarTemporizador() {
    detenerTemporizador();
    inicio = performance.now();
    intervalo = setInterval(() => {
        hudTiempo.textContent = formatear(performance.now() - inicio);
    }, 100);
}

function detenerTemporizador() {
    if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
    }
}

// ==========================================================
// NIVEL
// ==========================================================
function cargarImagenAleatoria(alCargar) {
    let i;
    do {
        i = Math.floor(Math.random() * IMAGENES.length);
    } while (IMAGENES.length > 1 && i === ultimaImagen);   // no repetir la anterior
    ultimaImagen = i;

    img = new Image();
    img.onload = alCargar;
    img.onerror = () => console.error('No se pudo cargar la imagen:', IMAGENES[i]);
    img.src = IMAGENES[i];
}

function mezclar() {
    do {
        rotaciones = [0, 1, 2, 3].map(() => 90 * Math.floor(Math.random() * 4));
    } while (rotaciones.every(r => r === 0));   // que no arranque resuelto
}

function iniciarNivel() {
    fin.classList.add('is-hidden');
    jugando = false;

    hudNivel.textContent = 'Nivel ' + (nivelActual + 1);
    hudTiempo.textContent = '00:00.0';
    hudRecord.textContent = records[nivelActual]
        ? 'Récord: ' + formatear(records[nivelActual])
        : 'Sin récord';

    cargarImagenAleatoria(() => {
        mezclar();
        dibujar();
        jugando = true;
        iniciarTemporizador();   // el tiempo corre recién cuando la imagen está lista
    });
}

function estaResuelto() {
    return rotaciones.every(r => r === 0);
}

function ganar() {
    jugando = false;
    const tiempo = performance.now() - inicio;
    detenerTemporizador();
    hudTiempo.textContent = formatear(tiempo);

    const anterior = records[nivelActual];
    const esRecord = !anterior || tiempo < anterior;
    if (esRecord) {
        records[nivelActual] = tiempo;
        guardarRecords();
        hudRecord.textContent = 'Récord: ' + formatear(tiempo);
    }

    const ultimoNivel = nivelActual === NIVELES.length - 1;

    finTitulo.textContent = ultimoNivel ? '¡Completaste todos los niveles!' : '¡Nivel completado!';
    finTiempo.textContent = 'Tu tiempo: ' + formatear(tiempo);
    finRecord.textContent = esRecord ? '¡Nuevo récord!' : 'Récord: ' + formatear(anterior);

    btnSiguiente.classList.toggle('is-hidden', ultimoNivel);
    fin.classList.remove('is-hidden');
}

// ==========================================================
// DIBUJO
// ==========================================================
function dibujar() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const sw = img.width / 2;
    const sh = img.height / 2;

    for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const fila = Math.floor(i / 2);

        ctx.save();
        ctx.translate(col * HALF + HALF / 2, fila * HALF + HALF / 2);
        ctx.rotate(rotaciones[i] * Math.PI / 180);
        ctx.drawImage(img, col * sw, fila * sh, sw, sh, -HALF / 2, -HALF / 2, HALF, HALF);
        ctx.restore();
    }
}

// ==========================================================
// EVENTOS
// ==========================================================

// Botón "Comenzar": oculta portada y botón, muestra canvas y HUD
btnPlay.addEventListener('click', () => {
    cover.classList.add('is-hidden');
    btnPlay.classList.add('is-hidden');
    canvas.classList.remove('is-hidden');
    hud.classList.remove('is-hidden');

    nivelActual = 0;
    iniciarNivel();
});

canvas.addEventListener('mousedown', e => {
    if (!jugando) return;

    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (SIZE / r.width);
    const y = (e.clientY - r.top) * (SIZE / r.height);
    const i = Math.floor(y / HALF) * 2 + Math.floor(x / HALF);

    const giro = (e.button === 2) ? 90 : -90;
    rotaciones[i] = (rotaciones[i] + giro + 360) % 360;
    dibujar();

    if (estaResuelto()) ganar();
});

canvas.addEventListener('contextmenu', e => e.preventDefault());


btnSiguiente.addEventListener('click', () => {
    nivelActual++;
    iniciarNivel();
});

btnMenu.addEventListener('click', () => {
    fin.classList.add('is-hidden');
    hud.classList.add('is-hidden');
    canvas.classList.add('is-hidden');
    cover.classList.remove('is-hidden');
    btnPlay.classList.remove('is-hidden');
    nivelActual = 0;
});