class roundedGraphics {
    constructor(parent, resolution) {
        const canvas = document.createElement('canvas');
        this.parent = parent;
        
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;

        const buffer = document.createElement('canvas');
        buffer.width = this.width / resolution;
        buffer.height = this.height / resolution;
        this.buffer = buffer;
        this.res = resolution;

        // document.body.appendChild(buffer);

        this.elements = [];

        const fragmentShaderSource = `
            precision mediump float;
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            uniform vec4 color;
            void main(void) {
                vec2 uv = vec2(0.0, 0.0); // UV start
                vec2 uvEnd = vec2(1.0, 1.0); // UV end
                vec2 texCoord = mix(uv, uvEnd, gl_FragCoord.xy / u_resolution);
                vec4 texColor = texture2D(u_texture, texCoord);
                gl_FragColor = color * smoothstep(.45, .55, texColor.r);;
            }
        `

        const shader = new WebGLShader(canvas, fragmentShaderSource);
        shader.updateUniform('u_resolution', '2f', [canvas.width, canvas.height]);
        this.shader = shader;

        parent.appendChild(canvas);

        this.shader.loadTexture(buffer, 'u_texture');
    }
    
    renderBuffer() {
        const ctx = this.buffer.getContext('2d');
        ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);
        this.elements.forEach(domElement => {

            if (!domElement.offsetParent || domElement.offsetWidth === 0 || domElement.offsetHeight === 0) return;

            const bounds = domElement.getBoundingClientRect();
            ctx.fillStyle = 'white';
            const coords = {
                x: bounds.left / this.res,
                y: bounds.top / this.res,
                width: bounds.width / this.res,
                height: bounds.height / this.res
            }

            switch (domElement.tagName) {
                case 'BUTTON':
                    ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
                    break;
                case 'IMG':
                    // console.log('img', domElement.complete);
                    if (domElement.complete === false) return;
                    ctx.save();
                    ctx.translate(coords.x + coords.width / 2, coords.y + coords.height / 2);
                    ctx.rotate(Math.sin(Date.now() / 1000) * Math.PI / 10);
                    ctx.drawImage(domElement, -coords.width / 2, -coords.height / 2, coords.width, coords.height);
                    ctx.restore();
                    domElement.style.opacity = 0;
                    break;
                default:
                    console.error('Unsupported element type', domElement.tagName);
                    break;
            }
        });
        this.shader.loadTexture(this.buffer, 'u_texture');
    }

    hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    updateColor(hex) {
        const rgba = this.hexToRgb(hex);
        this.shader.updateUniform('color', '4f', [rgba.r / 255, rgba.g / 255, rgba.b / 255, 1]);
    }
    
    render() {
        this.renderBuffer();
        this.shader.update();
        requestAnimationFrame(() => this.render());
    }

    addElement(element) {
        this.elements.push(element);
    }
}