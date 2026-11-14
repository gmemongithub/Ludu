// Ludo Board coordinates and rendering engine - Figma Exact Edition
const TRACK_COORDINATES = [
  { r: 6, c: 1 },  // 0 - Red Start
  { r: 6, c: 2 },  // 1
  { r: 6, c: 3 },  // 2
  { r: 6, c: 4 },  // 3
  { r: 6, c: 5 },  // 4
  { r: 5, c: 6 },  // 5
  { r: 4, c: 6 },  // 6
  { r: 3, c: 6 },  // 7
  { r: 2, c: 6 },  // 8 - Safe Star
  { r: 1, c: 6 },  // 9
  { r: 0, c: 6 },  // 10
  { r: 0, c: 7 },  // 11
  { r: 0, c: 8 },  // 12
  { r: 1, c: 8 },  // 13 - Green Start
  { r: 2, c: 8 },  // 14
  { r: 3, c: 8 },  // 15
  { r: 4, c: 8 },  // 16
  { r: 5, c: 8 },  // 17
  { r: 6, c: 9 },  // 18
  { r: 6, c: 10 }, // 19
  { r: 6, c: 11 }, // 20
  { r: 6, c: 12 }, // 21 - Safe Star
  { r: 6, c: 13 }, // 22
  { r: 6, c: 14 }, // 23
  { r: 7, c: 14 }, // 24
  { r: 8, c: 14 }, // 25
  { r: 8, c: 13 }, // 26 - Yellow Start
  { r: 8, c: 12 }, // 27
  { r: 8, c: 11 }, // 28
  { r: 8, c: 10 }, // 29
  { r: 8, c: 9 },  // 30
  { r: 9, c: 8 },  // 31
  { r: 10, c: 8 }, // 32
  { r: 11, c: 8 }, // 33
  { r: 12, c: 8 }, // 34 - Safe Star
  { r: 13, c: 8 }, // 35
  { r: 14, c: 8 }, // 36
  { r: 14, c: 7 }, // 37
  { r: 14, c: 6 }, // 38
  { r: 13, c: 6 }, // 39 - Blue Start
  { r: 12, c: 6 }, // 40
  { r: 11, c: 6 }, // 41
  { r: 10, c: 6 }, // 42
  { r: 9, c: 6 },  // 43
  { r: 8, c: 5 },  // 44
  { r: 8, c: 4 },  // 45
  { r: 8, c: 3 },  // 46
  { r: 8, c: 2 },  // 47 - Safe Star
  { r: 8, c: 1 },  // 48
  { r: 8, c: 0 },  // 49
  { r: 7, c: 0 },  // 50
  { r: 6, c: 0 }   // 51
];

// Base Slot Visual Percentages (Directly centered over the 4 clean sockets in each base)
const BASE_SLOTS_PERCENT = {
  red: [
    { left: 16.99, top: 16.99 },
    { left: 28.11, top: 16.99 },
    { left: 16.99, top: 28.11 },
    { left: 28.11, top: 28.11 }
  ],
  green: [
    { left: 71.89, top: 16.99 },
    { left: 83.01, top: 16.99 },
    { left: 71.89, top: 28.11 },
    { left: 83.01, top: 28.11 }
  ],
  yellow: [
    { left: 71.89, top: 71.89 },
    { left: 83.01, top: 71.89 },
    { left: 71.89, top: 83.01 },
    { left: 83.01, top: 83.01 }
  ],
  blue: [
    { left: 16.99, top: 71.89 },
    { left: 28.11, top: 71.89 },
    { left: 16.99, top: 83.01 },
    { left: 28.11, top: 83.01 }
  ]
};

const HOME_CORRIDORS = {
  red: [
    { r: 7, c: 1 },
    { r: 7, c: 2 },
    { r: 7, c: 3 },
    { r: 7, c: 4 },
    { r: 7, c: 4.6 }
  ],
  green: [
    { r: 1, c: 7 },
    { r: 2, c: 7 },
    { r: 3, c: 7 },
    { r: 4, c: 7 },
    { r: 4.6, c: 7 }
  ],
  yellow: [
    { r: 7, c: 13 },
    { r: 7, c: 12 },
    { r: 7, c: 11 },
    { r: 7, c: 10 },
    { r: 7, c: 9.4 }
  ],
  blue: [
    { r: 13, c: 7 },
    { r: 12, c: 7 },
    { r: 11, c: 7 },
    { r: 10, c: 7 },
    { r: 9.4, c: 7 }
  ]
};

