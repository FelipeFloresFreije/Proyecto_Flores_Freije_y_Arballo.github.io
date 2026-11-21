// VIEW: solo dibuja. Lee el model, nunca lo modifica.

// Spritesheet del pájaro: una fila por animación, un frame por columna.
const FRAME_ANCHO = 64;
const FRAME_ALTO = 64;
const ANIMACIONES_PAJARO = {
    planeo:    { fila: 0, frames: 4, fps: 8,  loop: true  },
    aleteo:    { fila: 1, frames: 4, fps: 14, loop: false },
    caida:     { fila: 2, frames: 2, fps: 6,  loop: true  },
    explosion: { fila: 3, frames: 6, fps: 12, loop: false }
};

// Una sola fila de frames por elemento (ajustá a tus spritesheets)
const SPRITES_ELEMENTOS = {
    moneda:     { src: 'assets/img/moneda.png',     frameAncho: 48, frameAlto: 48, frames: 6, fps: 10 },
    murcielago: { src: 'assets/img/murcielago.png', frameAncho: 64, frameAlto: 64, frames: 4, fps: 12 }
};

// Generador pseudoaleatorio con semilla: da siempre el mismo resultado,
// así los tiles de cada capa son iguales en cada partida.
function pseudoAleatorio(semilla) {
    return function () {
        semilla = (semilla * 16807) % 2147483647;
        return semilla / 2147483647;
    };
}

// Una capa de parallax: un "tile" que se repite horizontalmente.
// factor = fracción del movimiento del mundo que recorre la capa
// (0 = quieta, 1 = misma velocidad que el pájaro y los obstáculos).
class CapaParallax {
    constructor(ancho, alto, y, factor, dibujar) {
        this.factor = factor;
        this.y = y;

        // El tile se dibuja una sola vez en un canvas auxiliar.
        // Más adelante se puede reemplazar por una imagen (new Image()).
        this.tile = document.createElement('canvas');
        this.tile.width = ancho;
        this.tile.height = alto;
        dibujar(this.tile.getContext('2d'), ancho, alto);
    }

    render(ctx, mundoX, anchoPantalla) {
        const w = this.tile.width;
        let x = -Math.floor((mundoX * this.factor) % w);
        for (; x < anchoPantalla; x += w) {
            ctx.drawImage(this.tile, x, this.y);
        }
    }
}

// Dibuja una fila de edificios de izquierda a derecha, apoyados abajo del tile.
function dibujarEdificios(c, w, h, rnd, opc) {
    let x = 0;
    while (x < w) {
        const ancho = Math.min(opc.anchoMin + rnd() * (opc.anchoMax - opc.anchoMin), w - x);
        const alto = opc.altoMin + rnd() * (opc.altoMax - opc.altoMin);
        c.fillStyle = opc.color;
        c.fillRect(x, h - alto, ancho, alto);

        if (opc.ventanas) {
            c.fillStyle = opc.ventanas;
            for (let wx = x + 8; wx < x + ancho - 8; wx += 14) {
                for (let wy = h - alto + 10; wy < h - 10; wy += 18) {
                    if (rnd() > 0.65) c.fillRect(wx, wy, 6, 9);
                }
            }
        }
        x += ancho;
    }
}

class RunnerView {
    constructor(contenedor, model) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = model.ancho;
        this.canvas.height = model.alto;
        this.canvas.style.width = '100%';
        this.canvas.style.display = 'block';
        this.canvas.tabIndex = 0;

        contenedor.innerHTML = '';
        contenedor.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // El pájaro se dibuja siempre en la misma X de pantalla;
        // lo que cambia es el mundo.
        this.pantallaX = 150;

        this.spritePajaro = new Image();
        this.spritePajaro.src = 'assets/img/pajaro.png';

        this.imgElementos = {};

        for (const tipo in SPRITES_ELEMENTOS) {
            const img = new Image();
            img.src = SPRITES_ELEMENTOS[tipo].src;
            this.imgElementos[tipo] = img;
        }

