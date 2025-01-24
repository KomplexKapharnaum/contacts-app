function formatDate(date) {
    let d = new Date(date),
        day = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]
        hour = d.getHours(),
        min = d.getMinutes()

    if (min < 10) min = '0' + min
    if (hour < 10) hour = '0' + hour

    return `${day} à ${hour}:${min}`
}

function parseCountDown(date, formatted=true) {
    const now = new Date().getTime()
    const countDownDate = new Date(date).getTime()
    let distance = countDownDate - now

    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    if (formatted) {
        return `${days}j ${hours}h ${minutes}m`
    } else {
        return {
            d: days,
            h: hours,
            m: minutes
        }
    }
}

function isEventLive(date) {
    const now = new Date().getTime()
    const eventDate = new Date(date).getTime()
    return eventDate - now < 0
}

function showNavbar(bool) {
    const navbar = document.querySelector('nav')
    if (bool) {
        navbar.classList.add('show')
    } else {
        navbar.classList.remove('show')
    }
}

function getAvatar() {
    return ''
}

function isUserNameValid(username) {
    if (username.length < 3) return [false, 'Le pseudo doit contenir au moins 3 caractères']
    if (username.length > 20) return [false, 'Le pseudo doit contenir moins de 20 caractères']
    if (username.match(/[^a-zA-Z0-9_-]/)) return [false, 'Le pseudo ne doit contenir que des lettres, des chiffres, des tirets et des underscores']

    return [true, '']
}

if (!document.COOKIES) {
    console.log("Setting up document.COOKIES with Browser Cookies")
    document.COOKIES = {
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
        set: function(name,value,days) {
            let expires = ""
            if (days) {
                const date = new Date()
                date.setTime(date.getTime()+(days*24*60*60*1000))
                expires = "; expires="+date.toGMTString()
            }
            document.cookie = name+"="+value+expires+"; path=/"
        },
        remove: function(name) {
            document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        }
    }
}
else console.log("document.COOKIES already set up by launcher (Using Cloud settings")