const HOME_CENTER = {
  red: { r: 7, c: 6.3 },
  green: { r: 6.3, c: 7 },
  yellow: { r: 7, c: 7.7 },
  blue: { r: 7.7, c: 7 }
};

const START_INDICES = { red: 0, green: 13, yellow: 26, blue: 39 };

// Grid offset inside ludo_board.png
const GRID_OFFSET_PERCENT = 4.19;
const GRID_SIZE_PERCENT = 91.62;

function getPinPawnSVG(color, index) {
  const jewelGradients = {
    blue: { c1: '#93c5fd', c2: '#3b82f6', c3: '#1d4ed8' },
    green: { c1: '#86efac', c2: '#22c55e', c3: '#15803d' },
    red: { c1: '#fca5a5', c2: '#ef4444', c3: '#b91c1c' },
    yellow: { c1: '#fef08a', c2: '#eab308', c3: '#a16207' }
  };
  const g = jewelGradients[color] || jewelGradients.blue;

  return `
    <svg viewBox="0 0 34 46" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tipShadow_${color}_${index}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bodyGrad_${color}_${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="35%" stop-color="#F1F5F9"/>
          <stop offset="70%" stop-color="#CBD5E1"/>
          <stop offset="100%" stop-color="#64748B"/>
        </linearGradient>
        <radialGradient id="jewelGrad_${color}_${index}" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="${g.c1}"/>
          <stop offset="55%" stop-color="${g.c2}"/>
          <stop offset="100%" stop-color="${g.c3}"/>
        </radialGradient>
      </defs>
      <!-- Ground contact shadow -->
      <ellipse cx="17" cy="43.5" rx="8" ry="2.5" fill="url(#tipShadow_${color}_${index})"/>
      <!-- Teardrop Pin Body -->
      <path d="M17 42 C14.5 37.5 4 24 4 15.5 C4 8.2 9.8 2.5 17 2.5 C24.2 2.5 30 8.2 30 15.5 C30 24 19.5 37.5 17 42 Z" 
            fill="url(#bodyGrad_${color}_${index})" 
            stroke="#1e293b" 
            stroke-width="1.3"/>
      <!-- Colored Inner Jewel -->
      <ellipse cx="17" cy="15.5" rx="8" ry="8" fill="url(#jewelGrad_${color}_${index})" stroke="#ffffff" stroke-width="0.8"/>
      <!-- Specular Highlight / Shine -->
      <ellipse cx="14.2" cy="12.2" rx="3" ry="1.8" fill="#ffffff" opacity="0.85"/>
      <!-- Number Label (Centric inside jewel at cx=17, cy=15.5) -->
      <text x="17" y="15.5" text-anchor="middle" dominant-baseline="central" font-family="'Roboto', sans-serif" font-size="9" font-weight="900" fill="#ffffff" style="text-shadow: 0 1px 2px rgba(0,0,0,0.7);">${index + 1}</text>
    </svg>
  `;
}

class LudoBoard {
  constructor(containerEl, onTokenClick) {
    this.container = containerEl;
    this.onTokenClick = onTokenClick;
    this.tokenDOMElements = {};
    this.activeAnimatingTokens = new Set();
    this.renderBoard();
  }

  renderBoard() {
    this.container.innerHTML = '';

    const board = document.createElement('div');
    board.className = 'figma-board';

    // 1. Clean Base White Cards (Completely covers static printed pins in background image!)
    this.initBaseWhiteCards(board);

    // 2. Interactive Token Layer
    const tokenLayer = document.createElement('div');
    tokenLayer.className = 'token-layer';
    board.appendChild(tokenLayer);
    this.tokenLayer = tokenLayer;

    this.container.appendChild(board);
    this.boardEl = board;

    this.initTokenElements();
  }

  initBaseWhiteCards(board) {
    const colors = ['red', 'green', 'yellow', 'blue'];
    const socketOffsets = [
      { left: 30.0, top: 30.0 },
      { left: 70.0, top: 30.0 },
      { left: 30.0, top: 70.0 },
      { left: 70.0, top: 70.0 }
    ];

    colors.forEach(color => {
      const card = document.createElement('div');
      card.className = `base-white-card base-white-${color}`;

      socketOffsets.forEach(pos => {
        const socket = document.createElement('div');
        socket.className = `base-card-socket socket-${color}`;
        socket.style.left = `${pos.left}%`;
        socket.style.top = `${pos.top}%`;
        card.appendChild(socket);
      });

      board.appendChild(card);
    });
  }

