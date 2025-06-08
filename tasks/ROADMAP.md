# Roadmap – Copilot Tasks

## V1 – MVP (Minimum Viable Product) ✅ COMPLET

- [x] Générer le squelette de l'extension avec Yeoman (TypeScript, unbundled)
- [x] Créer une commande VS Code pour ouvrir/éditer un fichier `todo.md` à la racine du projet
- [x] Générer automatiquement le fichier `todo.md` s'il n'existe pas
- [x] Parser le fichier Markdown pour lire les tâches (checkboxes : `- [ ]` et `- [x]`)
- [x] Ajouter une commande pour ajouter une tâche depuis la palette de commandes
- [x] Ajouter une commande pour marquer une tâche comme faite / non faite
- [x] Synchronisation : modification dans l'éditeur → rafraîchissement en UI (et inversement)
- [x] Sidebar (TreeView) listant les tâches
- [x] Documentation de base et README

---

## V1.1 – Ergonomie & Copilot ✅ COMPLET

- [x] Bouton/commande "Compléter avec Copilot" (ouvre `todo.md` à la bonne ligne pour déclencher Copilot)
- [x] Commande pour insérer une suggestion Copilot à partir d'une tâche sélectionnée
- [x] Ajout du tag `@tag:language-model-tools` dans le `package.json`
- [x] Icône d'extension et visuels Marketplace

---

## V2 – Fonctionnalités avancées

- [ ] Ajout/Suppression/Édition de tâches directement depuis la sidebar (UI interactive)
- [ ] Drag & drop pour réordonner les tâches
- [ ] Prise en charge de plusieurs fichiers de tâches (par projet, par dossier)
- [ ] Recherche/filtrage de tâches
- [ ] Statut "prioritaire" ou étiquettes personnalisées sur les tâches

---

## V3 – Intégrations & Intelligence

- [ ] Synchronisation bidirectionnelle avec GitHub Issues (optionnelle)
- [ ] Suggestions automatiques de tâches via Copilot (proposer des tâches à partir du code)
- [ ] Intégration avec Copilot Chat (quand API disponible)
- [ ] Notifications/alertes de tâches importantes ou bloquées
- [ ] Export/Import des tâches

---

## Bonus / Idées futures

- [ ] Collaboration en temps réel sur les tâches (Live Share)
- [ ] Extension web (VS Code Online)
- [ ] Support multi-utilisateurs (pour les équipes)
- [ ] Statistiques d'avancement, graphiques, etc.

---

## Suivi & tests

- [ ] Suivi des bugs et suggestions via GitHub Issues
- [ ] Tests unitaires et d'intégration sur les modules principaux
- [ ] Beta test avec utilisateurs réels

---

**N'hésite pas à adapter les étapes en fonction de tes priorités !**
