class Buddy {
    constructor(container, overlay, icon, image, eyes, text) {
        this.container = container;
        this.overlay = overlay;
        this.icon = icon;
        this.image = image;
        this.eyes = eyes;
        this.text = text;
        this.shown = false;
        this.images = [];

        this.animations = {};
        this.currentAnimations = {};

        this.currentDialogue = false;

        this.imageIndex = 0;
        this.loadImages().then(() => {

            for (let i = this.images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.images[i], this.images[j]] = [this.images[j], this.images[i]];
            }

            const next = (ms) => {
                setTimeout(() => {
                    this.nextImage();
                    ms = (Math.sin(new Date().getTime() / 1000) + 1) * 250 + 50;
                    next(ms);
                }, ms);
            }
            next(0);
        });

        // Add animations

        this.addAnimation('eyes', 'idle', () => {
            const x = 0;
            const y = Math.sin(new Date().getTime() / 500) * 4;
            return {x, y};
        });

        this.addAnimation('eyes', 'talk', () => {
            const x = Math.sin(new Date().getTime() / 60) * 8;
            const y = Math.cos(new Date().getTime() / 60) * 4;
            return {x, y};
        });

        this.addAnimation('image', 'idle', () => {
            const x = 0;
            const y = Math.cos(new Date().getTime() / 500) * 8;
            return {x, y};
        });

        this.addAnimation('image', 'talk', () => {
            const x = Math.sin(new Date().getTime() / 100) * 8;
            const y = - Math.abs(Math.cos(new Date().getTime() / 100) * 4);
            const r = x / 2;
            return {x, y, r};
        });

        this.setAnimation('eyes', 'idle');
        this.setAnimation('image', 'idle');

        this.handleAnimation();

        this.icon.addEventListener('click', async () => {
            if (!this.currentDialogue) return;
            this.overlay.classList.add('active');
            this.show(false);
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.startDialogue();
            this.overlay.classList.remove('active');
        });
    }

    available(state) {
        this.icon.classList.toggle('available', state);
    }

    show(state) {
        this.shown = !state;
        this.icon.classList.toggle('hidden', this.shown);
        this.container.classList.toggle('shown', this.shown);
    }

    async loadImages() {
        const imageCount = 26;
        const promises = [];
        for (let i = 0; i < imageCount; i++) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = `${document.BASEPATH}/img/buddy/${i}.png`;
                this.images.push(img);
            }));
        }
        return Promise.all(promises);
    }

    nextImage() {
        this.imageIndex = (this.imageIndex + 1) % this.images.length;
        this.image.src = this.images[this.imageIndex].src;
    }

    addAnimation(part, name, f) {
        if (!this.animations[part]) this.animations[part] = {};
        this.animations[part][name] = f;
    }

    setAnimation(part, name=false) {
        this.currentAnimations[part] = name;
    }

    handleAnimation() {
        const play = () => {
            if (this.shown) {
                for (const part in this.currentAnimations) {
                    const animation = this.animations[part][this.currentAnimations[part]];
                    if (animation) {
                        const {x, y, r} = animation();
                        this[part].style.transform = `rotate(${r || 0}deg) translate(${x}px, ${y}px)`;    
                    }
                }
            }
            requestAnimationFrame(play);
        }
        play();
    }

    async appendText(text) {
        this.text.textContent = '';

        this.text.classList.add('shown');
        this.setAnimation('image', 'talk');
        this.setAnimation('eyes', 'talk');

        while (text.length > 0) {
            this.text.textContent += text[0];
            await new Promise(resolve => setTimeout(resolve, 5));
            text = text.slice(1);
        }
        this.setAnimation('image', 'idle');
        this.setAnimation('eyes', 'idle');
        this.text.innerHTML+= '<br><span class="skip">Appuyez pour continuer...</span>'
    }

    setCurrentDialogue(textList=false) {
        this.currentDialogue = textList;
        this.available(textList!=false);
    }

    async startDialogue() {
        if (this.currentDialogue) {
            for (const text of this.currentDialogue) {
                await this.appendText(text);
                await new Promise(resolve => document.addEventListener('click', resolve));
            }
            this.show(true);
            this.text.classList.remove('shown');
        }
    }
}

const b = new Buddy(
    document.getElementById('buddy-container'),
    document.getElementById('buddy-overlay'),
    document.getElementById('buddy-icon'), 
    document.getElementById('buddy'),
    document.getElementById('buddy-eyes'),
    document.getElementById('buddy-text')
);

b.setCurrentDialogue([
    'Salut, je suis Buddy, un assistant virtuel qui va te guider dans le cyberespace !',
    'Je vais te montrer plein de choses à faire !',
    'Déjà, est-ce que tu as créé ton avatar ? Tu peux en générer un dans ta page Profile, ensuite trouve la partie Avatar. Tu verras, c\'est super fun !',
])

// b.appendText('Salut, bienvenue dans le cyberespace ! Tu vas voir, il y a plein de choses à faire :)');