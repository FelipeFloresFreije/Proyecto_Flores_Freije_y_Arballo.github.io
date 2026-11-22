// VIEW: solo dibuja. Lee el model, nunca lo modifica.

const BASE_IMG = 'assets/quinta_parte/img/';
const ASSETS = {
    murcielago: BASE_IMG + 'bat.png',
    moneda:     BASE_IMG + 'coin.png',
    enemigo:    BASE_IMG + 'enemy.png',
    torre:      BASE_IMG + 'tower.png',
    background: BASE_IMG + 'background.png',
    midground:  BASE_IMG + 'midground.png',
    foreground: BASE_IMG + 'foreground.png',
    ground:     BASE_IMG + 'ground.png'
};

// Spritesheets de una sola fila. El tamaño de cada frame se calcula
// con (ancho de la imagen / cantidad de frames), así no hay que
// medir nada a mano.
const SPRITES = {
    murcielago: { frames: 8, dibujoAncho: 64, dibujoAlto: 64 },
    moneda:     { frames: 8, fps: 12, espejo: false },
    enemigo:    { frames: 8, fps: 12, espejo: false }   
};

// Animaciones del murciélago (índices de frame dentro de la fila)
const ANIMACIONES_MURCIELAGO = {
    planeo: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 8,  loop: true  },
    aleteo: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 24, loop: false },
    caida:  { frames: [3],                      fps: 1,  loop: true  }
};

// Animación por keyframes de la explosión (t va de 0 a 1 y se interpola entre claves)
const KEYFRAMES_EXPLOSION = [
    { t: 0,    escala: 1,   rot: 0,   alpha: 1, anillo: 0 },
    { t: 0.35, escala: 1.7, rot: 3.5, alpha: 1, anillo: 0.5 },
    { t: 1,    escala: 0.2, rot: 9,   alpha: 0, anillo: 1 }
];

// Spritesheet de torres: 6 variantes en fila. Fracciones del frame:
const TORRE = { frames: 6, fusteFrac: 0.45, capFrac: 0.35, cuerpoDesde: 0.55, cuerpoAlto: 0.08 };

// Capas de parallax, de atrás hacia adelante. factor 1 = misma velocidad que las torres.
const CAPAS = [
    { img: 'background', factor: 0.05, espejo: false },
    { img: 'midground',  factor: 0.2,  espejo: false },
    { img: 'foreground', factor: 0.5,  espejo: false },
    { img: 'ground',     factor: 1.0,  espejo: false }
];

function cargarImagen(src) {
    const img = new Image();
    img.src = src;
    return img;
}

function listo(img) {
    return img.complete && img.naturalWidth > 0;
}

function interpolar(kfs, t) {
    for (let i = 1; i < kfs.length; i++) {
        if (t <= kfs[i].t) {
            const a = kfs[i - 1];
            const b = kfs[i];
            const u = (t - a.t) / (b.t - a.t);
            const r = {};
            for (const k in a) {
                if (k !== 't') r[k] = a[k] + (b[k] - a[k]) * u;
            }
            return r;
        }
    }
    const ultima = Object.assign({}, kfs[kfs.length - 1]);
    delete ultima.t;
    return ultima;
}

// Una capa de parallax: una imagen que se repite horizontalmente.
class CapaParallax {
    constructor(img, factor, espejo) {
        this.img = img;
        this.factor = factor;
        this.espejo = espejo;
    }

    render(ctx, mundoX, ancho, alto) {
        if (!listo(this.img)) return;

        const w = ancho;                     
        const pos = mundoX * this.factor;
        const base = Math.floor(pos / w);
        const x0 = -Math.floor(pos - base * w);

        for (let i = 0; x0 + i * w < ancho; i++) {
            const x = x0 + i * w;
            if (this.espejo && (base + i) % 2 !== 0) {
                ctx.save();
                ctx.translate(x + w, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(this.img, 0, 0, w, alto);
                ctx.restore();
            } else {
                ctx.drawImage(this.img, x, 0, w, alto);
            }
        }
    }
}

class RunnerView {
    constructor(contenedor, model) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = model.ancho;
        this.canvas.height = model.alto;
        this.canvas.tabIndex = 0;

        contenedor.innerHTML = '';
        contenedor.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;   

        // El murciélago se dibuja siempre en la misma X de pantalla;
        this.pantallaX = 150;

        this.img = {};
        for (const nombre in ASSETS) {
            this.img[nombre] = cargarImagen(ASSETS[nombre]);
        }

