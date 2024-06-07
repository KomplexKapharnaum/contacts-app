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

        this.dom = dom.firstElementChild;
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

class SessionPage {
    constructor(title, button) {
        const dom = docId('model-session-page').cloneNode(true).content;

        dom.querySelector('.title').innerHTML = title;

        this.logsContainer = dom.querySelector('.logs');
        this.evenementsContainer = dom.querySelector('.evenements');

        this.dom = dom.firstElementChild;

        button.addEventListener('click', () => {
            this.dom.classList.add('active');
        });

        dom.querySelector('.close').addEventListener('click', () => {
            this.dom.classList.remove('active');
        });

        document.querySelector("#session-pages").appendChild(this.dom);
    }

    addLog(log) {
        const logElement = document.createElement('div');
        logElement.innerText = log;
        this.logsContainer.appendChild(logElement);
    }

    addEvenement(evenement) {
        models.Evenement(evenement.title, evenement.date, evenement.hours, evenement.location, this.evenementsContainer);
    }
}
models.SessionPage = SessionPage;