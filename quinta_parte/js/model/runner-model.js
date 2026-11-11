class Pajaro{
    constructor{
        this.ancho = 40;
        this.alto = 30;
        this.mundoX = 0;
        this.y = 0;
        this.vy = 0;
    }
}

class RunnerModel{
    constructor{
        this.ancho = 960;
        this.alto = 540;

        this.velocidadX = 200;
        this.gravedad = 1500;
        this.impulso = -450;

        this.pajaro = new Pajaro();
        this.reiniciar();
    }

    reiniciar(){
        this.pajaro.mundoX = 0;
        this.pajaro.y = this.alto / 2;
        this.pajaro.vy = 0;
        this.estado = 'esperando';
    } 

    iniciar(){
        this.estado = 'jugando';
    }

    aletear(){
        if(this.estado === 'jugando'){
            this.pajaro.vy = this.impulso;
        }
    }

    actualizar(dt){
        if(this.estado !== 'jugando'){
            return;
        }

        const p = this.pajaro;

        p.mundoX += this.velocidadX * dt;

        p.vy += this.gravedad * dt;
        p.y += p.vy * dt;

        if(p.y < 0){
            p.y = 0;
            p.vy = 0;
        }

        if(p.y + p.alto >= this.alto){
            p.y = this.alto - p.alto;
            this.estado = 'terminado';
        }
    }
}