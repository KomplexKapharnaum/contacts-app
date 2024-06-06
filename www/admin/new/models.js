let models = {};

const docId=(id) => {return document.getElementById(id)};

class SessionModel {
    constructor(id, title, dates, subscribed_users, events_count, parent) {
        this.id = id;
        
        const dom = docId('model-session').cloneNode(true).content;
        dom.id = 'session-' + id;

        dom.querySelector('.title').innerText = title;
        dom.querySelector('.dates').innerText = dates;
        dom.querySelector('.subscribed-users').innerText = subscribed_users;
        dom.querySelector('.events-count').innerText = events_count;

        parent.appendChild(dom);
    }
}
models.Session = SessionModel;

class EvenementModel {
    constructor(title, date, hours, location, parent) {
        const dom = docId('model-evenement').cloneNode(true).content;
        
        dom.querySelector('.title').innerText = title;
        dom.querySelector('.date').innerText = date;
        dom.querySelector('.hours').innerText = hours;
        dom.querySelector('.location').innerText = location;

        parent.appendChild(dom);
    }
}
models.Evenement = EvenementModel;