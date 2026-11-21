// MODEL: solo estado y reglas del juego. No toca DOM ni canvas.

class Pajaro {
    constructor() {
        this.ancho = 40;
        this.alto = 30;
        this.mundoX = 0;  
        this.y = 0;      
        this.vy = 0;    
        this.animacion = 'planeo';
        this.tAnim = 0;
        this.puntajeMeta = 40;
    }

    setAnimation(nombre, forzar = false){
        if(this.animacion !== nombre || forzar){
            this.animacion = nombre;
            this.tAnim = 0;
        }
    }
}

// Un par de tuberías (superior e inferior) con un hueco en el medio.
class Tuberia {
    constructor(mundoX, ancho, huecoY, huecoAlto) {
        this.mundoX = mundoX;   
        this.ancho = ancho;
        this.huecoY = huecoY;    
        this.huecoAlto = huecoAlto;
        this.pasada = false;      
    }
}

class RunnerModel {
    constructor() {
        // Dimensiones lógicas del escenario
        this.ancho = 960;
        this.alto = 540;
        this.altoSuelo = 40;

        // Parámetros de movimiento (px/s y px/s²)
        this.velocidadX = 200;   
        this.gravedad = 1500;
        this.impulso = -450;    

        // Parámetros de las tuberías
        this.anchoTuberia = 70;
        this.primeraTuberiaX = 700;
        this.distanciaMin = 280;      
        this.distanciaMax = 480;
        this.huecoInicial = 220;    
        this.huecoMinimo = 120;       
        this.reduccionHueco = 6;     
        this.margenHueco = 60;       
        this.maxCambioHueco = 200;    
        this.margenColision = 4;     

        this.duracionAleteo = 0.3;
        this.duracionExplosion = 0.6;
        this.tExplosion = 0;

        this.probMoneda = 0.4;
        this.probMurcielago = 0.3;
        this.puntosMoneda = 5;
        this.factorFreno = 0.5;
        this.duracionFreno = 1.5;

        this.pajaro = new Pajaro();
        this.reiniciar();

    }

    reiniciar() {
        this.pajaro.mundoX = 0;
        this.pajaro.y = this.alto / 2;
        this.pajaro.vy = 0;

        this.tuberias = [];
        this.tuberiasCreadas = 0;
        this.proximaTuberiaX = this.primeraTuberiaX;
        this.ultimoHuecoY = (this.alto - this.altoSuelo - this.huecoInicial) / 2;
        this.puntaje = 0;

        this.tExplosion = 0;

        this.elementos = [];
        this.tFreno = 0;

        this.pajaro.setAnimacion('planeo', true);

        this.generarTuberias();
        this.estado = 'esperando'; // esperando | jugando | terminado
    }

    iniciar() {
        this.estado = 'jugando';
    }

    // Impulso hacia arriba (punto 1 del TPE)
    aletear() {
        if (this.estado === 'jugando') {
            this.pajaro.vy = this.impulso;
            this.pajaro.setAnimation('aleteo', true);
        }
    }

    // Crea tuberías hasta tener algunas por delante de lo que se ve en pantalla
    generarTuberias() {
        const limite = this.pajaro.mundoX + this.ancho + 100;
        while (this.proximaTuberiaX < limite) {
            this.tuberias.push(this.crearTuberia(this.proximaTuberiaX));
            // separación horizontal distinta cada vez (punto 5a)
            this.proximaTuberiaX += this.distanciaMin +
                Math.random() * (this.distanciaMax - this.distanciaMin);
        }
    }

