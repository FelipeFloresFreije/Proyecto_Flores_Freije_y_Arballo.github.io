class RunnerView{
    constructor(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = model.ancho;
        this.canvas.height = model.alto;
        this.canvas.style.width = '100%';
        this.canvas.style.display = 'block';
        this.canvas.tabIndex = 0;

        contenedor.innerHTML = '';
        contenedor.appenChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        this.pantallaX = 150;
    }

    render(model){
        const ctx = this.ctx;

        ctx.fillStyle = '#0C447C';
        ctx.fillRect(0, 0, model.ancho, model.alto);

        const p = model.pajaro;
        ctx.fillStyle = '#6B3FA0';
        ctx.fillRect(this.pantallaX, p.y, p.ancho, p.alto);

        ctx.fillStyle = '#000';
        ctx.font = '16px Nunito';
        ctx.fillText('Distancia: ' + Math.floor(p.mundoX) + ' px', 16, 28);

        if(model.stado === 'esperando'){
            this.mensaje('Espacio o Click para comenzar');
        } else if(model.estado === 'terminado'){
            this.mensaje('Game Over - Espacio o click para reiniciar');
        }
    }

    mensaje(texto) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(texto, this.canvas.width / 2, this.canvas.height / 2 + 8);
        ctx.textAlign = 'start';
    }
}