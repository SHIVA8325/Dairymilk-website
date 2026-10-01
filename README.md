# 🍫 Cadbury Dairy Milk — Interactive 3D Scroll Experience

A luxury, interactive web experience for Cadbury Dairy Milk featuring a high-performance 240-frame 3D scroll animation engine, dynamic audio synth, interactive product showcase, and seamless order system.

![Cadbury Dairy Milk](https://img.shields.io/badge/Cadbury-Dairy%20Milk-3c0475?style=for-the-badge)
![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)

---

## ✨ Features

- **240-Frame 3D Scroll Canvas Engine**: Hyper-smooth linear interpolation (lerp) for 60FPS scroll-bound rendering.
- **Interactive Scrubber & Autoplay**: Manual frame scrubbing, 0.5x/1x/2x playback speeds, and Cover/Contain canvas mode toggle.
- **Ambient Audio Synth Engine**: Dynamic Web Audio API sound synthesis.
- **Luxury UI Design**: Deep purple & gold aesthetic with glassmorphism, responsive cards, and dynamic modal checkout.
- **CDN CDN Optimized**: Pre-configured headers in `vercel.json` for instant frame loading on Vercel CDN.

---

## 🚀 Quick Start (Local Development)

You can view and test this project locally using any static web server.

### Option 1: Using `npx serve`
```bash
npm run dev
# or
npx serve .
```

### Option 2: Live Server (VS Code)
Right-click `index.html` and choose **"Open with Live Server"**.

---

## 🌐 Deploy to Vercel

This repository is pre-configured for **1-click deployment** on Vercel.

### Option 1: Via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select `SHIVA8325/Dairymilk-website`.
3. Click **Deploy** (no build settings required).

### Option 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 📁 Repository Structure

```
├── frames/              # 240 high-resolution animation sequence frames
├── index.html           # Main application HTML with Tailwind CSS & Google Fonts
├── styles.css           # Custom glassmorphism & animation styles
├── app.js               # Canvas scroll engine & audio synth logic
├── vercel.json          # Vercel CDN routing & cache configuration
├── package.json         # Project metadata & local dev scripts
└── .gitignore           # Git ignore rules
```
