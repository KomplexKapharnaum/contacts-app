
// UUID
//
var uuid = Cookies.get('userid') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
Cookies.set('userid', uuid, { expires: 3700 })
$('#userid').val(uuid)
console.log(uuid)

// Generate BUTTON
//

$('#goBtn').click(function() 
{
    // Capture image from webcam as base64
    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); 
    var dataURL = canvas.toDataURL('image/jpg');

    // Build the data
    var data = {
        userid: uuid,
        nick: $('#nick').val(),
        hybrid: $('#hybrid').val(),
        selfie:  dataURL
    }

    // Hide/Show Parts
    $('.part').hide()

    // Fetch POST /gen => Create pending request on server 
    fetch('/gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        // Request created (pending)
        console.log("== New request created:")
        console.log(response)
        $('#reqid').html(response.uuid)
        $('#progress').show()
    })
    .catch(error => {

        // Request creation error..
        console.error('== Request error:', error)
        $('#reqerr').html(error)
        $('#error').show()
    })
})

// Socket.io
//
var socket = io();
socket.on('hello', function() {
  socket.emit('hi', uuid);
});

socket.on('nickname', function(nick) {
    if (!nick) return
    $('#nick').val(nick)
    $('#nick').attr('disabled', 'disabled')    
})

socket.on('error', function(req, err) {
    console.error('== AI error:', err)
    $('.part').hide()
    $('#error').show()
    $('#reqerr').html(
        JSON.stringify(req) + '<br><br>' +
        JSON.stringify(err))
})

socket.on('done', function(req) {
    console.log('done', req)
    $('.part').hide()
    $('#done').show()
    $('<img>').attr('src', req.output).appendTo('#done')
    // $('<div class="request">').html(JSON.stringify(req)).appendTo('#done')
})


socket.on('reload', function() {
    location.reload()
})


// Retry button
//
$('#retryBtn').click(function() {
    location.reload()
})


// Webcam
//
var video = document.querySelector("#selfieElement");
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}