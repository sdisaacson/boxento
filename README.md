# Boxento

Boxento is a lightweight, open-source customizable start page for tech-savvy users built with React, Vite, Tailwind CSS, and shadcn/ui. It features dynamic, draggable, and resizable widgets to help you stay organized.

## Features
- **Modular & Fast:** Powered by React, Vite, and Bun for rapid development.
- **Customizable Widgets:** Drag, drop, and resize with a minimum size of 2×2. New widgets default to 3×3 on desktop (2×2 on mobile).
- **Theme Support:** Toggle between light and dark modes.
- **Community-Driven:** Open source under the MIT License.

## Getting Started

### Prerequisites
- Bun (v1.0+)
- Git (optional)

### Installation
```bash
git clone https://github.com/sushaantu/boxento.git
cd boxento
bun install
```

### Running Locally
```bash
bun run dev
```
Visit [http://localhost:5173](http://localhost:5173).

## Widgets
Default widgets include:
- **Todo Widget**
- **Weather Widget**
- **Quick Links Widget**
- **Notes Widget**

Additional widgets like Calendar or World Clocks can be added via the widget selector.

## Contributing
1. Fork and clone the repo.
2. Create or update widgets in `/src/components/widgets/`.
3. Test with `bun run dev` and submit a clear PR.

## License
MIT License.