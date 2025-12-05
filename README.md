# SuperCleaner

### *Réinventez votre façon de naviguer — par l’équipe Super Tounsi (ISITCOM)*

SuperCleaner est une extension Chrome qui permet à l’utilisateur de **nettoyer et personnaliser ses sites web préférés**, en masquant définitivement les éléments indésirables : pubs, pop-ups, images, vidéos ou blocs encombrants.
Simple, rapide et entièrement sous votre contrôle.

Développé pour le **Défi Platon Formation – Nuit de l’Info** :

> *“Nettoyez le web comme VOUS l’entendez !”*

---

## ✨ Table des Matières

* [Objectif](#-objectif)
* [Fonctionnalités](#-fonctionnalités-clés)
* [Modes Intelligents](#-modes-intelligents)
* [Architecture & Technologies](#-architecture--technologies)
* [Installation](#-installation)
* [Utilisation](#-utilisation)
* [Structure du Projet](#-structure-du-projet)
* [Équipe](#-équipe)
* [Licence](#-licence)

---

## 🎯 Objectif

Permettre à chaque utilisateur de **réorganiser le web selon ses besoins** :

* Masquer visuellement les éléments gênants
* Stocker les choix par site pour un nettoyage automatique
* Gérer facilement les règles via un panneau de contrôle

---

## ✨ Fonctionnalités clés

* **Mode Édition** : sélection intuitive et masquage d’éléments
* **Nettoyage Persistant** : chaque choix est sauvegardé par domaine
* **Modes Intelligents** : Adulte, Éducation, suppression images/ liens/ icônes/ vidéos
* **Panneau de gestion** : reset site, reset global, pause temporaire
* **Interface moderne et fluide**, intuitive

---

## 🧠 Modes Intelligents

| Mode                            | Description                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| **Mode Adulte**                 | Cache les contenus sensibles/explicites                      |
| **Mode Éducation**              | Allège la page pour faciliter la lecture et la concentration |
| **Supprimer toutes les images** | Retire toutes les images (HTML, backgrounds, lazy-loaded)    |
| **Supprimer tous les liens**    | Désactive et masque tous les liens cliquables                |
| **Supprimer toutes les icônes** | Retire pictogrammes, SVG, emojis, logos                      |
| **Supprimer toutes les vidéos** | Cache les lecteurs, iframes et vidéos embarquées             |

Ces modes sont construits sur des **algorithmes robustes**, sans IA.

---

## 🏗 Architecture & Technologies

* JavaScript Vanilla, HTML & CSS
* Chrome Extensions Manifest V3
* DOM API et MutationObserver
* Modules : sélection, masquage, modes, popup, stockage

---

## ⚙ Installation

```bash
git clone https://github.com/Hallous-Yassine/super-cleaner-extension.git
cd super-cleaner-extension
```

1. Ouvrir Chrome
2. Aller à `chrome://extensions/`
3. Activer **Mode développeur**
4. Cliquer sur **Load unpacked**
5. Sélectionner le dossier du projet

---

## 🚀 Utilisation

1. Cliquez sur l’icône **SuperCleaner**
2. Activez **Mode Édition**
3. Survolez la page → un contour apparaît
4. Cliquez pour masquer l’élément
5. Rechargez la page → le masquage est permanent
6. Ouvrez la popup pour :

   * activer des modes
   * réinitialiser un site ou tout
   * désactiver temporairement
   * voir toutes vos règles stockées

---

## 📂 Structure du Projet

```bash
SuperCleaner/
│
├── content/
│   ├── selector.js           # Sélection et highlight
│   ├── highlighter.js        # Feedback visuel
│   ├── hider.js              # Moteur de masquage
│   ├── enlarger.js           # (Bonus) Agrandissement des blocs
│   ├── presetRules.js        # Modes intelligents
│   ├── adBlocker.js          # (Optionnel) blocage pub
│   └── content.css
│
├── popup/
│   ├── popup.html
│   ├── popup.js              # UI complète
│   └── popup.css
│
├── background/
│   └── background.js         # Service Worker
│
├── storage/
│   └── storageManager.js
│
├── utils/
│   ├── domPath.js            # Générateur de sélecteurs CSS fiables
│   ├── logger.js
│   └── messaging.js
│
└── manifest.json
```

---

## 👥 Équipe — **Super Tounsi (ISITCOM)**

Équipe tunisienne motivée et créative, fière de représenter l’ISITCOM et de proposer un web plus propre et personnalisable.

---

## 📄 Licence

MIT — libre d’utilisation, modification et distribution.

