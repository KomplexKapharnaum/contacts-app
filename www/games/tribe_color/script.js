function getColor() {
    const urlParams = new URLSearchParams(window.location.search);
    const colorParam = urlParams.get('color') || 'blue';
    return colorParam
}

function setColor(color) {
    document.body.style.setProperty('--color', color);
}

function setOpacity(opacity) {
    document.body.style.setProperty('--opacity', opacity);
}

setColor(getColor());