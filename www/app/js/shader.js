class WebGLShader {
    constructor(canvas, fragmentShaderSource) {
        this.canvas = canvas;

        this.gl = this.canvas.getContext('webgl');

        if (!this.gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }

        this.vertexShaderSource = `
            attribute vec4 a_position;
            void main(void) {
                gl_Position = a_position;
            }
        `;

        this.fragmentShaderSource = fragmentShaderSource;
        this.program = this.initProgram();

        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.positionBuffer = this.gl.createBuffer();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

        const size = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        this.gl.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset);

        const primitiveType = this.gl.TRIANGLE_STRIP;
        const count = 4;
        this.gl.drawArrays(primitiveType, 0, count);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initProgram() {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    updateUniform(name, type, value) {
        this.gl.useProgram(this.program);
        const location = this.gl.getUniformLocation(this.program, name);
        if (location == null) {
            console.error(`Uniform ${name} not found.`);
            return;
        }
        switch (type) {
            case '1f':
                this.gl.uniform1f(location, value);
                break;
            case '2f':
                this.gl.uniform2f(location, ...value);
                break;
            case '3f':
                this.gl.uniform3f(location, ...value);
                break;
            case '4f':
                this.gl.uniform4f(location, ...value);
                break;
            case '1i':
                this.gl.uniform1i(location, value);
                break;
            // Add more cases as needed for other types
            default:
                console.error(`Uniform type ${type} not supported.`);
        }
    }

    loadTexture(image, uniformName) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image vertically
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.updateUniform(uniformName, '1i', 0);
    }
    

    update() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}