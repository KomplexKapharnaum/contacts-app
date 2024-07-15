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
    constructor(session, button) {
        const dom = docId('model-session-page').cloneNode(true).content;

        dom.querySelector('.title').innerHTML = session.name;

        this.logsContainer = dom.querySelector('.logs');
        this.evenementsContainer = dom.querySelector('.evenements');

        this.dom = dom.firstElementChild;

        this.editform = this.dom.querySelector('.form-edit');

        let editName = this.editform.querySelector('input[name="title"]');
        let editStart = this.editform.querySelector('input[name="start-date"]');
        let editEnd = this.editform.querySelector('input[name="end-date"]');

        editName.value = session.name;
        editStart.value = session.starting_at.split('T')[0];
        editEnd.value = session.ending_at.split('T')[0];

        this.editform.querySelector('button').addEventListener('click', () => {

            query("Session.update", [session.id, {
                name: editName.value,
                starting_at: editStart.value,
                ending_at: editEnd.value
            }]).then(() => {
                this.dom.classList.remove('active');
                updateSessions();
            });
        });

        button.addEventListener('click', () => {
            this.dom.classList.add('active');
            this.listEvents(session.events)
        });

        dom.querySelector('.close').addEventListener('click', () => {
            this.dom.classList.remove('active');
        });

        dom.querySelector(".remove-session").addEventListener('click', () => {
            query("Session.delete", session.id).then(() => {
                this.dom.remove();
                updateSessions();
            });
        });

        document.querySelector("#session-pages").appendChild(this.dom);
    }

    listEvents(events) {
        let container = this.dom.querySelector('.evenements');
        container.innerHTML = "";
        events.forEach(event => {
            new models.Evenement(event.name, event.starting_at.split("T")[0], `${event.starting_at.split("T")[1]} - ${event.ending_at.split("T")[1]}`, event.location, container);
        });
        // models.Evenement
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