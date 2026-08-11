# 🎟️ Ticket Booking Interactive Prototype

A high-fidelity interactive prototype for a **Ticket Booking** mobile app flow — built with React, Vite, and Tailwind CSS v4. Designed to let stakeholders and testers *feel* the app, not just look at it.

---

## ✨ Features

### 🖱️ Micro-Interactions
- **Book Now button** — changes background color, scales up on hover, compresses on press, with a violet shimmer glow bloom effect
- **Seat tiles** — scale and glow violet when selected, locked state for occupied seats
- All transitions use spring-eased cubic-bezier curves for a native app feel

### 📋 Conditional Logic
- The **Confirm** button is **disabled** until the user selects at least one seat
- Button label updates dynamically: `"Select a seat to continue"` → `"Confirm 1 Seat"`
- Price summary and seat tags update in real time as seats are toggled

### 🪄 Bottom Sheet Animation
- Slides up with `cubic-bezier(0.32, 0.72, 0, 1)` — the same easing Apple uses in iOS sheets
- Backdrop blur + fade on open; spring-out on dismiss
- Drag handle, close button, and tap-outside-to-dismiss all work

### 🎉 Success Animation
- Canvas-based **confetti burst** — 140 physics particles with gravity, drag, and rotation
- Pulsing violet ring around an animated **checkmark** (spring pop-in)
- Ticket stub with perforated divider, seat labels, and total price

---

## 🗺️ Flow

```
Event Detail Screen
       │
       ▼  tap "Book Now"
Bottom Sheet (seat map)
       │
       ▼  select seat(s) → tap "Confirm"
Success Screen (confetti + ticket stub)
       │
       ▼  tap "Back to event"
Event Detail Screen (reset)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript 5.7 |
| Fonts | Fraunces (display) + Inter (body) via Google Fonts |
| Animation | CSS keyframes + Canvas API (confetti) |
| Images | Unsplash |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm

### Install & run

```bash
git clone https://github.com/shahddismail/ticket-booking-prototype.git
cd ticket-booking-prototype
pnpm install or npm install
pnpm dev or npm run dev
```

Open [http://localhost:8443](http://localhost:8443) in your browser.

---

## 📁 Project Structure

```
src/
├── App.tsx          # All screens and components
├── index.css        # Tailwind import, fonts, keyframe animations
└── main.tsx         # React entrypoint
index.html           # Vite HTML shell
vite.config.ts       # Vite + Tailwind plugin config
```

---

## 🎨 Design Decisions

- **Dark cinematic aesthetic** — deep near-black (`#09090e`) base with electric violet (`#8B5CF6`) as the single accent, echoing high-end event app conventions
- **Fraunces italic** for hero text — a variable optical-size serif that reads as premium at display sizes
- **Phone mockup frame** — the prototype renders inside a 390×700 device shell so stakeholders immediately understand it as a mobile experience
- **Inline styles for interaction states** — avoids Tailwind's static-scan limitation on dynamically composed class strings; hover/press states always render correctly

---

## 📸 Screens

| Event Detail | Seat Selection | Success |
|---|---|---|
| Hero image, artist lineup, Book Now CTA | Seat grid with conditional Confirm button | Confetti burst + ticket stub |

---

## 📄 License

MIT — free to use, adapt, and ship.