        this.capas = this.crearCapas(model);
    }

    // Las 4 capas, de la más lejana (lenta) a la más cercana (rápida)
    crearCapas(model) {
        const W = model.ancho;
        const H = model.alto;
        const S = model.altoSuelo;

        return [
            // 1. Cielo: luna y estrellas (casi no se mueven)
            new CapaParallax(W, H, 0, 0.05, (c, w, h) => {
                const rnd = pseudoAleatorio(11);
                c.fillStyle = '#ffffff';
                for (let i = 0; i < 60; i++) {
                    c.fillRect(rnd() * w, rnd() * h * 0.6, 2, 2);
                }
                c.fillStyle = '#f4f1d0';
                c.beginPath();
                c.arc(w * 0.75, 90, 36, 0, Math.PI * 2);
                c.fill();
            }),

            // 2. Ciudad lejana (lenta, color cercano al cielo)
            new CapaParallax(W, 260, H - S - 260, 0.2, (c, w, h) => {
                dibujarEdificios(c, w, h, pseudoAleatorio(23), {
                    anchoMin: 50, anchoMax: 110, altoMin: 70, altoMax: 170,
                    color: '#0F3A6B', ventanas: null
                });
            }),

            // 3. Edificios cercanos con ventanas (velocidad media)
            new CapaParallax(W, 320, H - S - 320, 0.5, (c, w, h) => {
                dibujarEdificios(c, w, h, pseudoAleatorio(37), {
                    anchoMin: 70, anchoMax: 130, altoMin: 110, altoMax: 260,
                    color: '#1B2A4A', ventanas: '#ffd966'
                });
            }),

            // 4. Suelo (factor 1: misma velocidad que el mundo)
            new CapaParallax(W, S, H - S, 1.0, (c, w, h) => {
                c.fillStyle = '#2A1747';
                c.fillRect(0, 0, w, h);
                c.fillStyle = '#6B3FA0';
                c.fillRect(0, 0, w, 4);
                // marcas para que se note el movimiento (960 / 48 = entero: encaja sin cortes)
                for (let x = 0; x < w; x += 48) {
                    c.fillRect(x, 16, 24, 4);
                }
            })
        ];
    }

    render(model) {
        const ctx = this.ctx;
        const p = model.pajaro;

        // Fondo
        ctx.fillStyle = '#0C447C';
        ctx.fillRect(0, 0, model.ancho, model.alto);

        // Capas de fondo (1 a 3), después las tuberías y al final el suelo (capa 4),
        // así el suelo tapa la base de las tuberías.
        const suelo = this.capas[this.capas.length - 1];
        for (const capa of this.capas.slice(0, -1)) {
            capa.render(ctx, p.mundoX, model.ancho);
        }
        this.dibujarTuberias(model);
        this.dibujarElementos(model);
        suelo.render(ctx, p.mundoX, model.ancho);

        this.dibujarPajaro(model);

        // Distancia recorrida
        ctx.fillStyle = '#fff';
        ctx.font = '16px Nunito';
        ctx.fillText('Distancia: ' + Math.floor(p.mundoX) + ' px', 16, 28);
        ctx.fillText('Puntaje: ' + model.puntaje + ' / ' + model.puntajeMeta, 16, 52);

        if (model.estado === 'esperando') {
            this.mensaje('Llegá a ' + model.puntajeMeta + ' puntos. Espacio o Click para comenzar');
        } else if (model.estado === 'terminado') {
            this.mensaje('Game Over - Puntaje: ' + model.puntaje + ' - Espacio o click para reiniciar');
        } else if (model.estado === 'victoria') {
            this.mensaje('¡Ganaste! Puntaje: ' + model.puntaje + ' - Espacio o click para reiniciar');
        }
    }

    // Cada tubería se dibuja en: x del mundo - x del pájaro + x fija del pájaro en pantalla
    dibujarTuberias(model) {
        const ctx = this.ctx;
        const p = model.pajaro;
        const sueloY = model.alto - model.altoSuelo;
        const alturaBorde = 24;
        const saliente = 6;

        for (const t of model.tuberias) {
            const x = Math.round(t.mundoX - p.mundoX + this.pantallaX);
            if (x > model.ancho || x + t.ancho < 0) continue; // fuera de pantalla

            const huecoFin = t.huecoY + t.huecoAlto;

            // Cuerpos
            ctx.fillStyle = '#3F8F6B';
            ctx.fillRect(x, 0, t.ancho, t.huecoY);
            ctx.fillRect(x, huecoFin, t.ancho, sueloY - huecoFin);

            // Bordes (bocas) de cada tubería
            ctx.fillStyle = '#56B58A';
            ctx.fillRect(x - saliente, t.huecoY - alturaBorde, t.ancho + saliente * 2, alturaBorde);
            ctx.fillRect(x - saliente, huecoFin, t.ancho + saliente * 2, alturaBorde);
        }
    }

    mensaje(texto) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Nunito';
        ctx.textAlign = 'center';
        ctx.fillText(texto, this.canvas.width / 2, this.canvas.height / 2 + 8);
        ctx.textAlign = 'start';
    }

    dibujarPajaro(model) {
        const ctx = this.ctx;
        const p = model.pajaro;
        const anim = ANIMACIONES_PAJARO[p.animacion];
        if (model.tFreno > 0) {
            ctx.globalAlpha = Math.floor(model.tFreno * 10) % 2 ? 0.4 : 1;
        }

        let frame = Math.floor(p.tAnim * anim.fps);
        frame = anim.loop ? frame % anim.frames : Math.min(frame, anim.frames - 1);

        const s = this.spritePajaro;
        if (s.complete && s.naturalWidth > 0) {
            ctx.drawImage(s,
                frame * FRAME_ANCHO, anim.fila * FRAME_ALTO, FRAME_ANCHO, FRAME_ALTO,
                this.pantallaX, p.y, p.ancho, p.alto);
        } else {
            // Provisorio hasta que tengas el sprite
            ctx.fillStyle = '#6B3FA0';
            ctx.fillRect(this.pantallaX, p.y, p.ancho, p.alto);
        }

        ctx.globalAlpha = 1;
    }

    dibujarElementos(model) {
        const ctx = this.ctx;
        const p = model.pajaro;

        for (const e of model.elementos) {
            if (!e.activo) continue;
            const x = Math.round(e.mundoX - p.mundoX + this.pantallaX);
            if (x > model.ancho || x + e.ancho < 0) continue;

            const cfg = SPRITES_ELEMENTOS[e.tipo];
            const img = this.imgElementos[e.tipo];
            const frame = Math.floor(e.tAnim * cfg.fps) % cfg.frames;

            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img,
                    frame * cfg.frameAncho, 0, cfg.frameAncho, cfg.frameAlto,
                    x, e.y, e.ancho, e.alto);
            } else {
                // Provisorio hasta que tengas los sprites
                ctx.fillStyle = e.tipo === 'moneda' ? '#ffd400' : '#222';
                ctx.fillRect(x, e.y, e.ancho, e.alto);
            }
        }
    }
}