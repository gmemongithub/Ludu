# 🎲 Ludu Live - Real-Time Multiplayer Board Game

A feature-rich, real-time multiplayer Ludo game built with Node.js, Express, Socket.IO, and modern HTML5/CSS3/JavaScript. Designed with pixel-perfect game arenas, dynamic dice rolling physics, live chat, interactive animated emoji reactions with audio clips, and an administrative control suite.

---

## ✨ Features

- 🎮 **Real-Time Multiplayer**: Instant matchmaking and room creation via 4-character room codes.
- ⏱️ **Turn Timer & Auto-Pass**: Turn timer ring animations with automatic timeout handling.
- 🤖 **AI Bot Integration**: Seamlessly add AI bots or handle offline disconnects with intelligent bot moves.
- 🎭 **Live Social Reactions & Custom Emojis**:
  - Floating emoji and animated WebM sticker reactions above player bases.
  - Preset audio and custom sound clips playback.
  - **Per-Player 10s Cooldown**: Strict cooldown timer preventing spamming — 10 seconds post-reaction cooldown with live visual timer countdown (`10s` $\rightarrow$ `1s`).
- 💬 **In-Game Chat**: Floating real-time chat toasts and quick chat phrase dock.
- 👑 **Super Admin Control Suite**:
  - Live user management & invitation token generation.
  - Custom emoji, animated sticker & audio upload system.
  - Match history and analytics.
- 📱 **Mobile & Desktop Responsive**: Optimized for handheld mobile viewports and desktop browsers alike.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gmemongithub/Ludu.git
   cd Ludu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Play the game:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 Grid & Flexbox, HTML5 Canvas/Audio, GSAP
- **Storage**: JSON database engine with persistent storage

---

## 📄 License

This project is licensed under the MIT License.
