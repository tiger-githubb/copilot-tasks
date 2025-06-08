# Copilot Tasks

A Markdown-based task manager integrated into VS Code, designed to work seamlessly with GitHub Copilot. Organize your tasks in a `todo.md` file, enjoy an intuitive sidebar interface, and leverage the power of Copilot to help write or improve your tasks.

## Features

### ✅ Core Task Management

- **Markdown-based tasks**: Uses standard checkbox syntax (`- [ ]` and `- [x]`)
- **Automatic file creation**: Creates `todo.md` at your workspace root if it doesn't exist
- **Category support**: Organize tasks under headers (## Category Name)
- **Real-time synchronization**: Changes in the editor automatically reflect in the sidebar and vice versa

### 🌲 Sidebar Interface

- **TreeView display**: View all tasks in a dedicated sidebar panel
- **Category grouping**: Tasks are automatically grouped by their markdown headers
- **Visual indicators**: Different icons for completed (✅) and pending (⏳) tasks
- **Click to toggle**: Click any task in the sidebar to mark it as complete/incomplete
- **Flexible grouping**: Toggle between categorized and flat list views

### 🤖 Copilot Integration (V1.1)

- **Complete with Copilot**: Position cursor in `todo.md` with context for Copilot suggestions
- **Insert Copilot Suggestions**: Generate structured prompts for task breakdowns and planning
- **Smart prompts**: Choose from predefined suggestion types (breakdowns, requirements, checklists, etc.)
- **Seamless workflow**: Direct integration with VS Code's Copilot features

### ⚡ Commands & Actions

- **Open Todo File**: Quickly access your `todo.md` file
- **Add New Task**: Add tasks via command palette with optional categories
- **Toggle Task Completion**: Mark tasks as done/undone from command palette or sidebar
- **Task Statistics**: View progress overview (total, completed, remaining, percentage)
- **Force Sync**: Manually synchronize editor and UI if needed
- **Refresh Tasks**: Reload tasks from file

## Getting Started

1. **Install the extension** (when available on marketplace)
2. **Open a workspace** in VS Code
3. **Run command**: `Copilot Tasks: Open Todo File` from the command palette (`Ctrl+Shift+P`)
4. **Start adding tasks** using the sidebar or by editing the `todo.md` file directly

## Usage

### Adding Tasks

#### Method 1: Command Palette

1. Press `Ctrl+Shift+P` to open command palette
2. Type "Copilot Tasks: Add New Task"
3. Enter your task text
4. Optionally select a category

#### Method 2: Direct Editing

Edit your `todo.md` file directly:

```markdown
# Todo List

## Work Tasks

- [ ] Review pull request #123
- [ ] Update documentation
- [x] Fix bug in authentication

## Personal

- [ ] Buy groceries
- [ ] Call dentist
```

### Managing Tasks

- **Toggle completion**: Click tasks in the sidebar or use the command palette
- **View progress**: Use "Show Task Statistics" command
- **Organize**: Add markdown headers to create categories
- **Sync**: The extension automatically keeps everything in sync

### 🤖 Using Copilot Features

#### Complete with Copilot

1. Select a pending task from the sidebar or command palette
2. Run "Complete with Copilot" command
3. The extension opens `todo.md` and positions your cursor with context
4. Use Copilot's suggestions to add implementation details

#### Insert Copilot Suggestions

1. Select a task you want to break down or plan
2. Run "Insert Copilot Suggestion" command
3. Choose from suggestion types:
   - Break down into smaller steps
   - Identify key requirements
   - Create completion checklist
   - Analyze challenges and solutions
   - Estimate time and resources
4. A structured prompt is inserted for Copilot to complete

### Sidebar Features

The **Copilot Tasks** panel in the Explorer sidebar provides:

- **Real-time task list**: See all your tasks at a glance
- **Category organization**: Tasks grouped under their headers
- **Quick actions**: Click to toggle, right-click for context menu
- **Visual progress**: Different icons for completed vs pending tasks

## File Format

Your `todo.md` file uses standard Markdown syntax:

```markdown
# Todo List

Welcome to your task manager! Use checkboxes to track your progress.

## Tasks

- [ ] Incomplete task
- [x] Completed task

## Ideas

- [ ] Another task in different category
```

## Commands

| Command                                    | Description                                   |
| ------------------------------------------ | --------------------------------------------- |
| `Copilot Tasks: Open Todo File`            | Open/create the todo.md file                  |
| `Copilot Tasks: Add New Task`              | Add a new task with optional category         |
| `Copilot Tasks: Toggle Task Completion`    | Mark task as done/undone                      |
| `Copilot Tasks: Complete with Copilot`     | Position cursor for Copilot task completion   |
| `Copilot Tasks: Insert Copilot Suggestion` | Generate structured prompts for task planning |
| `Copilot Tasks: Show Task Statistics`      | Display progress overview                     |
| `Copilot Tasks: Refresh Tasks`             | Reload tasks from file                        |
| `Copilot Tasks: Toggle Grouping`           | Switch between categorized/flat view          |
| `Copilot Tasks: Force Synchronization`     | Manually sync editor and UI                   |

## Roadmap

### V1.1 – Copilot Integration ✅ COMPLETE

- [x] Copilot-powered task completion positioning
- [x] Smart task suggestion generation
- [x] Integration with VS Code's language model tools
- [x] Structured prompts for task planning

### V2 – Advanced Features

- Drag & drop task reordering
- Multiple todo files support
- Task search and filtering
- Priority levels and custom tags

### V3 – Integrations

- GitHub Issues synchronization
- Team collaboration features
- Task analytics and reporting

## Contributing

This project is in active development. Contributions, feedback, and suggestions are welcome!

## License

[MIT License](LICENSE)

---

_Built with ❤️ for VS Code and GitHub Copilot users_
