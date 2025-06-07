# Development Guide

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [pnpm](https://pnpm.io/) (version 8 or higher)
- [VS Code](https://code.visualstudio.com/)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Available Scripts

The project uses `pnpm` for package management and build tasks. All scripts are defined in `package.json` and can be run via:

```bash
pnpm run <script-name>
```

### Build & Development Scripts

- **`pnpm run compile`** - Compile TypeScript to JavaScript (one-time build)
- **`pnpm run watch`** - Watch for changes and compile automatically (development mode)
- **`pnpm run clean`** - Remove compiled output directory (`out/`)

### Code Quality Scripts

- **`pnpm run lint`** - Run ESLint on source files
- **`pnpm run pretest`** - Run compilation and linting before tests

### Testing Scripts

- **`pnpm run test`** - Run the test suite with VS Code Test Runner

### Package Management

- **`pnpm install`** - Install all dependencies
- **`pnpm run vscode:prepublish`** - Prepare for publishing (used by VS Code)

## VS Code Tasks

The project includes pre-configured VS Code tasks in `.vscode/tasks.json`. You can run them via:

1. **Command Palette**: `Ctrl+Shift+P` → "Tasks: Run Task"
2. **Keyboard Shortcut**: `Ctrl+Shift+P` → Type task name

### Available Tasks

| Task      | Description                             | Shortcut                            |
| --------- | --------------------------------------- | ----------------------------------- |
| `watch`   | Start TypeScript compiler in watch mode | Default build task (`Ctrl+Shift+B`) |
| `compile` | One-time TypeScript compilation         |                                     |
| `lint`    | Run ESLint linter                       |                                     |
| `test`    | Run test suite                          |                                     |
| `pretest` | Compile + lint before testing           |                                     |
| `install` | Install dependencies                    |                                     |
| `clean`   | Clean build output                      |                                     |

## Development Workflow

1. **Start development mode**:

   ```bash
   pnpm run watch
   ```

   Or use VS Code: `Ctrl+Shift+B` → select "watch"

2. **Open Extension Host**: Press `F5` to launch a new VS Code window with the extension loaded

3. **Make changes**: Edit source files in `src/`

4. **Reload extension**: In the Extension Host window, press `Ctrl+R` (or `Cmd+R` on Mac)

## Testing

1. **Install Extension Test Runner**:

   - Install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner) extension

2. **Run tests**:

   ```bash
   pnpm run test
   ```

   Or use VS Code Test Explorer

3. **Watch mode for tests**: Ensure the "watch" task is running for automatic test discovery

## Project Structure

```
src/
├── extension.ts          # Main extension entry point
├── task-manager.ts       # Core task management logic
├── sync-manager.ts       # Editor ↔ UI synchronization
├── tree-view-provider.ts # Sidebar TreeView implementation
├── parser.ts             # Markdown parsing utilities
└── test/
    └── extension.test.ts # Test suite
```

## Code Style

- Use TypeScript with strict type checking
- Follow ESLint configuration for code style
- Use kebab-case for file names
- Use PascalCase for class names
- Use camelCase for variables and methods

## Debugging

1. Set breakpoints in VS Code
2. Press `F5` to start debugging
3. The Extension Host window will stop at breakpoints
4. Use the Debug Console for interactive debugging

## Build for Production

```bash
pnpm run vscode:prepublish
```

This will compile the extension and prepare it for packaging/publishing.
