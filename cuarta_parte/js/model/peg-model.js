
/* ==========================================================
   PEG SOLITAIRE - MODEL
   ========================================================== */

// ----- CONSTANTES DEL TABLERO -----

const FILAS = 7;
const COLUMNAS = 7;

const tableroInicial = [
    [-1, -1,  1,  1,  1, -1, -1],
    [-1, -1,  1,  1,  1, -1, -1],
    [ 1,  1,  1,  1,  1,  1,  1],
    [ 1,  1,  1,  0,  1,  1,  1],
    [ 1,  1,  1,  1,  1,  1,  1],
    [-1, -1,  1,  1,  1, -1, -1],
    [-1, -1,  1,  1,  1, -1, -1]
];

const DIRECCIONES = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];

// ----- CLASE FICHA -----
/** Representa una ficha del tablero: su posición en la matriz, su posición en píxeles y su estado. */
class Ficha {
    //Crea una ficha en la casilla indicada.
    constructor(fila, col, img, tamCelda) {
        this.fila = fila;
        this.col = col;
        this.img = img;

        this.radio = tamCelda * 0.38;

        this.x = col * tamCelda + tamCelda / 2;
        this.y = fila * tamCelda + tamCelda / 2;

        this.bloqueada = false;
        this.sacudidaInicio = 0;
    }

    //Indica si un punto cae dentro de la ficha (sirve para detectar el click).
    contiene(px, py) {
        return Math.hypot(px - this.x, py - this.y) <= this.radio;
    }

    /*
    Ubica la ficha en el centro de la casilla indicada.
    También se usa para devolverla a su lugar cuando el movimiento es inválido.
    */
    colocarEn(fila, col, tamCelda) {
        this.fila = fila;
        this.col = col;

        this.x = col * tamCelda + tamCelda / 2;
        this.y = fila * tamCelda + tamCelda / 2;
    }
}

// ----- MODELO DEL JUEGO -----
/*
* Contiene el estado del juego y sus reglas: tablero, fichas, movimientos válidos y tiempo. */
export class PegModel {
    //Crea el modelo con el tamaño de casilla y las imágenes disponibles para las fichas.
    constructor(tamCelda, imagenesFicha) {
        this.tamCelda = tamCelda;
        this.imagenesFicha = imagenesFicha;

        this.tablero = [];
        this.fichas = [];

        this.juegoTerminado = false;

        this.tiempoLimite = 300;
        this.tiempoRestante = this.tiempoLimite;
    }

    // ----- INICIAR JUEGO -----
    //Inicia (o reinicia) la partida: copia el tablero inicial, resetea el tiempo y crea las fichas.
    iniciarJuego() {
        this.tablero = tableroInicial.map(fila => fila.slice());

        this.juegoTerminado = false;
        this.tiempoRestante = this.tiempoLimite;

        this.crearFichas();
        this.actualizarBloqueadas();
    }

    //Recorre la matriz y crea una Ficha por cada casilla con valor 1, con un tipo de imagen al azar.
    crearFichas() {
        this.fichas = [];

        for (let f = 0; f < FILAS; f++) {
            for (let c = 0; c < COLUMNAS; c++) {

                if (this.tablero[f][c] === 1) {

                    const indice = Math.floor(
                        Math.random() * this.imagenesFicha.length
                    );

                    const img = this.imagenesFicha[indice];

                    this.fichas.push(
                        new Ficha(f, c, img, this.tamCelda)
                    );
                }
            }
        }
    }

    // ----- MOVIMIENTOS -----
    //Indica si una posición está dentro de los límites de la matriz.
    dentroDelTablero(fila, col) {
        return fila >= 0 &&
               fila < FILAS &&
               col >= 0 &&
               col < COLUMNAS;
    }

