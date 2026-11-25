// MODEL: solo estado y reglas del juego. No toca DOM ni canvas.

class Pajaro {
    constructor() {
        // Hitbox
        this.ancho = 36;
        this.alto = 28;
        this.mundoX = 0;
        this.y = 0;
        this.vy = 0;
        this.animacion = 'planeo';
        this.tAnim = 0;
    }

    setAnimacion(nombre, forzar = false) {
        if (this.animacion !== nombre || forzar) {
            this.animacion = nombre;
            this.tAnim = 0;
        }
    }
}

// Un par de torres (superior e inferior) con un hueco en el medio.
class Tuberia {
    constructor(mundoX, ancho, huecoY, huecoAlto, variante) {
        this.mundoX = mundoX;
        this.ancho = ancho;
        this.huecoY = huecoY;
        this.huecoAlto = huecoAlto;
        this.variante = variante;
        this.pasada = false;
    }
}

// Moneda o enemigo. "inset" achica el hitbox respecto del sprite.
class Elemento {
    constructor(tipo, mundoX, y, ancho, alto, inset = 0) {
        this.tipo = tipo;
        this.mundoX = mundoX;
        this.baseY = y;
        this.y = y;
        this.ancho = ancho;
        this.alto = alto;
        this.inset = inset;
        this.tAnim = 0;
        this.activo = true;
        this.golpeado = false;
    }
}

class RunnerModel {
    constructor(modo = 'normal', personaje = 'murcielago') {
        this.ancho = 960;
        this.alto = 540;
        this.altoSuelo = 50;

        this.modo = modo;
        this.personaje = personaje;  

        // Parámetros de movimiento
        this.velocidadX = 200;
        this.gravedad = 1500;
        this.impulso = -450;

        // Parámetros de las torres
        this.anchoTuberia = 70;
        this.variantesTorre = 6;
        this.primeraTuberiaX = 700;
        this.distanciaMin = 280;
        this.distanciaMax = 480;
        this.huecoInicial = 220;
        this.huecoMinimo = 120;
        this.reduccionHueco = 6;
        this.margenHueco = 60;
        this.maxCambioHueco = 200;
        this.margenColision = 4;

        // Animaciones
        this.duracionAleteo = 0.35;
        this.duracionExplosion = 0.8;
        this.duracionGolpe = 0.6;      // animación al ser golpeado por el enemigo
        this.tExplosion = 0;

        // Elementos
        this.probMoneda = 0.4;
        this.probEnemigo = 0.3;
        this.puntosMoneda = 5;
        this.factorFreno = 0.5;
        this.duracionFreno = 1.5;

        this.claveRecord = 'runner_record_' + this.modo;
        this.record = this.leerRecord();    

        // Configuración de modos
        this.puntajeMeta = this.modo === 'normal' ? 40 :
                           this.modo === 'dificil' ? 60 : Infinity;

        // El enemigo NUNCA termina la partida
        // En modo difícil, además, resta puntos (la moneda suma, el enemigo resta).
        this.puntosEnemigo = 0;
        if (this.modo === 'dificil') {
            this.puntosEnemigo = 5;
            this.probEnemigo = 0.4;
            this.huecoInicial = 200;
        }

        this.pajaro = new Pajaro();
        this.reiniciar();
    }


    reiniciar() {
        this.pajaro.mundoX = 0;
        this.pajaro.y = this.alto / 2;
        this.pajaro.vy = 0;

        this.tuberias = [];
        this.elementos = [];
        this.tuberiasCreadas = 0;
        this.proximaTuberiaX = this.primeraTuberiaX;
        this.ultimoHuecoY = (this.alto - this.altoSuelo - this.huecoInicial) / 2;
        this.puntaje = 0;

        this.tExplosion = 0;
        this.tFreno = 0;
        this.tGolpe = this.duracionGolpe;   
        this.ultimaPenalizacion = 0;

        this.recordPrevio = this.record;   // el récord con el que arranca esta partida
        this.nuevoRecord = false;

        this.pajaro.setAnimacion('planeo', true);

        this.generarTuberias();
        this.estado = 'esperando';
    }

