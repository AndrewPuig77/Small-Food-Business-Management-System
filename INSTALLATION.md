# Installation Guide - Food Business Management System

## Table of Contents
1. [Quick Start for Developers](#quick-start-for-developers)
2. [Building Installers](#building-installers)
3. [End User Installation](#end-user-installation)
4. [Custom Branding](#custom-branding)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start for Developers

### Prerequisites
- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com/))

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AndrewPuig77/Small-Food-Business-Management-System.git
   cd Small-Food-Business-Management-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

The app will automatically open in a new window with hot-reloading enabled.

---

## Building Installers

### Available Build Commands

| Command | Description | Output |
|---------|-------------|--------|
| `npm run pack` | Build without packaging (for testing) | Unpacked app in `dist/` |
| `npm run dist` | Build for current platform | Platform-specific installer |
| `npm run dist:win` | Build for Windows | `.exe` installer + portable |
| `npm run dist:mac` | Build for macOS | `.dmg` + `.zip` |
| `npm run dist:linux` | Build for Linux | `.AppImage` + `.deb` |

### Windows Build

```bash
npm run dist:win
```

**Creates:**
- `Food-Business-Manager-Setup-0.1.0.exe` - **NSIS installer** (recommended)
  - Full installation wizard
  - Desktop and Start Menu shortcuts
  - Uninstaller included
  - ~150MB file size
  
- `Food-Business-Manager-0.1.0.exe` - **Portable version**
  - No installation required
  - Run from USB or any folder
  - ~200MB file size

**Requirements to Build:**
- Windows 10/11
- Node.js installed
- Internet connection (first time only)

### macOS Build

```bash
npm run dist:mac
```

**Creates:**
- `Food-Business-Manager-0.1.0.dmg` - **Disk image**
  - Standard macOS installer
  - Drag-to-Applications interface
  - Signed (if certificates configured)
  
- `Food-Business-Manager-0.1.0-mac.zip` - **Zip archive**
  - Alternative distribution method
  - Extract and run

**Requirements to Build:**
- macOS 10.13 or later
- Xcode Command Line Tools
- Node.js installed

**Note:** To notarize and sign the app for distribution outside your organization, you need an Apple Developer account ($99/year).

### Linux Build

```bash
npm run dist:linux
```

**Creates:**
- `Food-Business-Manager-0.1.0.AppImage` - **AppImage**
  - Universal Linux executable
  - Works on most distributions
  - No installation needed
  - Make executable: `chmod +x Food-Business-Manager-0.1.0.AppImage`
  
- `food-business-manager_0.1.0_amd64.deb` - **Debian package**
  - For Debian/Ubuntu/Mint
  - Install with: `sudo dpkg -i food-business-manager_0.1.0_amd64.deb`

**Requirements to Build:**
- Linux (Ubuntu, Debian, Fedora, etc.)
- Node.js installed
- `fpm` (optional, for advanced packaging)

---

## End User Installation

### Windows Users

1. **Download** `Food-Business-Manager-Setup-0.1.0.exe` from the releases page

2. **Run the installer:**
   - Double-click the `.exe` file
   - Windows SmartScreen may warn you (click "More info" → "Run anyway")
   - Choose installation location (default: `C:\Program Files\Food Business Manager`)
   - Select options:
     - ✅ Create desktop shortcut (recommended)
     - ✅ Create Start Menu entry (recommended)
   - Click "Install"

3. **Launch the app:**
   - Double-click the desktop icon, or
   - Search "Food Business Manager" in Start Menu

4. **First-time setup:**
   - Enter your business information
   - Create the owner account (admin)
   - Set owner code for security

**Alternative: Portable Version**
- Download `Food-Business-Manager-0.1.0.exe` (portable)
- No installation needed - just run it
- Great for USB drives or temporary use
- Data is stored in the app's folder

### macOS Users

1. **Download** `Food-Business-Manager-0.1.0.dmg`

2. **Install:**
   - Double-click the `.dmg` file
   - Drag "Food Business Manager" to the Applications folder
   - Eject the disk image

3. **First launch:**
   - Open from Applications folder
   - macOS may show "unidentified developer" warning:
     - Right-click the app → Open
     - Or: System Preferences → Security → "Open Anyway"

4. **Complete setup wizard**

### Linux Users

#### Option 1: AppImage (Universal)

1. **Download** `Food-Business-Manager-0.1.0.AppImage`

2. **Make it executable:**
   ```bash
   chmod +x Food-Business-Manager-0.1.0.AppImage
   ```

3. **Run:**
   ```bash
   ./Food-Business-Manager-0.1.0.AppImage
   ```

4. **(Optional) Integrate with system:**
   - Right-click AppImage → "Integrate and run"
   - Or use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

#### Option 2: Debian Package

1. **Download** `food-business-manager_0.1.0_amd64.deb`

2. **Install:**
   ```bash
   sudo dpkg -i food-business-manager_0.1.0_amd64.deb
   sudo apt-get install -f  # Fix dependencies if needed
   ```

3. **Launch:**
   - Search in Applications menu, or
   - Run: `food-business-manager`

---

## Custom Branding

Want to add your business logo to the app icon?

### Creating Icons

#### Windows (.ico)
1. Create a **256x256 pixel** PNG of your logo
2. Convert to `.ico` format:
   - Online: [ConvertICO](https://convertio.co/png-ico/)
   - Software: [IcoFX](https://icofx.ro/), [GIMP](https://www.gimp.org/)
   - Command line (ImageMagick):
     ```bash
     magick convert logo.png -resize 256x256 assets/icon.ico
     ```
3. Save to `assets/icon.ico`

#### macOS (.icns)
1. Create a **1024x1024 pixel** PNG
2. Convert to `.icns`:
   - Mac app: [Image2Icon](https://img2icnsapp.com/)
   - Online: [CloudConvert](https://cloudconvert.com/png-to-icns)
   - Command line (Mac):
     ```bash
     mkdir icon.iconset
     sips -z 16 16 logo.png --out icon.iconset/icon_16x16.png
     sips -z 32 32 logo.png --out icon.iconset/icon_16x16@2x.png
     # ... (repeat for other sizes)
     iconutil -c icns icon.iconset -o assets/icon.icns
     ```
3. Save to `assets/icon.icns`

#### Linux (.png)
1. Create a **512x512 pixel** PNG
2. Save to `assets/icon.png`

### Rebuild with New Icons

After adding icons:

```bash
npm run dist
```

Your custom icons will be included in the new build!

---

## System Requirements

### Minimum Requirements
- **OS:**
  - Windows 10 (64-bit) or later
  - macOS 10.13 (High Sierra) or later
  - Linux with GTK 3 (Ubuntu 18.04+, Fedora 28+, etc.)
- **RAM:** 4GB
- **Storage:** 500MB free
- **Display:** 1366x768

### Recommended
- **RAM:** 8GB or more
- **Storage:** 2GB free (for growth)
- **Display:** 1920x1080 or higher

---

## Troubleshooting

### Build Issues

**Problem:** `electron-builder` fails with "Cannot find module"
```bash
# Solution: Rebuild native modules
npm run rebuild
# Or reinstall:
rm -rf node_modules
npm install
```

**Problem:** Windows build fails on macOS/Linux
```bash
# You can only build for platforms you're on, unless using:
npm install --save-dev electron-builder
# Then use Docker for cross-platform builds
```

**Problem:** macOS code signing errors
```bash
# For development builds, disable signing:
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac
```

### Installation Issues

**Windows SmartScreen Warning:**
- Click "More info" → "Run anyway"
- This happens because the app isn't digitally signed (costs $300/year)

**macOS "damaged" or "unidentified developer":**
```bash
# Allow the app to run:
sudo xattr -rd com.apple.quarantine /Applications/Food\ Business\ Manager.app
```

**Linux permission denied:**
```bash
# Make AppImage executable:
chmod +x Food-Business-Manager-0.1.0.AppImage
```

### Runtime Issues

**App won't start:**
1. Check system requirements
2. Look for error logs:
   - Windows: `%APPDATA%\Food Business Manager\logs\`
   - macOS: `~/Library/Logs/Food Business Manager/`
   - Linux: `~/.config/Food Business Manager/logs/`

**Database errors:**
- Delete database and restart: `database/business.db`
- This will reset all data (backup first!)

**Performance issues:**
- Close unnecessary applications
- Increase RAM allocation if running in VM
- Check disk space (need 500MB+ free)

---

## Distribution Tips

### For Public Release

1. **Test thoroughly** on all target platforms
2. **Create GitHub Release**:
   - Tag version: `v0.1.0`
   - Upload all installer files
   - Write release notes
3. **Add checksums** for security:
   ```bash
   sha256sum Food-Business-Manager-Setup-0.1.0.exe > checksums.txt
   ```

### For Internal Use

1. **Network share:** Place installers on shared drive
2. **Silent install** (Windows NSIS):
   ```bash
   Food-Business-Manager-Setup-0.1.0.exe /S
   ```
3. **Group Policy** (Windows): Deploy via GPO

---

## Need Help?

- **Issues:** [GitHub Issues](https://github.com/AndrewPuig77/Small-Food-Business-Management-System/issues)
- **Documentation:** See `docs/` folder
- **Contact:** See README.md for team contact info

---

**Last Updated:** December 2025  
**Version:** 0.1.0
