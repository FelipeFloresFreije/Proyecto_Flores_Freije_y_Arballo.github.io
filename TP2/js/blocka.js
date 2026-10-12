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
    { nombre: 'Escala de grises', filtro: 'grises',   limite: null  },
    { nombre: 'Brillo',           filtro: 'brillo',   limite: 120000 }, 
    { nombre: 'Negativo',         filtro: 'negativo', limite: 90000  }  
];

const PENALIZACION_AYUDA = 5000; 
const AYUDAS_MAX = 2;             
const PAUSA_REVELAR = 1500;        

// ---------- Estado ----------
let img = new Image();
let original = null;     
let filtrada = null;     
let fuente = null;        
let ultimaImagen = -1;
let rotaciones = [];
let fijas = [];         
let ayudasUsadas = 0;
let nivelActual = 0;
let nivelId = 0;         
let jugando = false;
let inicio = 0;
let intervalo = null;
let records = cargarRecords();

// ==========================================================
// INTERFAZ: HUD
// ==========================================================
const hud = document.createElement('div');
hud.className = 'blocka-hud is-hidden';
hud.innerHTML = `
    <span class="body" id="hudNivel"></span>
    <span class="body" id="hudTiempo">00:00.0</span>
    <span class="body" id="hudRecord"></span>
    <button type="button" class="btn btn-tiny btn-primary" id="btnAyuda">Ayudita</button>
    <button type="button" class="btn btn-tiny btn-secondary" id="btnSalir">Menú</button>
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
        <button type="button" class="btn btn-medium btn-primary is-hidden" id="btnReintentar">Reintentar</button>
        <button type="button" class="btn btn-medium btn-secondary" id="btnMenu">Menú principal</button>
    </div>
`;
stage.appendChild(fin);

const hudNivel = document.getElementById('hudNivel');
const hudTiempo = document.getElementById('hudTiempo');
const hudRecord = document.getElementById('hudRecord');
const btnAyuda = document.getElementById('btnAyuda');
const btnSalir = document.getElementById('btnSalir');
const finTitulo = document.getElementById('finTitulo');
const finTiempo = document.getElementById('finTiempo');
const finRecord = document.getElementById('finRecord');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnReintentar = document.getElementById('btnReintentar');
const btnMenu = document.getElementById('btnMenu');

// ==========================================================
// RÉCORDS
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

function textoTiempo(ms) {
    const limite = NIVELES[nivelActual].limite;
    return limite ? formatear(ms) + ' / ' + formatear(limite) : formatear(ms);
}

function iniciarTemporizador() {
    detenerTemporizador();
    inicio = performance.now();
    intervalo = setInterval(() => {
        const t = performance.now() - inicio;
        hudTiempo.textContent = textoTiempo(t);

        const limite = NIVELES[nivelActual].limite;
        if (limite && t >= limite) perder();
    }, 100);
}

function detenerTemporizador() {
    if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
    }
}

// ==========================================================
// IMÁGENES Y FILTROS
// ==========================================================
function elegirIndice() {
    let i;
    do {
        i = Math.floor(Math.random() * IMAGENES.length);
    } while (IMAGENES.length > 1 && i === ultimaImagen);
    ultimaImagen = i;
    return i;
}

function cargarImagen(i, alCargar) {
    img = new Image();
    img.onload = alCargar;
    img.onerror = () => console.error('No se pudo cargar la imagen:', IMAGENES[i]);
    img.src = IMAGENES[i];
}

function mostrarRuleta(indiceFinal, alTerminar) {
    const thumbs = intro.querySelectorAll('.blocka-thumb');
    thumbs.forEach(t => t.classList.remove('activa', 'elegida'));
    intro.classList.remove('is-hidden');

    const total = thumbs.length * 2 + indiceFinal;
    let paso = 0;
    let espera = 80;

    (function siguiente() {
        thumbs.forEach(t => t.classList.remove('activa'));
        thumbs[paso % thumbs.length].classList.add('activa');

        if (paso >= total) {
            thumbs[indiceFinal].classList.add('elegida');
            setTimeout(() => {
                intro.classList.add('is-hidden');
                alTerminar();
            }, 900);
            return;
        }
        paso++;
        espera += 12;
        setTimeout(siguiente, espera);
    })();
}

function prepararImagenes() {
    const lado = Math.min(img.width, img.height);
    const sx = (img.width - lado) / 2;
    const sy = (img.height - lado) / 2;

    original = document.createElement('canvas');
    original.width = original.height = SIZE;
    original.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, SIZE, SIZE);

    filtrada = document.createElement('canvas');
    filtrada.width = filtrada.height = SIZE;
    const c = filtrada.getContext('2d');
    c.drawImage(original, 0, 0);

    try {
        const datos = c.getImageData(0, 0, SIZE, SIZE);
        aplicarFiltro(datos.data, NIVELES[nivelActual].filtro);
        c.putImageData(datos, 0, 0);
    } catch (e) {
        console.error('No se pudo aplicar el filtro (¿estás en file://?):', e);
    }

    fuente = filtrada;
}

function aplicarFiltro(d, tipo) {
    for (let p = 0; p < d.length; p += 4) {
        const r = d[p], g = d[p + 1], b = d[p + 2];

        if (tipo === 'grises') {
            const y = 0.299 * r + 0.587 * g + 0.114 * b;
            d[p] = d[p + 1] = d[p + 2] = y;

        } else if (tipo === 'brillo') {
            const extra = 255 * 0.3;
            d[p]     = Math.min(255, r + extra);
            d[p + 1] = Math.min(255, g + extra);
            d[p + 2] = Math.min(255, b + extra);

        } else if (tipo === 'negativo') {
            d[p]     = 255 - r;
            d[p + 1] = 255 - g;
            d[p + 2] = 255 - b;
        }
    }
}