    iniciar() {
        this.estado = 'jugando';
    }

    // Impulso hacia arriba
    aletear() {
        if (this.estado === 'jugando') {
            this.pajaro.vy = this.impulso;
            this.pajaro.setAnimacion('aleteo', true);
        }
    }

    // Crea torres hasta tener algunas por delante de lo que se ve en pantalla
    generarTuberias() {
        const limite = this.pajaro.mundoX + this.ancho + 100;
        while (this.proximaTuberiaX < limite) {
            this.tuberias.push(this.crearTuberia(this.proximaTuberiaX));
            // separación horizontal distinta cada vez
            this.proximaTuberiaX += this.distanciaMin +
                Math.random() * (this.distanciaMax - this.distanciaMin);
        }
    }

    crearTuberia(mundoX) {
        // El hueco se achica con cada torre
        const huecoAlto = Math.max(
            this.huecoMinimo,
            this.huecoInicial - this.tuberiasCreadas * this.reduccionHueco
        );

        // La altura del hueco varía, pero limitada respecto del hueco
        // anterior para que siempre se pueda llegar.
        const sueloY = this.alto - this.altoSuelo;
        const minY = this.margenHueco;
        const maxY = sueloY - this.margenHueco - huecoAlto;
        const desde = Math.max(minY, this.ultimoHuecoY - this.maxCambioHueco);
        const hasta = Math.min(maxY, this.ultimoHuecoY + this.maxCambioHueco);
        const huecoY = desde + Math.random() * (hasta - desde);

        this.ultimoHuecoY = huecoY;
        this.tuberiasCreadas++;

        const variante = Math.floor(Math.random() * this.variantesTorre);
        const tuberia = new Tuberia(mundoX, this.anchoTuberia, huecoY, huecoAlto, variante);
        this.crearElemento(tuberia);
        return tuberia;
    }

    // Después de cada torre puede aparecer una moneda (en el hueco de la torre
    // siguiente no, sino pasando esta) o un enemigo en el tramo libre.
    crearElemento(t) {
        const r = Math.random();
        const x = t.mundoX + t.ancho + 70;
        const sueloY = this.alto - this.altoSuelo;

        if (r < this.probMoneda) {
            const y = t.huecoY + t.huecoAlto / 2 - 16 + (Math.random() - 0.5) * 40;
            this.elementos.push(new Elemento('moneda', x, y, 32, 32));
        } else if (r < this.probMoneda + this.probEnemigo) {
            // baseY deja lugar para la oscilación vertical (±40) sin salir de la zona de vuelo
            const y = 100 + Math.random() * (sueloY - 80 - 40 - 20 - 100);
            this.elementos.push(new Elemento('enemigo', x, y, 80, 80, 20));
        }
    }

    chocar() {
        if (this.estado !== 'jugando') {
            return;
        }

        this.estado = 'explotando';
        this.tExplosion = 0;
        this.pajaro.vy = 0;
        this.pajaro.setAnimacion('explosion', true);
    }

    chocaCon(t) {
        const p = this.pajaro;
        const m = this.margenColision;

        const izq = p.mundoX + m;
        const der = p.mundoX + p.ancho - m;
        const arriba = p.y + m;
        const abajo = p.y + p.alto - m;

        const solapaEnX = der > t.mundoX && izq < t.mundoX + t.ancho;
        if (!solapaEnX) return false;

        // Está dentro del ancho de la torre: choca si se sale del hueco
        return arriba < t.huecoY || abajo > t.huecoY + t.huecoAlto;
    }

    tocaElemento(e) {
        const p = this.pajaro;
        const m = this.margenColision;
        const i = e.inset;

        return p.mundoX + m < e.mundoX + e.ancho - i &&
               p.mundoX + p.ancho - m > e.mundoX + i &&
               p.y + m < e.y + e.alto - i &&
               p.y + p.alto - m > e.y + i;
    }

