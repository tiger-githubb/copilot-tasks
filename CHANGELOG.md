# Changelog

All notable changes to the Copilot Tasks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-06-08 - Enterprise Ready 🚀

### Added

#### Enterprise Features

- **Advanced Metrics Collection**: Comprehensive productivity analytics system
- **Show Productivity Metrics** command: Real-time dashboard with productivity scores
- **Metrics Export**: JSON export capability for enterprise reporting
- **Session Tracking**: Automatic user engagement and duration monitoring
- **Copilot Usage Analytics**: Track AI interaction patterns for ROI measurement

#### Legal & Business

- **Apache 2.0 License**: Upgraded from MIT for enterprise compatibility
- **Enterprise Strategy Documentation**: Complete acquisition readiness framework
- **Productivity Scoring Algorithm**: Weighted metrics for task completion and AI usage

#### Developer Experience

- **Enhanced README**: Enterprise value proposition and strategic roadmap
- **Metrics Integration**: Automatic tracking in all user actions
- **Performance Optimizations**: Improved scalability for team usage

### Changed

- License upgraded from MIT to Apache 2.0
- README restructured with enterprise focus
- Package metadata updated for marketplace positioning

### Technical

- New `MetricsCollector` class with persistent storage
- Integrated tracking in task creation, completion, and Copilot interactions
- Added productivity scoring and analytics dashboard

## [0.0.1] - 2024-12-XX

### Added

#### V1.0 - Core Features

- Markdown-based task management with checkbox syntax
- Automatic `todo.md` file creation at workspace root
- Real-time synchronization between editor and sidebar
- Category support using markdown headers
- Sidebar TreeView with task organization
- Visual indicators for completed/pending tasks
- Click-to-toggle task completion
- Command palette integration for all actions
- Task statistics and progress tracking
- Force synchronization capabilities
- Flexible grouping modes (categorized vs flat)

#### V1.1 - Copilot Integration

- **Complete with Copilot** command - positions cursor in `todo.md` with context for Copilot suggestions
- **Insert Copilot Suggestion** command - generates structured prompts for task planning
- Smart suggestion types:
  - Break down tasks into smaller steps
  - Identify key requirements
  - Create completion checklists
  - Analyze challenges and solutions
  - Estimate time and resources
- Integration with VS Code's language model tools (`language-model-tools` tag)
- Enhanced sidebar with Copilot action buttons
- Seamless workflow with GitHub Copilot

### Technical

- TypeScript implementation with full type safety
- Robust file system watching and synchronization
- Singleton pattern for task and sync managers
- Event-driven architecture for real-time updates
- Comprehensive error handling and user feedback
- ESLint configuration for code quality
- Extensible command and menu system

### UI/UX

- Intuitive sidebar panel in Explorer view
- Context menus for task actions
- Visual progress indicators
- Category-based task organization
- Responsive command palette integration
- Clear user feedback messages

## Commands Added

- `Copilot Tasks: Open Todo File` - Open/create todo.md file
- `Copilot Tasks: Add New Task` - Add new task with optional category
- `Copilot Tasks: Toggle Task Completion` - Mark tasks as done/undone
- `Copilot Tasks: Complete with Copilot` - Position cursor for Copilot completion
- `Copilot Tasks: Insert Copilot Suggestion` - Generate structured planning prompts
- `Copilot Tasks: Show Task Statistics` - Display progress overview
- `Copilot Tasks: Refresh Tasks` - Reload tasks from file
- `Copilot Tasks: Toggle Grouping` - Switch between view modes
- `Copilot Tasks: Force Synchronization` - Manual sync
- `Copilot Tasks: Show Sync Status` - Display synchronization status
