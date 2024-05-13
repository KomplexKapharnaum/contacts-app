class KapharnaumSlider {
    constructor(slider) {

        this.min = slider.min;
        this.max = slider.max;
        this.id = slider.id;

        this.slider = document.createElement("div");
        this.slider.classList.add("kslider");
        for (let i = 0; i < 12; i++) {
            let dot = document.createElement("div");
            dot.classList.add("dot");
            this.slider.appendChild(dot);
        }
        this.dots = this.slider.querySelectorAll(".dot");
    }

    getDom() {
        return this.slider;
    }

    setValue(value) {
        let percent = (value - this.min) / (this.max - this.min);
        let index = Math.floor(percent * this.dots.length);
        for (let i = 0; i < this.dots.length; i++) {
            if (i <= index) {
                this.dots[i].classList.add("active");
            } else {
                this.dots[i].classList.remove("active");
            }
        }
    }
}

let sliders = {}

document.querySelectorAll("input[type=range]").forEach((slider) => {
    let kslider = new KapharnaumSlider(slider);
    slider.parentNode.insertBefore(kslider.getDom(), slider);
    kslider.setValue(slider.value);
    slider.addEventListener("input", (e) => {
        kslider.setValue(e.target.value);
    });
    sliders[slider.id] = kslider;
    // slider.remove();
});