    crearTuberia(mundoX) {
        // El hueco se achica con cada tubería (punto 5b)
        const huecoAlto = Math.max(
            this.huecoMinimo,
            this.huecoInicial - this.tuberiasCreadas * this.reduccionHueco
        );

        // La altura del hueco varía (punto 5c), pero limitada respecto
        // del hueco anterior para que siempre se pueda llegar.
        const sueloY = this.alto - this.altoSuelo;
        const minY = this.margenHueco;
        const maxY = sueloY - this.margenHueco - huecoAlto;
        const desde = Math.max(minY, this.ultimoHuecoY - this.maxCambioHueco);
        const hasta = Math.min(maxY, this.ultimoHuecoY + this.maxCambioHueco);
        const huecoY = desde + Math.random() * (hasta - desde);

        this.ultimoHuecoY = huecoY;
        this.tuberiasCreadas++;
        const tuberia = new Tuberia(mundoX, this.anchoTuberia, huecoY, huecoAlto);
        this.crearElemento(tuberia);
        return tuberia;
    }

    chocar() {
        if(this.estado !== 'jugando'){
            return;
        }

        this.estado = 'explotando';
        this.tExplosion = 0;
        this.pajaro.vy = 0;
        this.pajaro.setAnimation('explosion', true);
    }

    // ¿El pájaro choca con esta tubería? (rectángulos en coordenadas del mundo)
    chocaCon(t) {
        const p = this.pajaro;
        const m = this.margenColision;

        const izq = p.mundoX + m;
        const der = p.mundoX + p.ancho - m;
        const arriba = p.y + m;
        const abajo = p.y + p.alto - m;

        const solapaEnX = der > t.mundoX && izq < t.mundoX + t.ancho;
        if (!solapaEnX) return false;

        // Está dentro del ancho de la tubería: choca si se sale del hueco
        return arriba < t.huecoY || abajo > t.huecoY + t.huecoAlto;
    }

    // dt en segundos
    actualizar(dt) {
        const p = this.pajaro;
        p.tAnim += dt; // la animación avanza siempre

        for (const e of this.elementos) {
            e.tAnim += dt;
            if (e.tipo === 'murcielago') {
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

        // Tuberías
        this.generarTuberias();
        this.tuberias = this.tuberias.filter(t => t.mundoX + t.ancho > p.mundoX - 200);

        this.elementos = this.elementos.filter(e => e.mundoX + e.ancho > p.mundoX - 200);

        for (const e of this.elementos) {
            if (!e.activo || e.golpeado || !this.tocaElemento(e)){ 
                continue;
            }
            if (e.tipo === 'moneda') {
                e.activo = false;
                this.sumarPuntos(this.puntosMoneda);
            } else {
                e.golpeado = true;
                this.tFreno = this.duracionFreno;
            }
        }

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

    crearElemento(t) {
        const r = Math.random();
        const x = t.mundoX + t.ancho + 70;
        const sueloY = this.alto - this.altoSuelo;

        if(r < this.probMoneda) {
            const y = t.huecoY + t.huecoAlto / 2 - 16 + (Math.random() - 0.5) * 40;
            this.elementos.push(new Elemento('moneda', x, y, 32, 32));
        }else if(r < this.probMoneda + this.probMurcielago) {
            const y = 100 + Math.random() * (sueloY - 200);
            this.elementos.push(new Elemento('murcielago', x, y, 48, 48));
        }
    }

    tocaElemento(e){
        const p = this.pajaro;
        const m = this.margenColision;

        return p.mundoX + m < e.mundoX + e.ancho &&
           p.mundoX + p.ancho - m > e.mundoX &&
           p.y + m < e.y + e.alto &&
           p.y + p.alto - m > e.y;
    }

    sumarPuntos(n) {
        this.puntaje += n;
        if (this.puntaje >= this.puntajeMeta && this.estado === 'jugando') {
            this.estado = 'victoria';
        }
    }
}

class Elemento {
    constructor(tipo, mundoX, y, ancho, alto) {
        this.tipo = tipo;
        this.mundoX = mundoX;
        this.baseY = y,
        this.y = y;
        this.ancho = ancho;
        this.alto = alto;
        this.tAnim = 0;
        this.activo = true;
        this.golpeado = false;
    }


}