/*========== 01. Background ==========*/



const cnv_bg = document.getElementById('background-squares');
const ctx_bg = cnv_bg.getContext('2d');

cnv_bg.width = window.innerWidth;
cnv_bg.height = window.innerHeight;

let DRAW_BACKGROUND = true;
let DRAW_TARGET = true;

let CONFIG_BG = {
    space: 2,
    size: 16,
    offset: 2
}

let frameCount = 0;

function drawBackground() {

    CONFIG_BG.space = 2;
    CONFIG_BG.size = 16;

    let f = frameCount / 150;
    for (let y = 0; y < cnv_bg.height; y += CONFIG_BG.size + CONFIG_BG.space) {
        for (let x = 0; x < cnv_bg.width; x += CONFIG_BG.size + CONFIG_BG.space) {
            let p = noise.perlin3(x / 100, y / 100, f);
            if (p > 0.2) {
                ctx_bg.fillRect(x, y, CONFIG_BG.size, CONFIG_BG.size);
            }
        }
    }
}

const dom_highlight = document.querySelectorAll("h1, h2, .highlight, video");

function drawTarget() {
    CONFIG_BG.space = 0;
    CONFIG_BG.size = 18;

    const offset = CONFIG_BG.offset * CONFIG_BG.size

    dom_highlight.forEach((el) => {

        let rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        let x1 = Math.round(rect.left / CONFIG_BG.size) * CONFIG_BG.size - offset;
        let y1 = Math.round(rect.top / CONFIG_BG.size) * CONFIG_BG.size - offset;
        let x2 = Math.round(rect.right / CONFIG_BG.size) * CONFIG_BG.size + offset;
        let y2 = Math.round(rect.bottom / CONFIG_BG.size) * CONFIG_BG.size + offset;

        let f = frameCount / 50;
        for (let y = y1; y < y2; y += CONFIG_BG.size) {
            for (let x = x1; x < x2; x += CONFIG_BG.size) {
                let perlin = noise.perlin3(x / 50, y / 50, f);
                
                let w = x2 - x1;
                let h = y2 - y1;

                let dx = 1 - constrain(distance(x, 0, x1 + w/2, 0) / (w/2), 0, 1);
                let dy = 1 - constrain(distance(y, 0, y1 + h/2, 0) / (h/2), 0, 1);
                
                let darken = Math.max(dx, dy);

                if (perlin * darken + darken**0.7 > 0.35 ) {
                    ctx_bg.fillRect(x, y, CONFIG_BG.size, CONFIG_BG.size);
                }

            }
        }

    });
}

function updateBackground() {
    ctx_bg.clearRect(0, 0, cnv_bg.width, cnv_bg.height);
    ctx_bg.fillStyle = 'black';
    
    if (DRAW_BACKGROUND) drawBackground();
    if (DRAW_TARGET) drawTarget();
    
    frameCount++;
    requestAnimationFrame(updateBackground);
}

updateBackground();