function iniciarBlocka() {
    const canvas = document.getElementById('blockaCanvas');
    const ctx = canvas.getContext('2d');
    const cover = document.getElementById('stageCover');
    const btnPlay = document.getElementById('btnPlay');
    const stage = document.getElementById('gameStage');

    const LADO = 400;
    const CONFIGS = { 4: [2, 2], 6: [3, 2], 8: [4, 2] };

    const IMAGENES = [
        'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg',
        'img5.jpg', 'img6.jpg', 'img7.jpg', 'img8.jpg'
    ].map(nombre => 'assets/img/blocka/' + nombre);

    const NIVELES = [
        { nombre: 'Escala de grises', filtro: 'grises', limite: null },
        { nombre: 'Brillo', filtro: 'brillo', limite: 120000 },
        { nombre: 'Negativo', filtro: 'negativo', limite: 90000 }
    ];

    const PENALIZACION_AYUDA = 5000;
    const AYUDAS_MAX = 2;
    const PAUSA_REVELAR = 1500;

    let img = new Image();
    let original = null;
    let filtrada = null;
    let fuente = null;
    let ultimaImagen = -1;
    let columnas = 2;
    let filas = 2;
    let piezas = 4;
    let rotaciones = [];
    let fijas = [];
    let ayudasUsadas = 0;
    let nivelActual = 0;
    let nivelId = 0;
    let jugando = false;
    let inicio = 0;
    let intervalo = null;
    let records = cargarRecords();
    let ruletaId = 0;

    const hud = document.createElement('div');
    hud.className = 'blocka-hud is-hidden';
    hud.innerHTML = `
        <span class="body blocka-text" id="hudNivel"></span>
        <span class="body blocka-text" id="hudTiempo">00:00.0</span>
        <span class="body blocka-text" id="hudRecord"></span>
        <button type="button" class="btn btn-tiny btn-primary" id="btnAyuda">Ayudita</button>
        <button type="button" class="btn btn-tiny btn-secondary" id="btnSalir">Menú</button>
    `;
    stage.appendChild(hud);

    const fin = document.createElement('div');
    fin.className = 'blocka-fin is-hidden';
    fin.innerHTML = `
        <h2 class="blocka-text" id="finTitulo"></h2>
        <p class="body blocka-text" id="finTiempo"></p>
        <p class="body blocka-text" id="finRecord"></p>
        <div class="blocka-fin-botones">
            <button type="button" class="btn btn-medium btn-primary" id="btnSiguiente">Siguiente nivel</button>
            <button type="button" class="btn btn-medium btn-primary is-hidden" id="btnReintentar">Reintentar</button>
            <button type="button" class="btn btn-medium btn-secondary" id="btnMenu">Menú principal</button>
        </div>
    `;
    stage.appendChild(fin);

    const intro = document.createElement('div');
    intro.className = 'blocka-intro is-hidden';

    IMAGENES.forEach(src => {
        const t = document.createElement('img');
        t.src = src;
        t.alt = '';
        t.className = 'blocka-thumb';
        intro.appendChild(t);
    });

    stage.appendChild(intro);

    const config = document.createElement('div');
    config.className = 'blocka-config';
    config.innerHTML = `
        <label class="small" for="cantPiezas">Piezas</label>
        <select id="cantPiezas">
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
        </select>
    `;
    stage.appendChild(config);

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
    const selPiezas = document.getElementById('cantPiezas');

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

    function claveRecord() {
        return piezas + '-' + nivelActual;
    }

    function formatear(ms) {
        const min = Math.floor(ms / 60000);
        const seg = ((ms % 60000) / 1000).toFixed(1);

        return String(min).padStart(2, '0') + ':' +
            seg.padStart(4, '0');
    }

    function textoTiempo(ms) {
        const limite = NIVELES[nivelActual].limite;

        return limite
            ? formatear(ms) + ' / ' + formatear(limite)
            : formatear(ms);
    }

    function iniciarTemporizador() {
        detenerTemporizador();
        inicio = performance.now();

        intervalo = setInterval(() => {
            const t = performance.now() - inicio;

            hudTiempo.textContent = textoTiempo(t);

            const limite = NIVELES[nivelActual].limite;

            if (limite && t >= limite) {
                perder();
            }
        }, 100);
    }

    function detenerTemporizador() {
        if (intervalo) {
            clearInterval(intervalo);
            intervalo = null;
        }
    }

    function aplicarConfig(n) {
        piezas = n;
        [columnas, filas] = CONFIGS[n];

        canvas.width = columnas * LADO;
        canvas.height = filas * LADO;
    }

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
        img.onerror = () => console.error(
            'No se pudo cargar la imagen:',
            IMAGENES[i]
        );
        img.src = IMAGENES[i];
    }

    function mostrarRuleta(indiceFinal, alTerminar) {
        const miRuleta = ++ruletaId;
        const thumbs = intro.querySelectorAll('.blocka-thumb');

        thumbs.forEach(t => t.classList.remove('activa', 'elegida'));
        intro.classList.remove('is-hidden');

        const total = thumbs.length * 2 + indiceFinal;
        let paso = 0;
        let espera = 80;

        (function siguiente() {
            if (miRuleta !== ruletaId) return;

            thumbs.forEach(t => t.classList.remove('activa'));
            thumbs[paso % thumbs.length].classList.add('activa');

            if (paso >= total) {
                thumbs[indiceFinal].classList.add('elegida');

                setTimeout(() => {
                    if (miRuleta !== ruletaId) return;

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
        const W = canvas.width;
        const H = canvas.height;
        const ratio = W / H;

        let sw = img.width;
        let sh = img.height;

        if (sw / sh > ratio) {
            sw = sh * ratio;
        } else {
            sh = sw / ratio;
        }

        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;

        original = document.createElement('canvas');
        original.width = W;
        original.height = H;

        original.getContext('2d').drawImage(
            img, sx, sy, sw, sh, 0, 0, W, H
        );

        filtrada = document.createElement('canvas');
        filtrada.width = W;
        filtrada.height = H;

        const c = filtrada.getContext('2d');
        c.drawImage(original, 0, 0);

        try {
            const datos = c.getImageData(0, 0, W, H);

            aplicarFiltro(datos.data, NIVELES[nivelActual].filtro);

            c.putImageData(datos, 0, 0);
        } catch (e) {
            console.error(
                'No se pudo aplicar el filtro (¿estás en file://?):',
                e
            );
        }

        fuente = filtrada;
    }

    function aplicarFiltro(d, tipo) {
        for (let p = 0; p < d.length; p += 4) {
            const r = d[p];
            const g = d[p + 1];
            const b = d[p + 2];

            if (tipo === 'grises') {
                const y = 0.299 * r + 0.587 * g + 0.114 * b;

                d[p] = d[p + 1] = d[p + 2] = y;
            } else if (tipo === 'brillo') {
                const extra = 255 * 0.3;

                d[p] = Math.min(255, r + extra);
                d[p + 1] = Math.min(255, g + extra);
                d[p + 2] = Math.min(255, b + extra);
            } else if (tipo === 'negativo') {
                d[p] = 255 - r;
                d[p + 1] = 255 - g;
                d[p + 2] = 255 - b;
            }
        }
    }

    function mezclar() {
        do {
            rotaciones = Array.from(
                { length: piezas },
                () => 90 * Math.floor(Math.random() * 4)
            );
        } while (rotaciones.every(r => r === 0));

        fijas = new Array(piezas).fill(false);
    }

    function iniciarNivel() {
        const miId = ++nivelId;

        fin.classList.add('is-hidden');
        jugando = false;
        ayudasUsadas = 0;

        actualizarBotonAyuda();

        const record = records[claveRecord()];

        hudNivel.textContent = 'Nivel ' + (nivelActual + 1);
        hudTiempo.textContent = textoTiempo(0);

        hudRecord.textContent = record
            ? 'Récord: ' + formatear(record)
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
            perder();
            return;
        }

        jugando = false;

        actualizarBotonAyuda();
        detenerTemporizador();

        hudTiempo.textContent = textoTiempo(tiempo);

        fuente = original;
        dibujar();

        const clave = claveRecord();
        const anterior = records[clave];
        const esRecord = !anterior || tiempo < anterior;

        if (esRecord) {
            records[clave] = tiempo;
            guardarRecords();

            hudRecord.textContent = 'Récord: ' + formatear(tiempo);
        }

        const ultimoNivel = nivelActual === NIVELES.length - 1;

        finTitulo.textContent = ultimoNivel
            ? '¡Completaste todos los niveles!'
            : '¡Nivel completado!';

        finTiempo.textContent = 'Tu tiempo: ' + formatear(tiempo);

        finRecord.textContent = esRecord
            ? '¡Nuevo récord!'
            : 'Récord: ' + formatear(anterior);

        btnSiguiente.classList.toggle('is-hidden', ultimoNivel);
        btnReintentar.classList.add('is-hidden');

        const miId = nivelId;

        setTimeout(() => {
            if (miId === nivelId) {
                fin.classList.remove('is-hidden');
            }
        }, PAUSA_REVELAR);
    }

    function perder() {
        jugando = false;

        detenerTemporizador();
        actualizarBotonAyuda();

        finTitulo.textContent = '¡Se acabó el tiempo!';

        finTiempo.textContent =
            'El límite de este nivel era ' +
            formatear(NIVELES[nivelActual].limite);

        finRecord.textContent = '';

        btnSiguiente.classList.add('is-hidden');
        btnReintentar.classList.remove('is-hidden');
        fin.classList.remove('is-hidden');
    }

    function volverAlMenu() {
        nivelId++;
        ruletaId++;
        jugando = false;

        detenerTemporizador();

        fin.classList.add('is-hidden');
        intro.classList.add('is-hidden');
        hud.classList.add('is-hidden');
        canvas.classList.add('is-hidden');

        cover.classList.remove('is-hidden');
        btnPlay.classList.remove('is-hidden');
        config.classList.remove('is-hidden');

        nivelActual = 0;
    }

    function actualizarBotonAyuda() {
        const quedan = AYUDAS_MAX - ayudasUsadas;

        btnAyuda.textContent = 'Ayudita (' + quedan + ')';
        btnAyuda.disabled = !jugando || quedan <= 0;
    }

    function usarAyuda() {
        if (!jugando || ayudasUsadas >= AYUDAS_MAX) return;

        const candidatas = [];

        for (let i = 0; i < piezas; i++) {
            if (!fijas[i] && rotaciones[i] !== 0) {
                candidatas.push(i);
            }
        }

        if (candidatas.length === 0) return;

        const i = candidatas[
            Math.floor(Math.random() * candidatas.length)
        ];

        rotaciones[i] = 0;
        fijas[i] = true;
        ayudasUsadas++;

        inicio -= PENALIZACION_AYUDA;

        actualizarBotonAyuda();
        dibujar();

        if (estaResuelto()) ganar();
    }

    function dibujar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < piezas; i++) {
            const col = i % columnas;
            const fila = Math.floor(i / columnas);

            ctx.save();

            ctx.translate(
                col * LADO + LADO / 2,
                fila * LADO + LADO / 2
            );

            ctx.rotate(rotaciones[i] * Math.PI / 180);

            ctx.drawImage(
                fuente,
                col * LADO,
                fila * LADO,
                LADO,
                LADO,
                -LADO / 2,
                -LADO / 2,
                LADO,
                LADO
            );

            ctx.restore();

            if (fijas[i] && jugando) {
                ctx.strokeStyle = '#27AE60';
                ctx.lineWidth = 6;

                ctx.strokeRect(
                    col * LADO + 3,
                    fila * LADO + 3,
                    LADO - 6,
                    LADO - 6
                );
            }
        }
    }

    btnPlay.addEventListener('click', () => {
        aplicarConfig(Number(selPiezas.value));

        cover.classList.add('is-hidden');
        btnPlay.classList.add('is-hidden');
        config.classList.add('is-hidden');
        canvas.classList.remove('is-hidden');
        hud.classList.remove('is-hidden');

        nivelActual = 0;

        iniciarNivel();
    });

    canvas.addEventListener('mousedown', e => {
        if (!jugando) return;
        if (e.button !== 0 && e.button !== 2) return;

        const r = canvas.getBoundingClientRect();

        const x = (e.clientX - r.left) * (canvas.width / r.width);
        const y = (e.clientY - r.top) * (canvas.height / r.height);

        const col = Math.floor(x / LADO);
        const fila = Math.floor(y / LADO);

        if (col < 0 || col >= columnas || fila < 0 || fila >= filas) {
            return;
        }

        const i = fila * columnas + col;

        if (fijas[i]) return;

        const giro = e.button === 2 ? 90 : -90;

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
}

iniciarBlocka();