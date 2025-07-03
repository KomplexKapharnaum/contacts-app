
# CONTACTS

## Introduction

Ce serveur est utilisé pendant le carnaval CONTACTS organisé par Komplex Kapharnaüm (kxkm.net). L'application est accessible à tous les participants et permet de :

- Créer un compte
- Discuter dans une messagerie instantanée
- Accéder et voir les prochains rendez-vous pirates (warmups et carnaval)
- Rejoindre une tribu
- Créer un cri de tribu
- Ecouter le cri de tribu des autres membres
- Créer un avatar
- Gagner des trophées
- Participer pendant le carnaval au travers de l'app

## Installation
Pour lancer le serveur, faites `npm i` pour installer les dépendances et ensuite `node server` pour lancer le serveur. 

## Chemins (port 4000)
- Application : `/app`
- Panneau d'administration : `/admin`
- Régie avancée : `/regie`
- Régie simplifiée : `/regiekxkm?regiekxkm?tribe={ID_TRIBU}` ou `/regiekxkm?filter={FILTRE}`

**Note:** les pages d'administration (admin & régie) demandent un mot de passe pour y accéder, celui par défaut est `admin` mais il est possible de le changer dans le `.env`

## Panneau d'administration

Cette page permet de gérer de nombreuses fonctionnalités de l'application.

- Gérer les notifications (texte, couleur de la notification, ajouter à la messagerie)
- Gérer les fonctionnalités (cocher une fonctionnalité la rendra accessible à tous les utilisateurs)
- Gérer les évènements
- Voir les messages du chat
- Voir les statistiques de l'application
- Réinitialiser l'application

### Créer un évènement

Allez dans l'onglet "évènements", puis remplissez les paramètres respectivement : 

- Start date : Jour et heure à laquelle commence l'évènement
- Location coordinates : Latitude et longitude (lat, lon) de la location. Utilisez www.openstreetmap.org pour récupérer ces coordonnées.
- Location name : nom du lieu de rendez-vous.
- Event name : nom de l'évènement
- Onglet avec "Everyone" écrit : Sélectionnez une autre option pour rendre l'évènement seulement visible par une seule tribu. Si vous voulez que tout le monde puisse voir l'évènement, laissez "Everyone"
- Priority : Si cette option est cochée, lorsque l'évènement est en cours, toute commande envoyée à l'utilisateur sera affichée, même si celui-ci n'a pas cliqué sur l'évènement.

### Créer une notification

Allez dans l'onglet "notifications", puis remplissez les paramètres respectivement : 

 - Preset : permet de remplir un texte pré-défini par l'application (à utiliser quand les textes seront confirmés)
 - Enter text : Corps de la notification, rentrez le texte ici
 - Onglet avec "Cyberspace" : couleur de la notification, uniquement utilisé dans l'espace "notifications" de l'application ou la couleur change en fonction de ce paramètre
 - Add to chat : Rajouter le texte de la notification dans la messagerie instantanée (utilisé pour les récits)

### Chat
L'onglet chat permet de voir tous les messages récemment envoyés dans la messagerie instantanée. Vous pouvez aussi supprimer des messages en cliquant dessus.

## Régie avancée

Cette page, conçue pour être utilisée sur portable, permet d'envoyer des médias sur les téléphones des participants pendant les évènements. Elle est la régie qui permettra de créer une commande sur-mesure, mais aussi de pouvoir en enregistrer pour être utilisée dans les régies simplifiées. Une commande est une instruction envoyée aux portables d'une tribu ou tout le monde, contenant un `type` et des `paramètres`. Voici la liste des types de commandes possible : 

- Couleur : Affiche une ou des couleurs
- Texte : Affiche un texte (court) sur l'intégralité de l'écran
- Image : Affiche une image en grand
- Vidéo : Permet, en fonction du média spécifié, de jouer une vidéo ou un son
- Questions : Lance un questionnaire sur le portable des utilisateurs
- Live upload : Ouvre le formulaire d'envoi de médias (utilisé pour la partie "feed instagram" du carnaval)
- Tribe cry : Joue une série de cri de tribus généré par les utilisateurs

Chaque commande a des paramètres spécifiques à eux, permettant davantage de flexibilité en terme de comportement.
Pour envoyer une commande à une tribu en particulier, il faut la sélectionner dans le volet déroulant tout en haut de la page (remettre à `everyone` si vous voulez envoyer à tout le monde).
*Enregistrer une commande prendra en compte le type de commande, ses paramètres et la tribu sélectionnée.*

## Régie simplifiée 
Cette page est utilisée pendant le carnaval, permettant un panneau d'actions préalablement défini et simple d'accès. Les commandes affichées sont défini par les paramètres déterminés dans l'url . Respectivement, voici les url à utiliser pour accéder aux régies spécifiques aux tribus : 

- Machines : `/regiekxkm/?tribe=1`
- Animaux : `/regiekxkm/?tribe=2`
- Végétaux : `/regiekxkm/?tribe=3`

Pour la régie simplifiée utilisée pour le reste du carnaval, l'url est `/regiekxkm/?filter=carnaval`.
*Le paramètre `filter` récupère les commandes qui contiennent le filtre défini (ici `carnaval`) dans leur nom.*