// ==========================================================
// NIVEL
// ==========================================================
function mezclar() {
    do {
        rotaciones = [0, 1, 2, 3].map(() => 90 * Math.floor(Math.random() * 4));
    } while (rotaciones.every(r => r === 0));   // que no arranque resuelto
    fijas = [false, false, false, false];
}

function iniciarNivel() {
    const miId = ++nivelId;

    fin.classList.add('is-hidden');
    jugando = false;
    ayudasUsadas = 0;
    actualizarBotonAyuda();

    hudNivel.textContent = 'Nivel ' + (nivelActual + 1);
    hudTiempo.textContent = textoTiempo(0);
    hudRecord.textContent = records[nivelActual]
        ? 'Récord: ' + formatear(records[nivelActual])
        : 'Sin récord';

    const indice = elegirIndice();
    mostrarRuleta(indice, () => {
        if (miId !== nivelId) return;
        cargarImagen(indice, () => {
            if (miId !== nivelId) return;
            prepararImagenes();
            mezclar();
            dibujar();
            jugando = true;
            actualizarBotonAyuda();
            iniciarTemporizador();
        });
    });
}

function estaResuelto() {
    return rotaciones.every(r => r === 0);
}

function ganar() {
    const tiempo = performance.now() - inicio;
    const limite = NIVELES[nivelActual].limite;

    if (limite && tiempo > limite) { 
        perder(); return;
    }
    jugando = false;
    
    actualizarBotonAyuda();
    detenerTemporizador();
    hudTiempo.textContent = textoTiempo(tiempo);

    fuente = original;
    dibujar();

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
    btnReintentar.classList.add('is-hidden');

    const miId = nivelId;
    setTimeout(() => {
        if (miId === nivelId) fin.classList.remove('is-hidden');
    }, PAUSA_REVELAR);
}

function perder() {
    jugando = false;
    detenerTemporizador();
    actualizarBotonAyuda();

    finTitulo.textContent = '¡Se acabó el tiempo!';
    finTiempo.textContent = 'El límite de este nivel era ' + formatear(NIVELES[nivelActual].limite);
    finRecord.textContent = '';

    btnSiguiente.classList.add('is-hidden');
    btnReintentar.classList.remove('is-hidden');
    fin.classList.remove('is-hidden');
}

function volverAlMenu() {
    nivelId++;             
    jugando = false;
    detenerTemporizador();

    fin.classList.add('is-hidden');
    hud.classList.add('is-hidden');
    canvas.classList.add('is-hidden');
    cover.classList.remove('is-hidden');
    btnPlay.classList.remove('is-hidden');
    nivelActual = 0;
}

// ==========================================================
// AYUDITA:
// ==========================================================

function actualizarBotonAyuda() {
    const quedan = AYUDAS_MAX - ayudasUsadas;
    btnAyuda.textContent = 'Ayudita (' + quedan + ')';
    btnAyuda.disabled = !jugando || quedan <= 0;
}

function usarAyuda() {
    if (!jugando || ayudasUsadas >= AYUDAS_MAX) return;

    const candidatas = [];
    for (let i = 0; i < 4; i++) {
        if (!fijas[i] && rotaciones[i] !== 0) candidatas.push(i);
    }
    if (candidatas.length === 0) return;

    const i = candidatas[Math.floor(Math.random() * candidatas.length)];
    rotaciones[i] = 0;
    fijas[i] = true;
    ayudasUsadas++;
    inicio -= PENALIZACION_AYUDA;  
    actualizarBotonAyuda();
    dibujar();
    if (estaResuelto()) ganar();
}

// ==========================================================
// DIBUJO
// ==========================================================
function dibujar() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const s = SIZE / 2;   

    for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const fila = Math.floor(i / 2);

        ctx.save();
        ctx.translate(col * HALF + HALF / 2, fila * HALF + HALF / 2);
        ctx.rotate(rotaciones[i] * Math.PI / 180);
        ctx.drawImage(fuente, col * s, fila * s, s, s, -HALF / 2, -HALF / 2, HALF, HALF);
        ctx.restore();

        if (fijas[i] && jugando) {
            ctx.strokeStyle = '#27AE60';
            ctx.lineWidth = 6;
            ctx.strokeRect(col * HALF + 3, fila * HALF + 3, HALF - 6, HALF - 6);
        }
    }
}

// ==========================================================
// EVENTOS
// ==========================================================

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
    if (e.button !== 0 && e.button !== 2) return;   

    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (SIZE / r.width);
    const y = (e.clientY - r.top) * (SIZE / r.height);
    const i = Math.floor(y / HALF) * 2 + Math.floor(x / HALF);

    if (i < 0 || i > 3 || fijas[i]) return;

    const giro = (e.button === 2) ? 90 : -90;   
    rotaciones[i] = (rotaciones[i] + giro + 360) % 360;
    dibujar();

    if (estaResuelto()) ganar();
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

btnAyuda.addEventListener('click', usarAyuda);
btnSalir.addEventListener('click', volverAlMenu);
btnMenu.addEventListener('click', volverAlMenu);

btnSiguiente.addEventListener('click', () => {
    nivelActual++;
    iniciarNivel();
});

btnReintentar.addEventListener('click', iniciarNivel);