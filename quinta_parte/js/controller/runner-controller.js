class RunnerController {
    constructor(contenedor){
        this.model = new RunnerModel();
        this.view = new RunnerView(contenedor, this.model);   
        
        this.ultimoTiempo = 0;
        this.rafId = null;

        this.onTecla = this.onTecla.bind(this);
        this.onClick = this.onClick.bind(this);
        this.loop = this.loop.bind(this);
    }

    iniciar(){
        document.addEventListener('keydown', this.onTecla);
        this.view.canvas.addEventListener('mousedown', this.onClick);
        this.view.canvas.focus();

        this.ultimoTiempo = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    detener() {
        cancelAnimationFrame(this.rafId);
        document.removeEventListener('keydown', this.onTecla);
        this.view.canvas.removeEventListener('mousedown', this.onClick);
    }

    onTecla(e){
        if(e.code === 'Space'){
            e.preventDefault();
            if(!e.repeat){
                this.accion();
            }
        }
    }
    
    onClick(){
        this.accion();
    }

    accion() {
        const m = this.model;
        if (m.estado === 'esperando') {
            m.iniciar();
            m.aletear();
        } else if (m.estado === 'jugando'){
            m.aletear();
        } else if (m.estado === 'terminado' || m.estado === 'victoria') {
            m.reiniciar();
        }
    }

    loop(ahora) {
        const dt = Math.min((ahora - this.ultimoTiempo) / 1000, 0.05);
        this.ultimoTiempo = ahora;

        this.model.actualizar(dt);
        this.view.render(this.model);

        this.rafId = requestAnimationFrame(this.loop);
    }
}