  initTokenElements() {
    this.tokenDOMElements = {};
    const colors = ['blue', 'green', 'red', 'yellow'];

    colors.forEach(color => {
      this.tokenDOMElements[color] = [];
      for (let i = 0; i < 4; i++) {
        const token = document.createElement('div');
        token.className = `pin-pawn pin-${color}`;
        token.innerHTML = getPinPawnSVG(color, i);
        token.dataset.color = color;
        token.dataset.index = i;
        token.style.transformOrigin = '50% 91.3%';

        // Visual coordinate in base
        const visual = this.getVisualForToken(color, -1, i);
        token.style.left = `${visual.left}%`;
        token.style.top = `${visual.top}%`;

        this.tokenLayer.appendChild(token);
        this.tokenDOMElements[color].push(token);
      }
    });
  }

  gridToPercent(r, c) {
    const cellUnit = GRID_SIZE_PERCENT / 15;
    const left = GRID_OFFSET_PERCENT + (c * cellUnit) + (cellUnit * 0.5);
    const top = GRID_OFFSET_PERCENT + (r * cellUnit) + (cellUnit * 0.5);
    return { left, top, cellUnit };
  }

  getVisualForToken(color, step, tokenIndex) {
    if (step === -1) {
      const slot = BASE_SLOTS_PERCENT[color][tokenIndex];
      return { left: slot.left, top: slot.top, cellUnit: GRID_SIZE_PERCENT / 15 };
    }

    let coord;
    if (step >= 0 && step <= 50) {
      const start = START_INDICES[color];
      const trackIdx = (start + step) % 52;
      coord = TRACK_COORDINATES[trackIdx];
    } else if (step >= 51 && step <= 55) {
      const idx = step - 51;
      coord = HOME_CORRIDORS[color][idx];
    } else if (step === 56) {
      coord = HOME_CENTER[color];
    } else {
      coord = { r: 7, c: 7 };
    }

    return this.gridToPercent(coord.r, coord.c);
  }

  setTokenVisual(color, index, visual) {
    const token = this.tokenDOMElements[color][index];
    if (!token) return;
    token.style.left = `${visual.left}%`;
    token.style.top = `${visual.top}%`;
  }

