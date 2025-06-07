# Changelog

All notable changes to the "Copilot Tasks" extension will be documented in this file.

## [Unreleased]

### Added

- Core task management with markdown checkbox syntax (`- [ ]` and `- [x]`)
- Automatic `todo.md` file creation at workspace root
- Real-time bidirectional synchronization between editor and UI
- TreeView sidebar with task visualization and interaction
- Category support through markdown headers
- Task statistics and progress tracking
- Command palette integration for all major operations
- File system watcher for automatic task reloading
- Debounced editor change detection to prevent recursive updates

### Improved

- **Build System**: Updated VS Code tasks configuration to use `pnpm` instead of `npm`
  - Added comprehensive task suite: compile, watch, lint, test, pretest, install, clean
  - Improved problem matchers for better error reporting
  - Added `rimraf` for reliable cross-platform file cleanup

### Features

- **Commands**:

  - `Copilot Tasks: Open Todo File` - Open/create todo.md
  - `Copilot Tasks: Add New Task` - Add tasks with optional categories
  - `Copilot Tasks: Toggle Task Completion` - Mark tasks as done/undone
  - `Copilot Tasks: Show Task Statistics` - View progress overview
  - `Copilot Tasks: Refresh Tasks` - Reload tasks from file
  - `Copilot Tasks: Toggle Grouping` - Switch between categorized/flat view
  - `Copilot Tasks: Force Synchronization` - Manual sync
  - `Copilot Tasks: Show Sync Status` - Display sync status

- **TreeView Sidebar**:

  - Category-based task grouping
  - Visual task completion indicators
  - Click-to-toggle task completion
  - Expandable/collapsible categories
  - Context menus for task actions

- **Synchronization**:
  - Real-time editor ↔ UI synchronization
  - File system watcher for external changes
  - Debounced updates to prevent conflicts
  - Status indicators for sync operations

### Technical Implementation

- TypeScript-based VS Code extension
- Singleton pattern for managers (TaskManager, SyncManager)
- Event-driven architecture for task change notifications
- Robust markdown parsing with category extraction
- Error handling and user feedback
- Resource cleanup on extension deactivation

## [1.0.1] - Bug Fixes & Improvements

### Fixed

- **🐛 Synchronisation circulaire**: Corrigé le problème où les nouvelles tâches n'étaient pas sauvegardées dans le fichier
  - Ajout du flag `isSaving` pour éviter les conflits de rechargement
  - Méthode `setTasksFromSync()` pour éviter les sauvegardes récursives
  - Logique améliorée du FileSystemWatcher

### Improved

- **✨ Sélection des catégories**: Interface QuickPick pour choisir les catégories existantes
  - Options: "Nouvelle catégorie", "Pas de catégorie", ou sélection des existantes
  - Icônes pour une meilleure expérience utilisateur
  - Détection automatique des catégories existantes

### Technical

- Nettoyage de la nomenclature des fichiers (kebab-case)
- Suppression des fichiers dupliqués en camelCase
- Amélioration de la gestion des erreurs de synchronisation
- Optimisation des timeouts pour la stabilité

## [1.0.0] - V1 MVP Complete

### Summary

- ✅ All V1 MVP features implemented
- ✅ Comprehensive documentation and README
- ✅ Full bidirectional synchronization
- ✅ TreeView sidebar interface
- ✅ 8 commands and complete task management
- 🎯 Ready for V1.1 Copilot integration features

### Next Phase

V1.1 will focus on Copilot integration:

- Copilot-powered task completion suggestions
- Smart task generation from code context
- Integration with VS Code's language model tools
