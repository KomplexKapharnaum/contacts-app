
// UUID
//
var uuid = Cookies.get('userid') || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
Cookies.set('userid', uuid, { expires: 3700 })
// $('#userid').val(uuid)
console.log(uuid)

function generateInput() {
    let data = {
        name: USER.name,
        userid: uuid,
        selfie: USER.selfie,
        prompts: {}
    }
    USER.prompts.forEach((prompt, index) => {
        data.prompts[prompt.name] = prompt.value;
    });
    return data;
}

// Generate BUTTON
//

const avatarContainer = document.getElementById('avatar-container');
const avatarLabel = document.getElementById('avatar-label');
function showImage(link) {
    avatarContainer.innerHTML = '';
    const img = document.createElement('img');
    img.onload = function() {
        avatarLabel.innerText = "Voici ton avatar !"
    }
    img.src = link;
    avatarContainer.appendChild(img);
}

function submitData() {

    $('#avatar-error').hide()
    
    var data = generateInput();

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
}

PAGES.addCallback('submit', function() {
    submitData()
})

// Socket.io
//
var socket = io();
socket.on('hello', function() {
  socket.emit('hi', uuid);
});

socket.on('nickname', function(nick) {
    if (!nick) return
    $('#pseudo-input').val(nick)
    $('#pseudo-input').attr('disabled', 'disabled')    
})

socket.on('error', function(req, err) {
    console.error('== AI error:', req, err)
    $('.part').hide()
    $('#avatar-error').show()
    $('#avatar-error-retry').unbind('click').click(function() {
        $('#avatar-error').hide()
        socket.emit('retry', req.uuid);
    })
})

socket.on('done', function(req) {
    console.log('done', req)
    /*
    $('.part').hide()
    $('#done').show()
    $('<img>').attr('src', req.output).appendTo('#done')
    */
    showImage(req.output)
    // $('<div class="request">').html(JSON.stringify(req)).appendTo('#done')
})

socket.on('reload', function() {
    location.reload()
})