        this.capas = CAPAS.map(c => new CapaParallax(this.img[c.img], c.factor, c.espejo));
    }

    render(model) {
        const ctx = this.ctx;
        const p = model.pajaro;

        // Fondo de seguridad por si falta alguna imagen
        ctx.fillStyle = '#0B0B2B';
        ctx.fillRect(0, 0, model.ancho, model.alto);

        // Capas de fondo (1 a 3), después torres y elementos, y al final el suelo (capa 4), así el suelo tapa la base de las torres.
        const suelo = this.capas[this.capas.length - 1];
        for (const capa of this.capas.slice(0, -1)) {
            capa.render(ctx, p.mundoX, model.ancho, model.alto);
        }
        this.dibujarTuberias(model);
        this.dibujarElementos(model);
        suelo.render(ctx, p.mundoX, model.ancho, model.alto);

        this.dibujarMurcielago(model);
        this.dibujarHud(model);

        
        if (model.estado === 'esperando') {
            const objetivo = model.modo === 'infinito'
                ? 'Conseguí tantos puntos como puedas.'
                : 'Llegá a ' + model.puntajeMeta + ' puntos.';

            this.mensaje(
                '¡Listo para volar!',
                objetivo + ' Espacio o click para comenzar'
            );

        } else if (model.estado === 'terminado') {
            this.mensaje(
                'Game Over - Puntaje: ' + model.puntaje,
                'Espacio o click para reiniciar'
            );

        } else if (model.estado === 'victoria') {
            this.mensaje(
                '¡Ganaste! - Puntaje: ' + model.puntaje,
                'Espacio o click para reiniciar'
            );
        }
    }

    // ---------- Torres ----------

    dibujarTuberias(model) {
        const ctx = this.ctx;
        const p = model.pajaro;
        const sueloY = model.alto - model.altoSuelo;
        const img = this.img.torre;

        for (const t of model.tuberias) {
            const x = Math.round(t.mundoX - p.mundoX + this.pantallaX);
            if (x > model.ancho + 100 || x + t.ancho < -100) continue; // fuera de pantalla

            const huecoFin = t.huecoY + t.huecoAlto;

            if (listo(img)) {
                const xc = x + t.ancho / 2;
                // torre de arriba (cuelga del techo) y de abajo (sale del suelo)
                this.dibujarTorre(img, t.variante, xc, t.huecoY, t.huecoY, -1, t.ancho);
                this.dibujarTorre(img, t.variante, xc, huecoFin, sueloY - huecoFin, 1, t.ancho);
            } else {
                // Provisorio hasta que cargue la imagen
                ctx.fillStyle = '#4B3F72';
                ctx.fillRect(x, 0, t.ancho, t.huecoY);
                ctx.fillRect(x, huecoFin, t.ancho, sueloY - huecoFin);
            }
        }
    }

    // Dibuja una torre desde su punta (la que mira al hueco) hacia afuera.
    dibujarTorre(img, variante, xc, yPunta, largo, dir, ancho) {
        const ctx = this.ctx;
        const fw = img.naturalWidth / TORRE.frames;
        const fh = img.naturalHeight;
        const fx = variante * fw;

        const anchoDibujo = ancho / TORRE.fusteFrac;
        const s = anchoDibujo / fw;
        const capH = fh * TORRE.capFrac * s;

        ctx.save();
        ctx.translate(xc, yPunta);
        ctx.scale(1, dir);

        // cuerpo: franja lisa repetida
        const sy = fh * TORRE.cuerpoDesde;
        const sh = Math.max(1, Math.round(fh * TORRE.cuerpoAlto));
        const dh = sh * s;
        const srcX = fx + fw * (0.5 - TORRE.fusteFrac / 2);
        for (let y = capH - 1; y < largo; y += dh) {
            const h = Math.min(dh, largo - y);
            ctx.drawImage(img, srcX, sy, fw * TORRE.fusteFrac, h / s, -ancho / 2, y, ancho, h);
        }

        // remate con la gárgola, encima del cuerpo
        ctx.drawImage(img, fx, 0, fw, fh * TORRE.capFrac,
            -anchoDibujo / 2, 0, anchoDibujo, capH);

        ctx.restore();
    }

    // ---------- Monedas y enemigos ----------

