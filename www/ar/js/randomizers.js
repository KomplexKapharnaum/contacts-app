AFRAME.registerComponent('random-model', {
    schema: {
        path: {type: 'string', is: 'uniform'},
        list: {type: 'array', is: 'uniform'}
    },
    randomize: function () {
        const models = this.data.list
        const index = Math.floor(Math.random() * models.length)
        this.el.removeAttribute('gltf-model')
        this.el.setAttribute('gltf-model', `${this.data.path}${models[index]}.glb`)
    },
    init: function () {
        this.randomize()
        /*
        setInterval(() => {
            this.randomize()
        }, 2000);*/
    }
})

AFRAME.registerComponent('random-texture', {
    schema: {
        path: {type: 'string', is: 'uniform'},
        list: {type: 'array', is: 'uniform'}
    },
    randomize: function () {
        const textures = this.data.list
        const index = Math.floor(Math.random() * textures.length) 
        this.el.components['model-shader'].data.texture = `${this.data.path}${textures[index]}.png`
        // this.el.setAttribute('material', 'src', `${this.data.path}${textures[index]}.png`)
    },
    init: function () {
        this.randomize()
        /*setInterval(() => {
            this.randomize()
        }, 2000);*/
    }
})