    //Calcula los saltos válidos desde una casilla: tiene que haber una ficha contigua y una casilla vacía justo detrás de ella, en línea recta.
    calcularDestinos(fila, col) {
        const lista = [];

        for (const [df, dc] of DIRECCIONES) {

            const medioF = fila + df;
            const medioC = col + dc;

            const destF = fila + 2 * df;
            const destC = col + 2 * dc;

            if (this.dentroDelTablero(medioF, medioC) && 
                this.dentroDelTablero(destF, destC) && 
                this.tablero[medioF][medioC] === 1 && 
                this.tablero[destF][destC] === 0) {
                lista.push({
                    fila: destF, 
                    col: destC, 
                    saltadas: [
                        {fila: medioF, col: medioC}
                    ]
                });
            }
            const segundoF = fila + 2 * df;
            const segundoC = col + 2 * dc;

            const destF2 = fila + 3 * df;
            const destC2 = col + 3 * dc;

            if(this.dentroDelTablero(medioF, medioC) && this.dentroDelTablero(segundoF, segundoC) && this.dentroDelTablero(destF2, destC2) &&
            this.tablero[medioF][medioC] === 1 && this.tablero[segundoF][segundoC] === 1 && this.tablero[destF2][destC2] === 0){
                lista.push({
                    fila: destF2,
                    col: destC2,
                    saltadas: [
                        {fila: medioF, col: medioC},
                        {fila: segundoF, col: segundoC}
                    ]
                });        
            }
        }

        return lista;
    }

    //Revisa todo el tablero para saber si queda al menos un movimiento posible.
    hayMovimientos() {
        for (let f = 0; f < FILAS; f++) {
            for (let c = 0; c < COLUMNAS; c++) {

                if (this.tablero[f][c] === 1 && this.calcularDestinos(f, c).length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    //Marca cada ficha como bloqueada o no, según si tiene saltos posibles.
    actualizarBloqueadas() {
        this.fichas.forEach(ficha => {
            ficha.bloqueada = this.calcularDestinos(ficha.fila, ficha.col).length === 0;
        });
    }

    //Ejecuta un salto: actualiza la matriz, elimina la ficha saltada, mueve la ficha a su nueva casilla y recalcula las bloqueadas.
    aplicarMovimiento(ficha, destino) {

        this.tablero[ficha.fila][ficha.col] = 0;
        /*
        this.tablero[destino.saltadaFila]
                     [destino.saltadaCol] = 0;

        this.tablero[destino.segundaSaltadaFila]
                    [destino.segundaSaltadaCol] = 0;

        this.tablero[destino.fila][destino.col] = 1;
        */
       destino.saltadas.forEach(pos => {
            this.tablero[pos.fila][pos.col] = 0;
       });

       this.tablero[destino.fila][destino.col] = 1;

        this.fichas = this.fichas.filter(f => !destino.saltadas.some(pos => f.fila === pos.fila && f.col === pos.col)
            /*
            !(f.fila === destino.saltadaFila && f.col === destino.saltadaCol)
            */
        );

        ficha.colocarEn(destino.fila, destino.col, this.tamCelda);

        this.actualizarBloqueadas();
    }

    //Verifica si la partida terminó por falta de movimientos.
    verificarFin() {

        if (!this.hayMovimientos()) {

            return this.fichas.length === 1 ? 'victoria' : 'sinMovimientos';
        }

        return null;
    }

    // ----- TEMPORIZADOR -----
    //Vuelve el tiempo restante al tiempo límite de la partida.
    reiniciarTiempo() {
        this.tiempoRestante = this.tiempoLimite;
    }

    //Descuenta un segundo al tiempo restante.
    actualizarTiempo() {
        this.tiempoRestante--;

        if (this.tiempoRestante <= 0) {
            this.tiempoRestante = 0;
            return true;
        }

        return false;
    }

    // ----- CONSULTAS -----
    //Devuelve la cantidad de fichas que quedan en el tablero.
    obtenerCantidadFichas() {
        return this.fichas.length;
    }
}
