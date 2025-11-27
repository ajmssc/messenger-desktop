# Messenger Desktop

A simple desktop app for Facebook Messenger built with Electron.

## Installation

Download the latest release for your platform from the [Releases](../../releases) page.

### macOS

1. Download the `.dmg` file for your architecture (arm64 for Apple Silicon, x64 for Intel)
2. Open the `.dmg` and drag Messenger to Applications
3. **Important:** The app is not code-signed. Before opening, run this command in Terminal:
   ```bash
   xattr -cr /Applications/Messenger.app
   ```
4. Open Messenger from Applications

### Windows

1. Download the `.exe` installer
2. Run the installer and follow the prompts

### Linux

1. Download either the `.AppImage` or `.deb` file
2. For AppImage: Make it executable (`chmod +x Messenger-*.AppImage`) and run it
3. For Debian/Ubuntu: Install with `sudo dpkg -i Messenger-*.deb`

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for your platform
npm run dist
```

## License

MIT
