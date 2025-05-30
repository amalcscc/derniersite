# Système de Gestion - Cabinet de Diététique

Un système de gestion complet pour cabinet de diététique avec trois rôles : administrateur, réceptionniste et diététicien.

## Fonctionnalités

### Rôle Administrateur
- Gestion des utilisateurs (ajout, modification, suspension)
- Gestion des patients (ajout, modification, archivage)
- Statistiques globales
- Accès à la liste complète des patients

### Rôle Réceptionniste
- Gestion des patients (recherche, ajout, modification)
- Gestion des rendez-vous
  - Calendrier interactif
  - Sélection des créneaux horaires
  - Gestion des rendez-vous (ajout, modification, annulation)
  - Vue des rendez-vous du jour
  - Validation des rendez-vous

### Rôle Diététicien
- Gestion des patients (recherche, ajout, modification, archivage)
- Gestion des rendez-vous
  - Calendrier interactif
  - Prise de rendez-vous
  - Validation des rendez-vous
- Gestion des consultations
  - Interface de consultation
  - Historique des consultations
  - Statistiques
  - Catalogue alimentaire

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd [NOM_DU_DOSSIER]
```

2. Installez les dépendances :
```bash
npm install
```

3. Démarrez le serveur :
```bash
npm start
```

L'application sera accessible à l'adresse : http://localhost:3000

## Structure du Projet

```
.
├── public/
│   ├── index.html          # Page d'accueil
│   ├── login.html          # Page de connexion
│   ├── admin.html          # Interface administrateur
│   ├── reception.html      # Interface réceptionniste
│   ├── dietician.html      # Interface diététicien
│   ├── styles.css          # Styles globaux
│   ├── script.js           # Scripts communs
│   ├── admin.js            # Scripts admin
│   ├── reception.js        # Scripts réception
│   └── dietician.js        # Scripts diététicien
├── server.js               # Serveur Express
├── database.db            # Base de données SQLite
├── sessions.db            # Base de données des sessions
├── package.json
└── README.md
```

## Utilisation

### Comptes de test
- Admin : username: `admin`, password: `admin123`
- Réception : username: `reception`, password: `reception123`
- Diététicien : username: `dieteticien`, password: `diet123`

### Fonctionnalités principales

1. **Gestion des Patients**
   - Recherche de patients
   - Ajout de nouveaux patients
   - Modification des informations
   - Archivage (admin et diététicien)

2. **Gestion des Rendez-vous**
   - Calendrier interactif
   - Sélection des créneaux horaires
   - Gestion des rendez-vous
   - Validation des rendez-vous

3. **Consultations (Diététicien)**
   - Interface de consultation
   - Calcul automatique de l'IMC
   - Historique des consultations
   - Statistiques

## Base de Données

L'application utilise SQLite comme base de données. Les tables suivantes sont créées automatiquement :

- `users` : Informations des utilisateurs
- `patients` : Informations des patients
- `appointments` : Rendez-vous
- `consultations` : Consultations

## Développement

Pour le développement, utilisez :
```bash
npm run dev
```

Cela démarrera le serveur avec nodemon pour le rechargement automatique.
