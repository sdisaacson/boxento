# Boxento

![Boxento Banner](./public/screenshot.png)

**Project Status:** Beta - Ready for early adopters and contributors! Expect some rough edges, but core functionality is solid.

## 🌟 Bringing Back the Magic of Start Pages

**Remember the golden days of My Yahoo and iGoogle?** Boxento is bringing that back - but better, open source, and completely in your control.

- **Seasoned developers** can dive deep into our codebase
- **Hobby coders** can modify existing widgets to suit their needs
- **Complete beginners** can use LLMs like ChatGPT, Claude, or LLM based code editors like Cursor or Windsurf to help generate widget code

There are no gatekeepers here - just bring your imagination, and we'll help you make it real. Check out our [Widget Development Guide](/docs/WIDGET_DEVELOPMENT.md) and [Template Widget](/src/components/widgets/TemplateWidget) to get started. Simply load these files into your favorite AI coding assistant and describe what you want to create!

## 📋 Table of Contents
- [Why Boxento?](#-why-boxento)
- [What is Boxento?](#-what-is-boxento)
- [Get Your Own Boxento](#-get-your-own-boxento)
- [Making Boxento Your Own](#-making-boxento-your-own)
- [Progressive Web App Support](#-progressive-web-app-support)
- [For Developers and Tinkerers](#-for-developers-and-tinkerers)
- [Community & Support](#-community--support)
- [Roadmap](#️-roadmap)
- [License](#-license)

## 🔍 Why Boxento?

While big tech has abandoned customizable start pages, we believe in:

- **Your dashboard, your rules**: Unlike closed platforms, you own and control everything
- **Open source freedom**: Modify, extend, or completely transform it to suit your needs
- **Self-hosted privacy**: Your data stays on your systems
- **Creative expression**: Build your perfect internet starting point, exactly how you want it

## ✨ What is Boxento?

Boxento transforms your new tab or home page into a personalized command center with widgets that matter to you:

- ☑️ Track your to-dos and stay productive
- 🌤️ Check the weather without leaving your start page
- 🔗 Organize your favorite websites in one place
- 📝 Keep notes and ideas at your fingertips
- 🧩 Add more widgets or create your own!

All in a modern interface that gives you that warm, familiar feeling of the web's golden era.

## 🚀 Get Your Own Boxento

### Option 1: Use the Online Demo

Visit our [live demo](https://boxento.app) to try Boxento instantly.

### Option 2: Install Boxento

For the full experience, host your own Boxento:

**Prerequisites:**
- Bun (v1.0+)
- Git

**Installation:**
```bash
git clone https://github.com/sushaantu/boxento.git
cd boxento
bun install
bun run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your personal dashboard.

### Option 3: Docker Installation

For those who prefer using Docker, we provide Docker support out of the box:

**Prerequisites:**
- Docker
- Docker Compose (optional, but recommended)

**Installation with Docker Compose (recommended):**
```bash
# Clone the repository
git clone https://github.com/sushaantu/boxento.git
cd boxento

# Start the application
docker compose up -d

# To stop the application
docker compose down
```

**Installation with Docker:**
```bash
# Clone the repository
git clone https://github.com/sushaantu/boxento.git
cd boxento

# Build the Docker image
docker build -t boxento .

# Run the container
docker run -d -p 5173:5173 --name boxento boxento
```

Visit [http://localhost:5173](http://localhost:5173) to see your personal dashboard.

**Note:** The Docker setup includes:
- Automatic container restart on failure
- Health checks to ensure the application is running
- Volume mounts for persistent data
- Production-ready configuration

## 📖 Making Boxento Your Own

### Getting Started

1. **Add Widgets**: Click the "+" button to add widgets to your dashboard
2. **Arrange Everything**: Drag and drop widgets anywhere you like
3. **Resize as Needed**: Grab any widget corner to resize it
4. **Make It Yours**: Customize each widget through its settings

### Current Widget Collection

Boxento comes with a diverse collection of widgets organized by category:

#### Productivity
- **Todo Widget**: Track tasks and stay organized with customizable todo lists
- **Calendar Widget**: Display upcoming events and appointments at a glance
- **Notes Widget**: Capture thoughts and ideas instantly with a simple notepad
- **Pomodoro Timer**: Boost productivity with time management using the Pomodoro Technique
- **GitHub Streak Tracker**: Monitor your GitHub contribution streak and coding activity

#### Information
- **Weather Widget**: Check current conditions and forecasts without leaving your dashboard
- **World Clocks Widget**: Display time across different time zones
- **RSS Feed Widget**: Stay updated with news and content from your favorite websites
- **Readwise Widget**: Access your Readwise reading highlights directly on your dashboard

#### Finance
- **Currency Converter Widget**: Convert between currencies using live exchange rates
- **UF (Chile) Widget**: Display the value of UF in Chilean Pesos

#### Entertainment
- **YouTube Widget**: Watch videos directly on your dashboard
- **Geography Quiz Widget**: Test your knowledge of world geography

#### Travel
- **Flight Tracker Widget**: Monitor real-time flight status using the Amadeus API

#### Utilities
- **Quick Links Widget**: Organize and quickly access your favorite websites in one place

Each widget can be customized through its settings panel to match your preferences and needs.

### Create Your Own Widgets

The true power of Boxento is its extensibility. Anyone can create widgets - no matter your experience level.

Check out our resources:
- [Widget Development Guide](/docs/widget-development.md) - Step-by-step instructions
- [Template Widget](/src/components/widgets/TemplateWidget) - Ready-to-use starting point

Follow these steps:
1. Fork the repo
2. Use our guides with your favorite coding tools (including AI assistants)
3. Describe what you want to build - if you can imagine it in TypeScript, you can create it!
4. Share with the community or keep for personal use

Don't be afraid to experiment.

## 💻 For Developers and Tinkerers

### Tech Foundation
Built with React, Vite, Tailwind CSS, and shadcn/ui - modern tools that make customization easy.

### Contributing
We welcome contributions of all kinds! Here's how to get started:

1. Fork and clone the repo
2. Create or update widgets in `/src/components/widgets/`
3. Test locally with `bun run dev`
4. Submit a PR to share with others

### Reporting Issues
Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/sushaantu/boxento/issues).

## 📚 Community & Support

Join us in reviving the golden era of start pages, but with modern tech and complete freedom.

- [Discord Community](https://discord.gg/4NXFScs5rv)
- [GitHub Discussions](https://github.com/sushaantu/boxento/discussions)

## 🗺️ Roadmap

Here's what we're working on to make Boxento even better:

### Coming Soon (Q2 2025)
- 🔒 **End-to-End Encryption**: Keeping your dashboard data completely private
- 🌐 **Widget Marketplace**: Discover and install community-created widgets
- 📱 **Mobile Responsive Design**: Perfect dashboard experience on any device


Want to influence what we build next? Join our [Discord Community](https://discord.gg/4NXFScs5rv) or open a feature request on [GitHub](https://github.com/sushaantu/boxento/issues).

## 📄 License

Boxento is open source under the MIT License - free to use, modify, and share.

![Boxento Banner](./public/screenshot-darkmode.png)

## 📱 Progressive Web App Support

Boxento now includes Progressive Web App (PWA) support, allowing you to:

- **Install on your device**: Add Boxento to your home screen on mobile or desktop
- **Work offline**: Access your dashboard even without an internet connection
- **Quick loading**: Faster startup times thanks to caching

For detailed information about PWA features and how to optimize your experience, see our [PWA Support Guide](/docs/PWA_SUPPORT.md).