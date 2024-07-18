let models = {};

const docId=(id) => {return document.getElementById(id)};

class SessionCard {
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
models.SessionCard = SessionCard;

class EvenementCard {
    constructor(sessionID, evenement, parent) {
        console.log(evenement)
        const [title, date, hours, location] = [evenement.name, evenement.starting_at.split("T")[0], `${evenement.starting_at.split("T")[1]} - ${evenement.ending_at.split("T")[1]}`, evenement.location]
        const dom = docId('model-evenement').cloneNode(true).content;
        
        dom.querySelector('.title').innerText = title;
        dom.querySelector('.date').innerText = date;
        
        const [start, end] = [evenement.starting_at.split("T")[1], evenement.ending_at.split("T")[1]];
        dom.querySelector('.hours').innerText = `${start} - ${end}`;

        dom.querySelector('.location').innerText = location;

        this.button = dom.querySelector(".model-evenement");

        parent.appendChild(dom);
    }
}
models.EvenementCard = EvenementCard;

class SessionPage {
    constructor(session, button) {
        const dom = docId('model-session-page').cloneNode(true).content;

        dom.querySelector('.title').innerHTML = session.name;

        this.session = session;
        this.logsContainer = dom.querySelector('.logs');
        this.evenementsContainer = dom.querySelector('.evenements');
        this.msgCard = dom.querySelector('.msg');

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
            if (!confirm("Are you sure you want to delete this session?")) return;
            query("Session.delete", session.id).then(() => {
                this.dom.remove();
                this.listEvents(session.events)
            });
        });

        this.eventPagesContainer = dom.querySelector('.evenements-pages');

        new AddEventModal(dom.querySelector(".session-add-event"), session.id);

        document.querySelector("#session-pages").appendChild(this.dom);
    }

    listEvents(events) {
        let container = this.dom.querySelector('.evenements');
        container.innerHTML = "";
        events.forEach(event => {

            const eventCard = new models.EvenementCard(this.session.id, event, container);
            const page = new models.EvenementPage(event, eventCard.button, this.eventPagesContainer);

            eventCard.button.addEventListener('click', () => {
                page.dom.classList.toggle('active');
            });

        });
        // models.EvenementCard
    }

    addLog(log) {
        const logElement = document.createElement('div');
        logElement.innerText = log;
        this.logsContainer.appendChild(logElement);
    }

    addMsgbox(msg) {
        const msgCard = document.createElement('div');
        msgCard.innerText = msg;
        this.msgCard.appendChild(msgCard);
    }

    addEvenement(evenement) {
        models.EvenementCard(this.session.id, evenement, this.evenementsContainer);
    }
}
models.SessionPage = SessionPage;

class EvenementPage {
    constructor(evenement, button, parent) {
        console.log(evenement)
        const dom = docId('template-page-evenement').cloneNode(true).content;

        dom.querySelector('.title').innerHTML = evenement.name;

        this.evenement = evenement;
        this.logsContainer = dom.querySelector('.logs');

        this.dom = dom.firstElementChild;

        this.editform = this.dom.querySelector('.form-edit');

        let editName = this.editform.querySelector('input[name="title"]');
        let editStart = this.editform.querySelector('input[name="start-date"]');
        let editEnd = this.editform.querySelector('input[name="end-date"]');

        editName.value = evenement.name;
        editStart.value = evenement.starting_at;
        editEnd.value = evenement.ending_at;

        this.editform.querySelector('button').addEventListener('click', () => {

            query("Event.update", [evenement.id, {
                name: editName.value,
                starting_at: editStart.value,
                ending_at: editEnd.value
            }]).then(() => {
                this.dom.classList.remove('active');
                location.reload();
            });

        });

        dom.querySelector('.close').addEventListener('click', () => {
            this.dom.classList.remove('active');
        });

        dom.querySelector(".remove-evenement").addEventListener('click', () => {
            if (!confirm("Are you sure you want to delete this event?")) return;
            query("Event.delete", evenement.id).then(() => {
                this.dom.remove();
                button.remove();
            });
        });

        parent.appendChild(this.dom);
    }

    addLog(log) {
        const logElement = document.createElement('div');
        logElement.innerText = log;
        this.logsContainer.appendChild(logElement);
    }
}
models.EvenementPage = EvenementPage;

class AddEventModal {
    constructor(button, sessionID) {
        
        this.sessionID = sessionID;
        this.id = 'modal-new-event-' + sessionID;

        const dom = docId('template-modal-addevent').cloneNode(true).content.querySelector(".modal-bg");
        // console.log(dom)
        dom.id = this.id;

        button.addEventListener('click', () => {
            openModal(this.id);
        });

        dom.querySelector('.new-event-submit').addEventListener('click', () => {            
            const title = dom.querySelector('.new-event-title').value;
            const start = dom.querySelector('.new-event-start').value;
            const end = dom.querySelector('.new-event-end').value;

            query("Event.new", { name: title, session_id: this.sessionID, starting_at: start, ending_at: end }).then(() => {
                closeModal(this.id);
                location.reload();
            })
        });

        // const bg = dom.querySelector(".modal-bg");
        dom.addEventListener("click", (event) => {
            if (event.target === dom) {
                closeModal(this.id);
            }
        });

        document.body.appendChild(dom);
    }
}
models.AddEventModal = AddEventModal;