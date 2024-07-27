class roundedGraphics {
    constructor(parent, resolution) {
        /*
            canvas : Dom element used to render the final image
            buffer : buffer containing all rendered dom elements
            renderedImage : render of the pixelated image

            u_resolution : resolution of the canvas
            u_time : time in seconds

            imageRes : resolution of the pixelated image
        */


        // Canvas
        const canvas = document.createElement('canvas');
        this.parent = parent;
        
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        this.canvas = canvas;

        // Buffer
        const buffer = document.createElement('canvas');
        buffer.width = this.canvas.width;
        buffer.height = this.canvas.height;
        this.buffer = buffer;

        // RenderedImage
        const renderedImage = document.createElement('canvas');
        renderedImage.width = this.canvas.width;
        renderedImage.height = this.canvas.height;
        this.renderedImage = renderedImage;

        // Image resolution
        this.res = resolution;

        // Other parameters
        this.color = 'white';
        this.backgroundColor = 'black';

        this.elements = [];

        const fragmentShaderSource = `
            precision mediump float;
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 imageRes;

            float density = 1.3;
            float opacityScanline = .3;
            float opacityNoise = .2;
            float flickering = 0.1;

            float random (vec2 st) {
                return fract(sin(dot(st.xy,
                    vec2(12.9898,78.233)))*
                    43758.5453123);
            }

            float blend(const in float x, const in float y) {
                return (x < 0.5) ? (2.0 * x * y) : (1.0 - 2.0 * (1.0 - x) * (1.0 - y));
            }

            vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {
                vec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));
                return z * opacity + x * (1.0 - opacity);
            }

            void main(void) {  
                vec2 uv = gl_FragCoord.xy / u_resolution;
                vec2 st = (floor(uv * imageRes) + 0.5) / imageRes;
                // vec4 col = texture2D(u_texture, st);

                float t = max(min(fract(sin(u_time)*43758.5453),sin(u_time)),0.) * (floor(sin(u_time/2.))+1.);

                // float n = 1.; //fract(sin(u_time + (uv.x * 155.231) * (uv.y * 154.231))*43758.5453) * 0.4 + .6;

                vec2 d = sin(t)*(vec2(10.,6.)/u_resolution); 
                vec3 col = vec3(
                    texture2D(u_texture,st-d).x,
                    texture2D(u_texture,st  ).y,
                    texture2D(u_texture,st+d).z
                );

                // float rand = fract(sin(dot(uv + u_time, vec2(12.9898, 78.233))) * 43758.5453) * 0.1 + 0.05;
                
                // gl_FragColor = O + rand;

                float count = u_resolution.y * density;
                vec2 sl = vec2(sin(uv.y * count), cos(uv.y * count));
                vec3 scanlines = vec3(sl.x, sl.y, sl.x);

                col += col * scanlines * opacityScanline;
                col += col * vec3(random( uv * u_time )) * opacityNoise;
                col += col * sin( 110.0 * u_time ) * flickering;


                gl_FragColor = vec4(col,1.0);
            }
        `

        const shader = new WebGLShader(canvas, fragmentShaderSource);

        shader.updateUniform('u_resolution', '2f', [canvas.width, canvas.height]);
        shader.updateUniform('imageRes', '2f', [canvas.width, canvas.height]);
        
        this.shader = shader;

        const updateResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            this.canvas.width = w;
            this.canvas.height = h;

            this.buffer.width = w;
            this.buffer.height = h;

            shader.updateUniform('u_resolution', '2f', [w, h]);

            shader.updateSize(w, h);
        }

        window.addEventListener('resize', updateResize);
        window.addEventListener('orientationchange', updateResize);
        
        document.addEventListener('fullscreenchange', updateResize);
        
        parent.appendChild(canvas);

        this.shader.loadTexture(this.renderedImage, 'u_texture');
    }

    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        radius = 5,
        fill = false,
        stroke = true
      ) {
        if (typeof radius === 'number') {
          radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
          radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
          ctx.fill();
        }
        if (stroke) {
          ctx.stroke();
        }
      }
    
    renderBuffer() {
        this.buffer.width = this.canvas.width;
        this.buffer.height = this.canvas.height;

        const ctx = this.buffer.getContext('2d');
        ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);

        this.elements.sort((a, b) => {
            if (a.tagName === 'IMG' && b.tagName !== 'IMG') return -1;
            if (a.tagName !== 'IMG' && b.tagName === 'IMG') return 1;
            if (a.tagName === 'BUTTON' && b.tagName !== 'BUTTON') return 1;
            if (a.tagName !== 'BUTTON' && b.tagName === 'BUTTON') return -1;
            return 0;
        });

        this.elements.forEach(domElement => {

            if (!domElement.offsetParent || domElement.offsetWidth === 0 || domElement.offsetHeight === 0) return;

            const bounds = domElement.getBoundingClientRect();
            ctx.fillStyle = 'white';
            const coords = {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height
            }

            switch (domElement.tagName) {
                case 'BUTTON':
                    if (domElement.style.visibility === 'hidden') break;
                    /* const col = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();*/
                    ctx.fillStyle = this.color;
                    this.roundRect(ctx, coords.x, coords.y, coords.width, coords.height, 8, true, false);
                    domElement.style.backgroundColor = 'transparent';
                    break;
                case 'IMG':
                    // console.log('img', domElement.complete);
                    if (domElement.complete === false) break;
                    if (domElement.style.visibility === 'hidden') break;

                    ctx.save();
                    ctx.translate(coords.x + coords.width / 2, coords.y + coords.height / 2);

                    const renderer_rotate = domElement.dataset.rendererRotate;
                    if (renderer_rotate) {
                        let r = parseInt(renderer_rotate);
                        ctx.rotate((Date.now() / 5000 * r) % (2 * Math.PI));
                    } else {
                        ctx.rotate(Math.sin(Date.now() / 1000) * Math.PI / 30);
                    }
                    
                    ctx.drawImage(domElement, -coords.width / 2, -coords.height / 2, coords.width, coords.height);
                    ctx.restore();
                    domElement.style.opacity = 0;
                    break;
                case 'H1':
                    domElement.style.color = "transparent";
                    const cs = getComputedStyle(domElement);
                    ctx.fillStyle = "white";
                    ctx.textAlign = 'center';
                    ctx.font = cs.fontSize + " " + cs.fontFamily;

                    const fontHeight = parseInt(cs.fontSize);
                    const childs = domElement.querySelectorAll('span');
                    if (childs.length > 0) {
                        let id=0
                        childs.forEach(child => {
                            ctx.fillText(child.innerText, coords.x + coords.width / 2, coords.y + fontHeight * id + coords.height / 2);
                            id++
                        })       
                    } else {
                        ctx.fillText(domElement.innerText, coords.x + coords.width / 2, coords.y + coords.height / 2 + fontHeight / 2);
                    }
                    break;

                default:
                    console.error('Unsupported element type', domElement.tagName);
                    break;
            }
        });

        const renderedCtx = this.renderedImage.getContext('2d');

        this.renderedImage.width = this.res.x;
        this.renderedImage.height = this.res.y;

        renderedCtx.fillStyle = this.backgroundColor;
        renderedCtx.fillRect(0, 0, this.renderedImage.width, this.renderedImage.height); 

        renderedCtx.drawImage(this.buffer, 0, 0, this.renderedImage.width, this.renderedImage.height);
        
        this.shader.loadTexture(this.renderedImage, 'u_texture');
    }

    hexToRgb(hex) {
        hex = hex.trim()
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return { r, g, b };
    }

    updateColor(hex) {
        this.color = hex;
    }

    updateBackgroundColor(hex) {
        this.backgroundColor = hex;
    }

    updatePixelSize(size) {
        if (size.x < 1 || size.y < 1) return;
        this.shader.updateUniform('imageRes', '2f', [size.x, size.y]);
        this.res = { x: size.x, y: size.y };
    }
    
    render() {
        this.shader.updateUniform('u_time', '1f', (performance.now() % 30000) / 1000);
        this.renderBuffer();
        this.shader.update();
        requestAnimationFrame(() => this.render());
    }

    addElement(element) {
        this.elements.push(element);
    }
}