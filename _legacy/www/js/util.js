function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

function map(value, min, max, nmin, nmax) {
    return (value - min) / (max - min) * (nmax - nmin) + nmin;
}

function constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
