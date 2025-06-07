function log(msg) {
    document.getElementById("logs").innerHTML = msg
}

const COOKIES = {
    get: function(name) {
        const nameEQ = name + "="
        const ca = document.cookie.split(';')
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null
    },
    set: function(name,value,days=3650) {
        const date = new Date()
        date.setTime(date.getTime()+(days*24*60*60*1000))
        expires = "; expires="+date.toGMTString()
        document.cookie = name+"="+value+expires+"; path=/"
        console.log("CONFIG: set", name, value)
    },
    remove: function(name) {
        document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        console.log("CONFIG: removed", name)
    }
}

if (!COOKIES.get('pass')) {
    pass = prompt("Password", "")
    COOKIES.set('pass', pass, { expires: 10 })
}
var password = COOKIES.get('pass')

const socket = io()
socket.connected = false;

socket.on('connect', function () {
    console.log('SOCKETIO: Connected to server');
    socket.connected = 1;
});
socket.on('disconnect', function () {
    console.log('SOCKETIO: Disconnected from server');
    socket.connected = 0;
});

socket.on('hello', () => {
    log("Connexion established with server");
    socket.emit('admin-auth', password);
})

function ctrl(name, args = {params:{}}) {

    var resid = Math.random().toString(36).substring(2)

    if (!args.params) args.params = {}

    socket.emit('ctrl', {
        name: name,
        args: args?args:{},
        resid: resid
    })

    socket.once('event-ok-' + resid, (data) => { 
        log(data)
    })
}

async function query(name, params={}) {
    params.pass = COOKIES.get('pass')
    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`/query?queryname=${name}&${queryString}`)
    const res = await response.json()
    return {
        status: response.status===200,
        data: res
    }
}

function getTribeName() {
    query("tribelist").then((res) => {
        if (!res.status) return
        const data = res.data
        const urlParams = new URLSearchParams(window.location.search)
        const tribe = urlParams.get('tribe')
        const tribeName = data[tribe-1].name
        document.getElementById('tribe-name').innerHTML = tribeName
    })
}

getTribeName();

function getEvents() {
    query("r_get_presets").then((res) => {
        if (!res.status) return
        const data = res.data
        
        const urlParams = new URLSearchParams(window.location.search)
        const tribe = urlParams.get('tribe')
        if (tribe) {
            const commands = data.reduce((acc, elem) => {
                const json = JSON.parse(elem.data)
                const tribeID = json.args.params.tribe
                if (parseInt(tribeID)==parseInt(tribe)) acc.push({name: elem.name, json: json})
                return acc
            }, [])

            for (const cmd in commands) {
                const btn = document.createElement("button")
                btn.innerHTML = commands[cmd].name.replace(/_/g, ' ').replace(/-/g, ' ')
                btn.style.setProperty("--color", "white")
                btn.addEventListener("click", () => {
                    ctrl(commands[cmd].json.name, commands[cmd].json.args)
                })
                document.getElementById('commands').appendChild(btn)           
            }
        }

        const filter = urlParams.get("filter");
        if (filter) {
            const commands = data.filter(elem => elem.name.includes(filter))
            for (const cmd in commands) {
                const btn = document.createElement("button")
                btn.innerHTML = commands[cmd].name.replace(/_/g, ' ').replace(/-/g, ' ').replace(filter, '')
                btn.style.setProperty("--color", "white")
                btn.addEventListener("click", () => {
                    ctrl(commands[cmd].name)
                })
                document.getElementById('commands').appendChild(btn)           
            }
        }
    })
}

getEvents();