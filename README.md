# Application Mobile HSV

![GitHub contributors](https://img.shields.io/badge/contributors-3-blue)
![GitHub last commit](https://img.shields.io/badge/last%20commit-may%202025-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

L'application mobile HSV simplifie la gestion des rendez-vous médicaux pour l'Hôpital HSV. Elle est conçue pour offrir une expérience fluide aux patients et faciliter le suivi des rendez-vous médicaux par les praticiens.

## 🛠️ Technologies utilisées

* ![React Native](https://img.shields.io/badge/-React%20Native-blue?logo=react)
* ![Expo](https://img.shields.io/badge/-Expo-black?logo=expo)
* ![Node.js](https://img.shields.io/badge/-Node.js-green?logo=node.js)
* ![Express.js](https://img.shields.io/badge/-Express.js-black?logo=express)
* ![Supabase](https://img.shields.io/badge/-Supabase-green?logo=supabase)

## ✅ Fonctionnalités

### Actuelles

* **Prise de rendez-vous rapide** : sélection de spécialité, date, informations patient.
* **Suivi clair des rendez-vous** : affichage confirmé du nom du praticien et de l'horaire.

### À venir

* **Améliorations UI/UX** : optimisation continue pour une expérience utilisateur optimale.
* **Bugs** : résolution des bugs. Si vous en trouvez n'hésitez pas à soumettre une Issue sur le dépôt GitHub.

## 📁 Structure du projet

```bash
HSV
├── backend/           # API Express (Node.js)
├── frontend/          # Application Expo/React Native
├── supabase/          # Structure de la base de données
├── docs/              # Documentation et ressources graphiques
└── Cahier des charges.pdf  # Spécifications du projet
```

## 🚀 Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

### Base de données

Importez le fichier `schema.sql` depuis le dossier `supabase/` dans votre instance Supabase.

Créez un fichier `.env` dans le dossier `backend/` avec les variables de .env.example.

## 📝 Remarques

Si vous ouvrir l'application sur mobile (avec expo go), vous devez modifier le fichier frontent/config/config.ts pour utiliser l'adresse IP de votre machine.

```tsx
 const dev: EnvironmentConfig = {
    API_URL: 'http://localhost:3000',
  };
```

*Remplacez localhost par l'adresse IP de votre machine*

## 🤝 Équipe de développement

* Corentin Renard ([Aqu1tain](https://github.com/Aqu1tain))
* Justin Martineau ([Soronavirus](https://github.com/Soronavirus))
* Valentin Lamouche ([Scipio](https://github.com/Scipio))

## 📅 Livraison

**30 mai 2025**

---

📖 Plus d'informations détaillées dans le [Cahier des charges](Cahier%20des%20charges.pdf).