  // FORWARD STEP-BY-STEP TILE HOPPING (ZERO BACKWARD GLITCH)
  async animateStepByStep(color, tokenIndex, fromStep, toStep, captured, onFinished) {
    const tokenKey = `${color}_${tokenIndex}`;
    this.activeAnimatingTokens.add(tokenKey);

    const token = this.tokenDOMElements[color][tokenIndex];
    if (token) token.classList.add('hopping');

    if (fromStep === -1) {
      // Step out of base to starting track tile (Cheery Fanfare Pop)
      const targetVis = this.getVisualForToken(color, 0, tokenIndex);
      this.setTokenVisual(color, tokenIndex, targetVis);
      if (window.sounds) window.sounds.playBaseExit();
      await this.sleep(240);
    } else {
      // Step sequentially from fromStep + 1 to toStep
      for (let s = fromStep + 1; s <= toStep; s++) {
        const vis = this.getVisualForToken(color, s, tokenIndex);
        this.setTokenVisual(color, tokenIndex, vis);
        window.sounds.playStep();
        await this.sleep(150);
      }
    }

    if (token) token.classList.remove('hopping');

    const finalVis = this.getVisualForToken(color, toStep, tokenIndex);
    this.setTokenVisual(color, tokenIndex, finalVis);

    if (toStep === 56) {
      window.sounds.playHome();
      await this.sleep(200);
    } else if (!captured && fromStep !== -1) {
      // Check if landed on a safe zone (Star cells: 8, 21, 34, 47; Start cells: 0, 13, 26, 39; Home path: 51)
      let isSafeZone = false;
      if (toStep >= 0 && toStep <= 50) {
        const trackIdx = (START_INDICES[color] + toStep) % 52;
        isSafeZone = [0, 8, 13, 21, 26, 34, 39, 47].includes(trackIdx);
      } else if (toStep === 51) {
        isSafeZone = true;
      }
      if (isSafeZone && window.sounds) {
        window.sounds.playSafeZone();
      }
    }

    if (captured) {
      window.sounds.playCapture();
      const oppToken = this.tokenDOMElements[captured.color][captured.index];
      if (oppToken) {
        oppToken.classList.add('captured-fly');
        const homeVis = this.getVisualForToken(captured.color, -1, captured.index);
        this.setTokenVisual(captured.color, captured.index, homeVis);
        setTimeout(() => oppToken.classList.remove('captured-fly'), 300);
      }
      await this.sleep(250);
    }

    this.activeAnimatingTokens.delete(tokenKey);
    if (onFinished) onFinished();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateTokens(tokensState, movableIndices, activeColor, onTokenClick, activeColors = ['blue', 'green']) {
    const allColors = ['blue', 'green', 'red', 'yellow'];

    // Hide pawns of inactive players to ensure strict 2-player diagonal cross match
    allColors.forEach(color => {
      const isActive = activeColors.includes(color);
      if (this.tokenDOMElements[color]) {
        this.tokenDOMElements[color].forEach(token => {
          token.style.display = isActive ? 'flex' : 'none';
        });
      }
    });

    const cellGroups = {};
    activeColors.forEach(color => {
      const colorTokens = tokensState[color] || [-1, -1, -1, -1];
      colorTokens.forEach((step, idx) => {
        if (this.activeAnimatingTokens.has(`${color}_${idx}`)) return;

        const vis = this.getVisualForToken(color, step, idx);
        const key = `${vis.left.toFixed(2)}_${vis.top.toFixed(2)}`;
        if (!cellGroups[key]) cellGroups[key] = [];
        cellGroups[key].push({ color, idx, step, left: vis.left, top: vis.top, cellUnit: vis.cellUnit });
      });
    });

    Object.values(cellGroups).forEach(group => {
      const count = group.length;
      group.forEach((item, offsetIdx) => {
        const token = this.tokenDOMElements[item.color][item.idx];
        if (!token) return;

        let left = item.left;
        let top = item.top;

        if (count > 1 && item.step !== -1 && item.step !== 56) {
          if (count === 2) {
            const xOffset = offsetIdx === 0 ? -1.6 : 1.6;
            const yOffset = offsetIdx === 0 ? 0.6 : -0.6;
            left += xOffset;
            top += yOffset;
            token.style.transform = `translate(-50%, -91.3%) rotate(var(--counter-rot, 0deg)) scale(0.92)`;
            token.style.zIndex = offsetIdx === 0 ? 25 : 20;
          } else {
            const angle = (offsetIdx / count) * 2 * Math.PI;
            const radius = (item.cellUnit || 6) * 0.22;
            left += Math.cos(angle) * radius;
            top += Math.sin(angle) * radius;
            token.style.transform = `translate(-50%, -91.3%) rotate(var(--counter-rot, 0deg)) scale(0.85)`;
          }
        } else if (item.step === 56) {
          // In Home Center: spread finished pawns in a neat fan so all are 100% visible
          const fanAngles = [ -0.7, 0.7, 2.4, -2.4 ];
          const fanAngle = fanAngles[item.idx % 4];
          const fanRadius = (item.cellUnit || 6) * 0.28;
          left += Math.cos(fanAngle) * fanRadius;
          top += Math.sin(fanAngle) * fanRadius;
          token.style.transform = `translate(-50%, -91.3%) rotate(var(--counter-rot, 0deg)) scale(0.92)`;
        } else {
          token.style.transform = `translate(-50%, -91.3%) rotate(var(--counter-rot, 0deg)) scale(1)`;
        }
        token.style.transformOrigin = '50% 91.3%';

        token.style.left = `${left}%`;
        token.style.top = `${top}%`;

        const isMovable = (item.color === activeColor && movableIndices.includes(item.idx));
        if (isMovable) {
          token.classList.add('movable-pawn');
          token.onclick = (e) => {
            e.stopPropagation();
            if (onTokenClick) onTokenClick(item.idx);
          };
        } else {
          token.classList.remove('movable-pawn');
          token.onclick = null;
        }
      });
    });
  }
}

window.LudoBoard = LudoBoard;