    // dt en segundos
    actualizar(dt) {
        const p = this.pajaro;
        p.tAnim += dt; // la animación avanza siempre

        for (const e of this.elementos) {
            e.tAnim += dt;
            if (e.tipo === 'enemigo') {
                e.y = e.baseY + Math.sin(e.tAnim * 3) * 40;
            }
        }

        // La explosión congela el mundo hasta que termina
        if (this.estado === 'explotando') {
            this.tExplosion += dt;
            if (this.tExplosion >= this.duracionExplosion) this.estado = 'terminado';
            return;
        }
        if (this.estado !== 'jugando') return;

        if (this.tFreno > 0) {
            this.tFreno -= dt;
        }
        if (this.tGolpe < this.duracionGolpe) {
            this.tGolpe += dt;
        }
        const velocidad = this.tFreno > 0 ? this.velocidadX * this.factorFreno : this.velocidadX;
        p.mundoX += velocidad * dt;
        p.vy += this.gravedad * dt;
        p.y += p.vy * dt;

        if (p.y < 0) {
            p.y = 0;
            p.vy = 0;
        }

        // Animación según el movimiento
        if (p.animacion === 'aleteo') {
            if (p.tAnim >= this.duracionAleteo) p.setAnimacion(p.vy > 250 ? 'caida' : 'planeo');
        } else {
            p.setAnimacion(p.vy > 250 ? 'caida' : 'planeo');
        }

        // Suelo
        const sueloY = this.alto - this.altoSuelo;
        if (p.y + p.alto >= sueloY) {
            p.y = sueloY - p.alto;
            this.chocar();
            return;
        }

        // Generar y descartar lo que quedó atrás
        this.generarTuberias();
        this.tuberias = this.tuberias.filter(t => t.mundoX + t.ancho > p.mundoX - 200);
        this.elementos = this.elementos.filter(e => e.mundoX + e.ancho > p.mundoX - 200);

        // Monedas y enemigos
        for (const e of this.elementos) {
            if (!e.activo || e.golpeado || !this.tocaElemento(e)) {
                continue;
            }

            if (e.tipo === 'moneda') {
                e.activo = false;
                this.sumarPuntos(this.puntosMoneda);

            } else {
                // El enemigo frena al murciélago en TODOS los modos, nunca termina la partida.
                e.golpeado = true;
                this.tFreno = this.duracionFreno;
                this.tGolpe = 0;
                if (this.puntosEnemigo > 0) this.restarPuntos(this.puntosEnemigo);
            }
        }

        // Torres
        for (const t of this.tuberias) {
            if (!t.pasada && t.mundoX + t.ancho < p.mundoX) {
                t.pasada = true;
                this.sumarPuntos(1);
            }
            if (this.chocaCon(t)) {
                this.chocar();
                return;
            }
        }
    }


    // El puntaje nunca baja de 0 y restar puntos jamás termina la partida.
    restarPuntos(n) {
        this.puntaje = Math.max(0, this.puntaje - n);
        this.ultimaPenalizacion = n;
    }

    sumarPuntos(n) {
        this.puntaje += n;

        if (this.modo === 'infinito' && this.puntaje > this.record) {
            this.record = this.puntaje;
            this.guardarRecord();                       // se guarda mientras juega
            if (this.recordPrevio > 0){ 
                this.nuevoRecord = true;
            }
        }

        // El modo infinito nunca alcanza una condición de victoria.
        if (
            this.modo !== 'infinito' &&
            this.puntaje >= this.puntajeMeta &&
            this.estado === 'jugando'
        ) {
            this.estado = 'victoria';
        }
    }

    leerRecord() {
        try { return parseInt(localStorage.getItem(this.claveRecord), 10) || 0; }
        catch (e) { return 0; }
    }

    guardarRecord() {
        try { localStorage.setItem(this.claveRecord, this.record); }
        catch (e) { /* storage bloqueado: el juego sigue igual */ }
    }
}