    dibujarElementos(model) {
        const ctx = this.ctx;
        const p = model.pajaro;

        for (const e of model.elementos) {
            if (!e.activo) continue;
            const x = Math.round(e.mundoX - p.mundoX + this.pantallaX);
            if (x > model.ancho || x + e.ancho < 0) continue;

            const cfg = SPRITES[e.tipo];
            const img = this.img[e.tipo];

            if (e.golpeado) ctx.globalAlpha = 0.4;

            if (listo(img)) {
                const fw = img.naturalWidth / cfg.frames;
                const fh = img.naturalHeight;
                const frame = Math.floor(e.tAnim * cfg.fps) % cfg.frames;

                if (cfg.espejo) {
                    ctx.save();
                    ctx.translate(x + e.ancho, e.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, frame * fw, 0, fw, fh, 0, 0, e.ancho, e.alto);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, frame * fw, 0, fw, fh, x, e.y, e.ancho, e.alto);
                }
            } else {
                // Provisorio hasta que cargue la imagen
                ctx.fillStyle = e.tipo === 'moneda' ? '#ffd400' : '#2ecc40';
                ctx.fillRect(x, e.y, e.ancho, e.alto);
            }

            ctx.globalAlpha = 1;
        }
    }

    // ---------- Murciélago (personaje) ----------

    dibujarMurcielago(model) {
        const ctx = this.ctx;
        const p = model.pajaro;
        const img = this.img.murcielago;
        const cfg = SPRITES.murcielago;

        const cx = this.pantallaX + p.ancho / 2;
        const cy = p.y + p.alto / 2;

        let escala = 1;
        let rot = 0;
        let alpha = 1;
        let frame = 0;

        if (p.animacion === 'explosion') {
            // animación por keyframes: giro, crecimiento, fundido y anillo de impacto
            const k = interpolar(KEYFRAMES_EXPLOSION, Math.min(p.tAnim / model.duracionExplosion, 1));
            escala = k.escala;
            rot = k.rot;
            alpha = k.alpha;
            frame = 3;

            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - k.anillo);
            ctx.strokeStyle = '#ff9f1a';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, 20 + k.anillo * 110, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else {
            const anim = ANIMACIONES_MURCIELAGO[p.animacion];
            let i = Math.floor(p.tAnim * anim.fps);
            i = anim.loop ? i % anim.frames.length : Math.min(i, anim.frames.length - 1);
            frame = anim.frames[i];
            // se inclina según la velocidad vertical
            rot = Math.max(-0.4, Math.min(0.7, p.vy / 1000));
        }

        // parpadeo mientras está frenado por un enemigo
        if (model.tFreno > 0) {
            alpha *= Math.floor(model.tFreno * 10) % 2 ? 0.4 : 1;
        }

        if (alpha <= 0) return;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(escala, escala);
        ctx.globalAlpha = alpha;

        if (listo(img)) {
            const fw = img.naturalWidth / cfg.frames;
            const fh = img.naturalHeight;
            ctx.drawImage(img, frame * fw, 0, fw, fh,
                -cfg.dibujoAncho / 2, -cfg.dibujoAlto / 2, cfg.dibujoAncho, cfg.dibujoAlto);
        } else {
            // Provisorio hasta que cargue la imagen
            ctx.fillStyle = '#9D6FD9';
            ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
        }

        ctx.restore();
    }

    // ---------- HUD y mensajes ----------

    
    dibujarHud(model) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(12, 68, 124, 0.8)';
        ctx.fillRect(12, 12, 230, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '700 16px Nunito, sans-serif';
        ctx.textAlign = 'start';

        const objetivo = model.modo === 'infinito' ? '∞' : model.puntajeMeta;

        ctx.fillText('Puntaje: ' + model.puntaje + ' / ' + objetivo, 24, 36);

        // Barra de progreso: solo para modos con objetivo.
        if (model.modo !== 'infinito') {
            const progreso = Math.min(model.puntaje / model.puntajeMeta, 1);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(24, 48, 206, 10);

            ctx.fillStyle = '#67E8F9';
            ctx.fillRect(24, 48, 206 * progreso, 10);
        }

        if (model.tFreno > 0) {
            ctx.fillStyle = '#FF8080';
            ctx.font = '700 16px Nunito, sans-serif';
            ctx.fillText('¡Frenado!', 256, 36);
        }
    }


    mensaje(titulo, subtitulo) {
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, cy - 50, this.canvas.width, 100);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '700 30px Nunito, sans-serif';
        ctx.fillText(titulo, cx, cy - 6);
        ctx.font = '400 20px Nunito, sans-serif';
        ctx.fillText(subtitulo, cx, cy + 28);
        ctx.textAlign = 'start';
    }
}