const MIN_TIME = 1500;

const socket = io();

socket.on('hello', () => {
    socket.emit('display');
});

socket.on("live-file-uploaded", (filename) => {
    const url = "/live_upload/"+filename;
    getImage(url).then(image => {
        imageQueue.unshift(image);
    });
})

// const newImg = async () => {
//     const url = selectCustomImage(); // "https://picsum.photos/seed/"+seed+"/300/300";
//     getImage(url).then(image => {
//         imageQueue.unshift(image);
//     });
// }

// function selectCustomImage() {
//     customImageListIndex++;
//     if (customImageListIndex >= customImageList.length) customImageListIndex = 0;
//     return "./imgs/"+customImageList[customImageListIndex];
// }

const template_column = document.querySelector('#template-column');
const template_cell = document.querySelector('#template-cell');

let imageQueue = [];
const createCell = () => template_cell.content.cloneNode(true).firstElementChild;
const createColumn = () => template_column.content.cloneNode(true).firstElementChild; 

function animateCells(cells) {
    const anim = () => {
        cells.forEach(cellObj => {
            const cell = cellObj.cell;
            const seed = cellObj.seed;

            noise.seed(seed);
            const t = Date.now();

            const x = noise.simplex3(t/5000, 0, 0) * 16;
            const y = noise.simplex3(0, t/5000 + seed/3, 0) * 16;

            const r = noise.simplex3(0, 0, t/3000 + seed) * 5;

            cell.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
        })
        requestAnimationFrame(anim);
    }
    anim();
}

const overlay = document.getElementById("roots")
function animateOverlay() {
    const anim = () => {
        const t = Date.now();
        const x = noise.simplex3(t/5000, 0, 0) * 16;
        const y = noise.simplex3(0, t/5000, 0) * 16;
        
        overlay.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
        requestAnimationFrame(anim);
    }
    anim();
}
animateOverlay()

function createGrid(columns, rows) {
    document.documentElement.style.setProperty('--columns', columns-1);
    const main = document.querySelector('main');
    const allCells = [];
    for (let i = 0; i < rows; i++) {
        const column = createColumn();
        for (let j = 0; j < columns; j++) {
            const cell = createCell();
            cell.querySelector(".image").style.backgroundColor = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
            allCells.push({
                cell,
                seed: Math.random() * 1000
            });
            column.appendChild(cell);
        }
        main.appendChild(column);
    }
    animateCells(allCells);
}

createGrid(4, 2);

function scrollColumn(column) {

    column.classList.add('scroll');
    const lastCell = column.lastElementChild;
    const img = shiftArray();

    lastCell.querySelector(".image").style.backgroundImage = `url(${img})`;
    lastCell.querySelector(".username").innerHTML = Math.random().toString(36).substring(7);
    
    const pp = lastCell.querySelector(".pp");
    pp.style.filter = `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;

    setTimeout(() => {
        const lastCell = column.firstElementChild;
        column.insertBefore(lastCell, column.lastElementChild.nextSibling);
        column.classList.remove('scroll');
    }, MIN_TIME);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const columns = document.querySelectorAll('.column');

function imageAvailable() {
    return new Promise(resolve => {
        const check = () => {
            if (imageQueue.length > 0) {
                resolve();
            } else {
                requestAnimationFrame(check);
            }
        }
        check();
    })
}

function startImageClock() {
    let index = 0;
    const run = async () => {
        // newImg();
        await imageAvailable();
        scrollColumn(columns[index]);
        index++;
        if (index >= columns.length) index = 0;
        await sleep(MIN_TIME);
        run();
    }
    run();
}

startImageClock();

async function getImage(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

function shiftArray() {
    return imageQueue.shift();
}
