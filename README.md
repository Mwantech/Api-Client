# API Client - Professional API Testing Tool

<div align="center">

![API Client Logo](assets/icon.png)

**A modern, powerful API testing tool built with Electron**

[![Electron](https://img.shields.io/badge/Electron-38.0.0-47848f?logo=electron)](https://electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20|%20macOS%20|%20Linux-lightgrey)](https://github.com/electron/electron)

</div>

## 🚀 Features

### Core Functionality
- ✅ **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- ✅ **Custom Headers**: Add, edit, and manage request headers
- ✅ **Request Body Support**: JSON, Form Data, URL-encoded, Raw Text
- ✅ **Response Viewer**: Beautiful syntax highlighting for JSON responses
- ✅ **Environment Variables**: Use `{{variable}}` syntax for dynamic requests
- ✅ **Collections**: Organize requests into folders and collections
- ✅ **Request History**: Quick access to recently sent requests

### Advanced Features
- 🖼️ **Image Support**: Display image responses directly in the app
- 💾 **Data Persistence**: Auto-save collections and environment variables
- 📁 **Import/Export**: Share collections as JSON files
- 🎨 **Syntax Highlighting**: Color-coded JSON for better readability
- ⌨️ **Keyboard Shortcuts**: Speed up your workflow
- 🌙 **Dark Theme**: Modern, eye-friendly interface
- 📊 **Response Analytics**: Status codes, response time, and data size

## 📸 Screenshots

### Main Interface
![Main Interface](docs/screenshots/main-interface.png)

### JSON Syntax Highlighting
![JSON Highlighting](docs/screenshots/json-highlighting.png)

### Collections Management
![Collections](docs/screenshots/collections.png)

## 🛠️ Installation

### Download Pre-built Binaries
Download the latest release from the [Releases](https://github.com/Mwantech/my-api-client/releases) page:

- **Windows**: `API-Client-Setup-1.0.0.exe` (Installer) or `API-Client-1.0.0.exe` (Portable)
- **macOS**: `API-Client-1.0.0.dmg`
- **Linux**: `API-Client-1.0.0.AppImage` or `api-client_1.0.0_amd64.deb`

### Build from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mwantech/my-api-client.git
   cd my-api-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   # Windows
   npm run build-win
   
   # macOS
   npm run build-mac
   
   # Linux
   npm run build-linux
   
   # All platforms
   npm run build-all
   ```

## 🎯 Quick Start

### Making Your First Request

1. **Enter URL**: Type your API endpoint in the URL field
2. **Select Method**: Choose GET, POST, PUT, DELETE, or PATCH
3. **Add Headers** (optional): Click the Headers tab to add custom headers
4. **Add Body** (optional): For POST/PUT requests, add your request body
5. **Send Request**: Click the "Send" button or press `Ctrl+Enter`

### Using Environment Variables

1. **Add Variables**: In the sidebar, add key-value pairs like:
   - Key: `base_url` 
   - Value: `https://jsonplaceholder.typicode.com`

2. **Use in Requests**: Reference variables with `{{base_url}}/posts/1`

3. **Auto-Replace**: Variables are automatically replaced when sending requests

### Managing Collections

1. **Create Collection**: Click the settings gear → "New Collection"
2. **Save Requests**: Click "Save" button after configuring a request
3. **Organize**: Drag requests between collections
4. **Export/Import**: Share collections with your team

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send Request |
| `Ctrl+S` | Save Request |
| `Ctrl+N` | New Collection |
| `Escape` | Close Modals |

## 🔧 Configuration

### Environment Variables
Set up reusable variables for different environments:

```json
{
  "base_url": "https://api.example.com",
  "api_key": "your-secret-key",
  "user_id": "12345"
}
```

### Request Body Examples

**JSON Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Form Data:**
```
name: John Doe
email: john@example.com
file: @/path/to/file.jpg
```

## 📁 Project Structure

```
my-api-client/
├── main.js              # Electron main process
├── preload.js           # Secure bridge between processes
├── index.html           # UI layout and styling
├── renderer.js          # Frontend logic and API calls
├── package.json         # Project configuration
├── assets/              # Icons and images
│   ├── icon.ico         # Windows icon
│   ├── icon.icns        # macOS icon
│   └── icon.png         # Linux icon
└── dist/                # Built applications (generated)
```

## 🏗️ Built With

- **[Electron](https://electronjs.org/)** - Desktop app framework
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Axios](https://axios-http.com/)** - HTTP client for API requests
- **[Form-Data](https://www.npmjs.com/package/form-data)** - Multipart form data support

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Test your changes thoroughly
- Update documentation as needed
- Add screenshots for UI changes

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: [Create an issue](https://github.com/Mwantech/my-api-client/issues/new?template=bug_report.md)
- **Feature Requests**: [Create an issue](https://github.com/Mwantech/my-api-client/issues/new?template=feature_request.md)
- **Questions**: [Start a discussion](https://github.com/Mwantech/my-api-client/discussions)

## 📋 Roadmap

- [ ] **GraphQL Support** - Add GraphQL query builder
- [ ] **API Documentation** - Generate docs from collections
- [ ] **Team Collaboration** - Share collections in real-time
- [ ] **Mock Server** - Built-in mock server functionality
- [ ] **Test Scripts** - Pre/post-request scripting
- [ ] **Authentication** - OAuth, JWT, and API key management
- [ ] **Themes** - Multiple color themes
- [ ] **Plugins** - Extensible plugin system

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mwantech**
- GitHub: [Mwantech](https://github.com/Mwantech)
- Email: mwantech005@gmail.com

## 🙏 Acknowledgments

- Inspired by [Postman](https://postman.com) and [Insomnia](https://insomnia.rest)
- Icons from [Lucide Icons](https://lucide.dev)
- Built with the amazing [Electron](https://electronjs.org) framework

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

[Report Bug](https://github.com/Mwantech/my-api-client/issues) · [Request Feature](https://github.com/Mwantech/my-api-client/issues) · [Documentation](https://github.com/Mwantech/my-api-client/wiki)

</div>