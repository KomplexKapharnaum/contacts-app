var imagesList = []
var i = 0
var timeout

// Socket.io
//
var socket = io();

socket.on('hello', function() {
    socket.emit('outputs')
    $('#mainapp').empty()
    imagesList = []
});

socket.on('output', function(output) {
    console.log('output', output)
    if (output.indexOf('.jpg') === -1) return
    var img = $('<img>').attr('src', output).appendTo('#mainapp').hide()

    // insert image at index i
    if (imagesList.length === 0) {
        imagesList.push(img)
    }
    else
    {
        imagesList.splice(i+1, 0, img)
    }
    showNext()
})

socket.on('reload', function() {
    location.reload()
})

socket.on('reload-totem', function() {
    location.reload()
})

function showNext() {
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(function() {
        showNext()
    }, 425 * 3) //425

    if (imagesList.length <= 0) return
    for (var j=0; j<imagesList.length; j++) {
        imagesList[j].hide()
    }
    i = (i+1)%imagesList.length
    imagesList[i % imagesList.length].show()
    console.log('show', i, imagesList[i % imagesList.length].attr('src'))
}
