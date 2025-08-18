# Curtains

**Curtains** is a CLI tool that turns plain-text Markdown into a self-contained HTML slideshow.
Think: write simple text → get a fullscreen, arrow-key-driven presentation that works in any browser.

---

## ✨ Features (MVP)

* **Author in Markdown** — full CommonMark support.
* **Simple delimiter** — use `---` to split slides.
* **Self-contained output** — one HTML file with inline CSS + JS runtime.
* **Presentation mode**:

  * Left / Right arrows → move between slides.
  * Space / Enter / mouse click → next slide.
  * `F` key → toggle fullscreen.
* **Themes** — built-in light and dark modes.
* **Links** — open safely in new tabs.
* **Images** — supported via external URLs or relative paths.

---

## 🚀 Getting Started

### Install

You can run Curtains without installing globally:

```bash
npx curtains build deck.slides -o deck.html
```

Or add it to your project:

```bash
npm install curtains --save-dev
```

### Author

Create a file `deck.slides`:

```md
# Welcome
This is _Curtains_.

---
## Agenda
- Intro
- Main Idea
- Q&A

---
## Thanks
```

### Build

Compile to HTML:

```bash
curtains build deck.slides -o deck.html --theme dark
```

### Present

Open `deck.html` in any browser. Use the keys above to navigate.

---

## 🎨 Themes

* `--theme light` (default)
* `--theme dark`

Example:

```bash
curtains build deck.slides -o deck.html --theme dark
```

---

## 🛑 Not in MVP

Curtains is starting simple. These are **out of scope** for the first release:

* Incremental fragments
* Speaker notes
* Advanced transitions or animations
* PDF/print export
* Custom theme packs
* Inline/base64 images
* Accessibility guarantees

See [SPEC.md](./SPEC.md) for the full technical contract and future roadmap.

---

## 🧪 Development

Curtains is written in **TypeScript**, built with **esbuild**, and ships:

* A Node.js CLI (`dist/cli.js`)
* A minified inline browser runtime (`dist/runtime.js`)
* Inline CSS themes (`dist/style.css`)

See [SPEC.md](./SPEC.md) for details.

---

## 📍 Roadmap

Future releases may include:

* Fragments & speaker notes
* Print/PDF export
* Plugin API & custom themes
* Syntax highlighting & math
* Deep-linking & overview mode
