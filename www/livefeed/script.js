const MIN_TIME = 1500;

const socket = io();

socket.on('hello', () => {
    socket.emit('display');
    socket.once('display-ok', requestFiles)
});

socket.on("live-file-uploaded", (filename) => {
    const url = "/live_upload/"+filename;
    getImage(url).then(image => {
        imageQueue.unshift(image);
    });
})

function requestFiles() {
    socket.emit("live-get-files")
    socket.once("live-receive-files", (filenames) => {
        const promises = filenames.map((file) => {
            const url = "/live_upload/"+file;
            return new Promise((res, rej) => {
                getImage(url).then(image => {
                    res(image)
                });
            })
        })

        Promise.all(promises).then(images => {
            console.log(images)
            imageQueue = imageQueue.concat(images)
            floodImages();
        })

    })
}

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

function createGrid(rows, columns) {
    document.documentElement.style.setProperty('--rows', rows-1);
    const main = document.querySelector('main');
    const allCells = [];
    for (let i = 0; i < columns; i++) {
        const column = createColumn();
        for (let j = 0; j < rows; j++) {
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

    if (!column) return;

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
var dom_columns;

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
        await imageAvailable();
        scrollColumn(dom_columns[index]);
        index++;
        if (index >= dom_columns.length) index = 0;
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
    const first = imageQueue.shift();
    imageQueue.push(first);
    return first;
}

function purgeGrid() {
    document.querySelector('main').innerHTML = "";
}

function getColsFromRows(rows, windowWidth, windowHeight) {
    if (rows <= 0) return 1; // Edge case: No rows should at least return 1 column.

    let cols = 1;
    let bestCols = 1;
    let bestAspectRatioDiff = Infinity;

    rows--;

    while (true) {
        let cellWidth = windowWidth / cols;
        let cellHeight = windowHeight / rows;
        let aspectRatio = cellWidth / cellHeight;
        let aspectRatioDiff = Math.abs(aspectRatio - 1); // How close to 1:1 ratio

        if (aspectRatioDiff < bestAspectRatioDiff) {
            bestAspectRatioDiff = aspectRatioDiff;
            bestCols = cols;
        } else {
            break;
        }

        cols++;
    }

    return bestCols;
}


const GRID_ROWS = 3;
let currentColumns;

function purgeGrid() {
    document.querySelector('main').innerHTML = "";
}

function floodImages() {
    const cells = document.querySelectorAll(".image");
    cells.forEach((cell) => {
        const img = shiftArray();
        cell.style.backgroundImage = `url(${img})`
    })
}

function update(columns) {
    if (currentColumns !== columns) {
        currentColumns = columns;
        purgeGrid();
        createGrid(GRID_ROWS, currentColumns);
        dom_columns = document.querySelectorAll('.column');
        if (imageQueue.length>0) floodImages()
    }
}

function updateGrid() {
    const cols = getColsFromRows(GRID_ROWS, window.innerWidth, window.innerHeight);
    update(cols);
}

window.addEventListener('resize', updateGrid);
window.addEventListener('load', updateGrid);
setInterval(updateGrid, 1000);