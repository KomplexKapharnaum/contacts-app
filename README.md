# contacts-app

# Notes sur l'application
## PWA Manifest 
- peut être un .json ou un .webmanifest
- Si un seul icone, le mettre au format 512x512

# Etat des lieux (7 juin 2024)

## Onboarding
- [X] Inscription
- [X] Authentification
- [X] Avatar questions
- [ ] Chromium error : shader crashes when media queries are initialized
- [X] Get avatars from API
- [ ] Updating avatar generation status requires a page refresh, needs to be done with a websocket as well
- [X] Display avatars and select one
- [X] Updating user selected avatar parameter

## Sub-Pages
- [ ] Notifications : can be displayed, but not yet implemented
- [X] Avatar : showing current avatar
- [X] Avatar : updating selected avatar
- [ ] Avatar : Change username
- [ ] Avatar : Remove account
- [ ] Avatar : Reset avatar (redo the onboarding)
- [X] Share : QR code generation
- [ ] Share : No links to share yet

## Events
- [X] Subscribing to incoming events
- [X] Display incoming event with countdown
- [X] Idle page if no session is coming
- [ ] Triggering an event needs a page refresh, needs to be done with a websocket as well
- [X] Admins can send userEvents to users : flashlight, screen color, text
- [ ] "Je suis parti de l'évènement" button system is not yet implemented

## Admin page
- [X] Admin login password
- [X] General logs

### Sessions
- [X] Listing all sessions
- [ ] Tracking session status (incoming, active, finished)
- [X] Creating a new session
- [ ] Editing a session
- [ ] Deleting a session
- [ ] Listing users from this session

### Events
- [ ] Listing events for a session
- [ ] Creating an event for a session
- [ ] Editing an event for a session
- [ ] Deleting an event for a session
- [ ] Listing users from this event