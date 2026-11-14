// Ludo Master Pro - Client Application Logic (Figma Pixel-Perfect Edition)
const socket = io();
window.socket = socket;

const MATCH_SESSION_KEY = 'ludo_active_match';

function getMatchSession() {
  try {
    const raw = localStorage.getItem(MATCH_SESSION_KEY);
    if (raw) return JSON.parse(raw);
    const cookieMatch = document.cookie.match(/ludo_active_match=([^;]+)/);
    if (cookieMatch) return JSON.parse(decodeURIComponent(cookieMatch[1]));
  } catch(e) {}
  return null;
}

function saveMatchSession(data) {
  try {
    const jsonStr = JSON.stringify(data);
    localStorage.setItem(MATCH_SESSION_KEY, jsonStr);
    document.cookie = `ludo_active_match=${encodeURIComponent(jsonStr)}; max-age=7200; path=/; SameSite=Lax`;
  } catch(e) {}
}

function clearMatchSession() {
  try {
    localStorage.removeItem(MATCH_SESSION_KEY);
    document.cookie = `ludo_active_match=; max-age=0; path=/; SameSite=Lax`;
  } catch(e) {}
}

// Auto-reconnect on socket connection if match session exists
socket.on('connect', () => {
  const match = getMatchSession();
  if (match && match.roomCode && match.playerToken) {
    socket.emit('reconnect_room', match);
  }
});

let currentRoomState = null;
let myPlayerName = 'Emon';
let myColor = 'blue';
window.myColor = 'blue';
let boardInstance = null;
let lastDiceRoll = null;

// Screen Containers
const screenLobby = document.getElementById('screen-lobby');
const screenWaiting = document.getElementById('screen-waiting');
const screenGame = document.getElementById('screen-game');

// Lobby Elements
const inputPlayerName = document.getElementById('input-player-name');
const btnCreateRoom = document.getElementById('btn-create-room');
const inputRoomCode = document.getElementById('input-room-code');
const btnJoinRoom = document.getElementById('btn-join-room');
const btnSoundToggleLobby = document.getElementById('btn-sound-toggle-lobby');

// Waiting Room Elements
const btnBackToLobby = document.getElementById('btn-back-to-lobby');
const waitingRoomCode = document.getElementById('waiting-room-code');
const btnCopyInvite = document.getElementById('btn-copy-invite');
const waitingPlayerList = document.getElementById('waiting-player-list');
const btnAddBot = document.getElementById('btn-add-bot');
const btnStartGame = document.getElementById('btn-start-game');

// Game Header Elements
const btnFigmaBack = document.getElementById('btn-figma-back');
const btnShareRoomTrigger = document.getElementById('btn-share-room-trigger');
const gameRoomTag = document.getElementById('game-room-tag');
const btnFigmaMenu = document.getElementById('btn-figma-menu');

// Game Arena Elements
const gameBoardContainer = document.getElementById('game-board-container');
const gameStatusAction = document.getElementById('game-status-action');

// Drawer & Chat Elements
const modalMenu = document.getElementById('modal-menu');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const drawerRoomCode = document.getElementById('drawer-room-code');
const btnCopyDrawerLink = document.getElementById('btn-copy-drawer-link');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

// Rollmates Social Bar & Reactions
const btnOpenChat = document.getElementById('btn-open-chat');
const chatUnreadBadge = document.getElementById('chat-unread-badge');
const btnOpenEmoji = document.getElementById('btn-open-emoji');
const emojiReactionDock = document.getElementById('emoji-reaction-dock');
const btnCloseEmojiDock = document.getElementById('btn-close-emoji-dock');

// Rollmates Victory Modal
const modalVictory = document.getElementById('modal-victory');
const victoryWinnerName = document.getElementById('victory-winner-name');
const victoryAvatar = document.getElementById('victory-avatar');
const btnVictoryAgain = document.getElementById('btn-victory-again');
const btnVictoryHome = document.getElementById('btn-victory-home');

// Player Card & 3D Dice Mapping (No profile pics!)
const PLAYER_CARDS = {
  blue: {
    card: document.getElementById('card-blue'),
    name: document.getElementById('name-blue'),
    diceBox: document.getElementById('dice-box-blue'),
    die: document.getElementById('die-blue'),
    diceCube: document.getElementById('cube-blue')
  },
  green: {
    card: document.getElementById('card-green'),
    name: document.getElementById('name-green'),
    diceBox: document.getElementById('dice-box-green'),
    die: document.getElementById('die-green'),
    diceCube: document.getElementById('cube-green')
  },
  red: {
    card: document.getElementById('card-red'),
    name: document.getElementById('name-red'),
    diceBox: document.getElementById('dice-box-red'),
    die: document.getElementById('die-red'),
    diceCube: document.getElementById('cube-red')
  },
  yellow: {
    card: document.getElementById('card-yellow'),
    name: document.getElementById('name-yellow'),
    diceBox: document.getElementById('dice-box-yellow'),
    die: document.getElementById('die-yellow'),
    diceCube: document.getElementById('cube-yellow')
  }
};

function getPlayerFirstName(name) {
  if (!name) return 'Player';
  let clean = name.replace(/\s*\(You\)/gi, '').replace(/\s*\(Host\)/gi, '').trim();
  if (clean.toLowerCase().startsWith('robo-')) {
    clean = clean.replace(/robo-/i, '');
  }
  const parts = clean.split(/\s+/);
  return parts[0] || clean;
}

// ============================================================================
// 1. INITIALIZE BOARD & SOUNDS
// ============================================================================
boardInstance = new LudoBoard(gameBoardContainer, (tokenIndex) => {
  handleTokenMove(tokenIndex);
});

if (btnSoundToggleLobby) {
  btnSoundToggleLobby.onclick = () => {
    window.sounds.enabled = !window.sounds.enabled;
    btnSoundToggleLobby.textContent = window.sounds.enabled ? '🔊' : '🔇';
  };
}

// Automatically unlock Web Audio API AudioContext on the first tap/click anywhere
window.addEventListener('pointerdown', () => {
  if (window.sounds) window.sounds.init();
}, { once: true });

// URL Params check for Room Code
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam && inputRoomCode) {
  inputRoomCode.value = roomParam.toUpperCase();
}

// ============================================================================
// 2. LOBBY & WAITING ROOM ACTIONS
// ============================================================================
if (btnCreateRoom) {
  btnCreateRoom.onclick = () => {
    const name = (inputPlayerName.value || '').trim() || 'Emon';
    myPlayerName = name;
    window.sounds.init();
    socket.emit('create_room', {
      playerName: name,
      userId: (window.currentUser && window.currentUser.id) ? window.currentUser.id : null
    });
  };
}

if (btnJoinRoom) {
  btnJoinRoom.onclick = () => {
    const name = (inputPlayerName.value || '').trim() || 'Player 2';
    const code = (inputRoomCode.value || '').trim().toUpperCase();
    if (!code) {
      alert('Please enter a 4-letter Room Code.');
      return;
    }
    myPlayerName = name;
    window.sounds.init();
    socket.emit('join_room', {
      roomCode: code,
      playerName: name,
      userId: (window.currentUser && window.currentUser.id) ? window.currentUser.id : null
    });
  };
}

if (btnBackToLobby) {
  btnBackToLobby.onclick = () => {
    window.location.reload();
  };
}

if (btnAddBot) {
  btnAddBot.onclick = () => {
    socket.emit('add_bot');
  };
}

if (btnStartGame) {
  btnStartGame.onclick = () => {
    socket.emit('start_game');
  };
}

const btnCopyInviteHero = document.getElementById('btn-copy-invite-hero');
if (btnCopyInvite) btnCopyInvite.onclick = (e) => copyShareLink(e);
if (btnCopyInviteHero) btnCopyInviteHero.onclick = (e) => copyShareLink(e);
if (btnCopyDrawerLink) btnCopyDrawerLink.onclick = (e) => copyShareLink(e);
if (btnShareRoomTrigger) btnShareRoomTrigger.onclick = (e) => copyShareLink(e);

function copyShareLink(evt) {
  if (!currentRoomState) return;
  const url = `${window.location.origin}/?room=${currentRoomState.id}`;
  const targetBtn = (evt && evt.currentTarget) ? evt.currentTarget : (document.getElementById('btn-copy-invite-hero') || btnCopyInvite);

  function markCopied() {
    showToast(`Room Link Copied: ${currentRoomState.id}`);
    if (targetBtn) {
      const origHtml = targetBtn.innerHTML;
      targetBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      targetBtn.classList.add('copied');
      setTimeout(() => {
        targetBtn.innerHTML = origHtml;
        targetBtn.classList.remove('copied');
      }, 2400);
    }
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch(e) {}
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(markCopied).catch(() => {
      fallbackCopy(url);
      markCopied();
    });
  } else {
    fallbackCopy(url);
    markCopied();
  }
}

if (btnFigmaBack) {
  btnFigmaBack.onclick = () => {
    if (confirm('Leave current Ludo match?')) {
      window.location.reload();
    }
  };
}

if (btnFigmaMenu && modalMenu) {
  btnFigmaMenu.onclick = () => {
    modalMenu.classList.remove('hidden');
  };
}

if (btnCloseDrawer && modalMenu) {
  btnCloseDrawer.onclick = () => {
    modalMenu.classList.add('hidden');
  };
}

// Rollmates Social Floating Buttons (Green Chat 💬 & Yellow Emoji 😊)
if (btnOpenChat && modalMenu) {
  btnOpenChat.onclick = () => {
    modalMenu.classList.remove('hidden');
    if (emojiReactionDock) emojiReactionDock.classList.add('hidden');
    if (chatUnreadBadge) chatUnreadBadge.classList.add('hidden');
  };
}

// ==========================================================================
// ROLLMATES EMOJI COOLDOWN SYSTEM (Per-Player Cooldown)
// Emoji plays for configured duration, then strictly 10s cooldown after it ends
// ==========================================================================
let emojiCooldownTimer = null;
let emojiReactionEndTime = 0;
let emojiCooldownEndTime = 0;

function isEmojiOnCooldown() {
  return Date.now() < emojiCooldownEndTime;
}

function getEmojiCooldownStatus() {
  const now = Date.now();
  if (now >= emojiCooldownEndTime) {
    return { active: false, phase: 'idle', remainingSec: 0, reactionRemainingSec: 0 };
  }
  if (now < emojiReactionEndTime) {
    const reactionRemainingSec = Math.max(1, Math.ceil((emojiReactionEndTime - now) / 1000));
    const totalRemainingSec = Math.max(1, Math.ceil((emojiCooldownEndTime - now) / 1000));
    return {
      active: true,
      phase: 'reacting',
      reactionRemainingSec,
      remainingSec: totalRemainingSec
    };
  }
  const cooldownRemainingSec = Math.max(1, Math.ceil((emojiCooldownEndTime - now) / 1000));
  return {
    active: true,
    phase: 'countdown',
    reactionRemainingSec: 0,
    remainingSec: cooldownRemainingSec
  };
}

function updateEmojiDockButtonsDisabled(disabled) {
  document.querySelectorAll('.rm-emoji-btn').forEach(btn => {
    btn.disabled = disabled;
    if (disabled) {
      btn.classList.add('disabled');
    } else {
      btn.classList.remove('disabled');
    }
  });
}

function startEmojiCooldown(durationSec, cooldownSec = 10) {
  const now = Date.now();
  const dur = Math.max(1, parseFloat(durationSec) || 5);
  const cd = Math.max(1, parseFloat(cooldownSec) || 10);

  emojiReactionEndTime = now + (dur * 1000);
  emojiCooldownEndTime = emojiReactionEndTime + (cd * 1000);

  const badge = document.getElementById('emoji-cooldown-badge');
  const btnOpen = document.getElementById('btn-open-emoji');
  const dock = document.getElementById('emoji-reaction-dock');

  if (dock) dock.classList.add('hidden');
  if (btnOpen) btnOpen.classList.add('on-cooldown');
  updateEmojiDockButtonsDisabled(true);

  if (emojiCooldownTimer) {
    clearInterval(emojiCooldownTimer);
    emojiCooldownTimer = null;
  }

  function tick() {
    const status = getEmojiCooldownStatus();
    if (!status.active) {
      clearInterval(emojiCooldownTimer);
      emojiCooldownTimer = null;
      emojiReactionEndTime = 0;
      emojiCooldownEndTime = 0;

      if (badge) {
        badge.className = 'emoji-cooldown-badge phase-ready';
        badge.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          badge.classList.add('hidden');
          badge.className = 'emoji-cooldown-badge hidden';
          badge.innerHTML = '';
        }, 500);
      }
      if (btnOpen) btnOpen.classList.remove('on-cooldown');
      updateEmojiDockButtonsDisabled(false);
      return;
    }

    if (badge) {
      badge.classList.remove('hidden');
      if (status.phase === 'reacting') {
        badge.className = 'emoji-cooldown-badge phase-reacting';
        badge.innerHTML = '⏳';
        badge.title = `Reaction active (${status.reactionRemainingSec}s). 10s cooldown begins right after.`;
      } else {
        badge.className = 'emoji-cooldown-badge phase-countdown';
        badge.textContent = `${status.remainingSec}s`;
        badge.title = `Emoji cooldown: ${status.remainingSec}s remaining`;
      }
    }
  }

  tick();
  emojiCooldownTimer = setInterval(tick, 250);
}

function triggerPlayerEmoji(payload) {
  if (isEmojiOnCooldown()) {
    const status = getEmojiCooldownStatus();
    const btnOpen = document.getElementById('btn-open-emoji');
    if (btnOpen) {
      btnOpen.classList.add('shake-locked');
      setTimeout(() => btnOpen.classList.remove('shake-locked'), 400);
    }
    if (status.phase === 'reacting') {
      showToast('Emoji reaction is currently active. Please wait!', true);
    } else {
      showToast(`Please wait ${status.remainingSec}s before sending another emoji!`, true);
    }
    return false;
  }

  const dur = parseFloat(payload.duration) || 5;

  // Immediately start local cooldown (reaction duration + 10s post reaction)
  startEmojiCooldown(dur, 10);

  // Send to server
  if (socket) {
    socket.emit('send_emoji', payload);
  }

  // Spawn visual reaction locally for player's color
  spawnFloatingEmoji(myColor, payload);

  // Play sound
  if (window.sounds) {
    if (typeof window.sounds.playEmojiSound === 'function') {
      window.sounds.playEmojiSound(payload.soundType, payload.soundValue, dur * 1000);
    } else if (typeof window.sounds.playPop === 'function') {
      window.sounds.playPop();
    }
  }

  const dock = document.getElementById('emoji-reaction-dock');
  if (dock) dock.classList.add('hidden');
  return true;
}

window.isEmojiOnCooldown = isEmojiOnCooldown;
window.getEmojiCooldownStatus = getEmojiCooldownStatus;
window.startEmojiCooldown = startEmojiCooldown;
window.triggerPlayerEmoji = triggerPlayerEmoji;

if (btnOpenEmoji && emojiReactionDock) {
  btnOpenEmoji.onclick = () => {
    if (isEmojiOnCooldown()) {
      const status = getEmojiCooldownStatus();
      btnOpenEmoji.classList.add('shake-locked');
      setTimeout(() => btnOpenEmoji.classList.remove('shake-locked'), 400);
      if (status.phase === 'reacting') {
        showToast('Emoji reaction is currently active. Please wait!', true);
      } else {
        showToast(`Please wait ${status.remainingSec}s before sending another emoji!`, true);
      }
      return;
    }
    emojiReactionDock.classList.toggle('hidden');
    if (modalMenu) modalMenu.classList.add('hidden');
  };
}

if (btnCloseEmojiDock && emojiReactionDock) {
  btnCloseEmojiDock.onclick = () => {
    emojiReactionDock.classList.add('hidden');
  };
}

document.querySelectorAll('.rm-emoji-btn').forEach(btn => {
  btn.onclick = () => {
    const emoji = btn.dataset.emoji;
    if (emoji) {
      const payload = {
        emoji: emoji,
        content: emoji,
        type: 'unicode',
        size: 48,
        duration: 5,
        soundType: 'preset',
        soundValue: 'pop'
      };
      triggerPlayerEmoji(payload);
    }
  };
});

function spawnFloatingEmoji(color, data) {
  const anchor = document.getElementById(`reaction-anchor-${color}`);
  if (!anchor) return;

  const el = document.createElement('div');
  el.className = 'floating-emoji-item';

  const isObj = data && typeof data === 'object';
  const size = isObj ? (parseInt(data.size, 10) || 54) : 54;
  const durationSec = isObj ? (parseFloat(data.duration) || 5) : 5;
  const durationMs = durationSec * 1000;

  // Set explicit dimensions on the container so flex/video children never collapse to 0
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  // Dynamically set animation-duration based on this emoji's custom configured duration!
  el.style.animationDuration = `${durationSec}s`;

  if (typeof window.renderEmojiVisual === 'function') {
    el.innerHTML = window.renderEmojiVisual(data, size);
  } else {
    el.innerHTML = `<span style="font-size:${size}px;">${(isObj ? (data.emoji || data.content) : data) || '⭐'}</span>`;
  }

  anchor.appendChild(el);

  // Video animated sticker setup: muted, inline, guaranteed playback
  const vid = el.querySelector('video');
  if (vid) {
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.style.width = `${size}px`;
    vid.style.height = `${size}px`;
    vid.style.display = 'block';
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Floating sticker video play err:', err);
      });
    }
  }

  const img = el.querySelector('img');
  if (img) {
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.display = 'block';
  }

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, durationMs);
}
window.spawnFloatingEmoji = spawnFloatingEmoji;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function spawnFloatingChat(color, text, sender) {
  const anchor = document.getElementById(`reaction-anchor-${color}`);
  if (!anchor) return;

  const el = document.createElement('div');
  el.className = 'floating-speech-bubble';
  el.innerHTML = `<span style="flex-shrink:0;">💬</span><span>${escapeHtml(text)}</span>`;
  anchor.appendChild(el);

  window.sounds.playPop();

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 4500);
}

function showChatToast(sender, text, color) {
  const container = document.getElementById('chat-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'chat-toast';
  const colorHex = getColorHex(color);
  toast.innerHTML = `
    <span class="chat-toast-badge" style="background: ${colorHex};">${sender ? sender[0].toUpperCase() : '💬'}</span>
    <span class="chat-toast-sender" style="color: ${colorHex};">${escapeHtml(sender)}:</span>
    <span class="chat-toast-text">${escapeHtml(text)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4500);
}

if (btnSendChat) {
  btnSendChat.onclick = sendUserChat;
}

if (chatInput) {
  chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') sendUserChat();
  };
}

function sendUserChat() {
  const text = (chatInput.value || '').trim();
  if (!text) return;
  socket.emit('send_chat', { message: text });
  chatInput.value = '';
  if (modalMenu) modalMenu.classList.add('hidden');
}

document.querySelectorAll('.rx-pill').forEach(pill => {
  pill.onclick = () => {
    socket.emit('send_chat', { message: pill.textContent });
    if (modalMenu) modalMenu.classList.add('hidden');
  };
});

// Victory Modal Actions
if (btnVictoryAgain) {
  btnVictoryAgain.onclick = () => {
    window.location.reload();
  };
}
if (btnVictoryHome) {
  btnVictoryHome.onclick = () => {
    window.location.reload();
  };
}

// ============================================================================
// 3. 3D CUBIC DICE ROLL CONTROLS & GSAP TUMBLING PHYSICS
// CodePen 3D Euler Matrix: [{ry:0,rx:0}, {ry:90,rx:0}, {ry:180,rx:0}, {ry:270,rx:0}, {ry:0,rx:90}, {ry:0,rx:-90}]
// ============================================================================
const DICE_ROTS = [
  { ry: 0,   rx: 0   }, // 1: Front
  { ry: 90,  rx: 0   }, // 2: Right
  { ry: 180, rx: 0   }, // 3: Back
  { ry: 270, rx: 0   }, // 4: Left
  { ry: 0,   rx: 90  }, // 5: Top
  { ry: 0,   rx: -90 }  // 6: Bottom
];

let isDiceRolling = false;
let lastRollStateKey = null;

Object.keys(PLAYER_CARDS).forEach(color => {
  const cardObj = PLAYER_CARDS[color];
  if (cardObj.diceBox) {
    cardObj.diceBox.onclick = () => triggerUserDiceRoll(color);
  }
  if (cardObj.diceCube) {
    cardObj.diceCube.onclick = () => triggerUserDiceRoll(color);
  }
});

function triggerUserDiceRoll(clickedColor) {
  if (!currentRoomState || currentRoomState.status !== 'playing') return;

  if (currentRoomState.currentTurn !== myColor) {
    showToast(`Waiting for ${currentRoomState.currentTurn.toUpperCase()}'s turn...`);
    return;
  }

  if (clickedColor !== myColor) {
    showToast(`Tap your own dice box (${myColor.toUpperCase()})!`);
    return;
  }

  if (currentRoomState.dice.rolled || isDiceRolling) return;

  socket.emit('roll_dice');
}

function setDiceFace(color, val) {
  const cardObj = PLAYER_CARDS[color];
  if (!cardObj || !cardObj.diceCube) return;
  const v = Math.max(1, Math.min(6, parseInt(val, 10) || 1));
  const cube = cardObj.diceCube;
  const rot = DICE_ROTS[v - 1];
  const targetRX = -rot.rx;
  const targetRY = -rot.ry;

  cube.dataset.val = v;

  if (window.gsap) {
    gsap.killTweensOf(cube);
    gsap.set(cube, {
      rotationX: targetRX,
      rotationY: targetRY,
      rotationZ: 0,
      z: 0
    });
  } else {
    cube.style.transform = `rotateX(${targetRX}deg) rotateY(${targetRY}deg) translateZ(0)`;
  }
}

function animateDiceRoll(color, targetVal, onComplete) {
  const cardObj = PLAYER_CARDS[color];
  if (!cardObj || !cardObj.diceCube) return;

  // Play realistic wooden dice clatter sound for all players (You, Opponents, and Bots)
  if (window.sounds) {
    window.sounds.playDiceRoll();
  }

  const cube = cardObj.diceCube;
  const v = Math.max(1, Math.min(6, parseInt(targetVal, 10) || 1));
  const rot = DICE_ROTS[v - 1];
  const targetRX = -rot.rx;
  const targetRY = -rot.ry;

  isDiceRolling = true;

  if (window.gsap) {
    gsap.killTweensOf(cube);

    // Multi-revolution 3D tumbling: exactly as in CodePen (720deg spin + back.out easing)
    const spinsX = 720;
    const spinsY = 720;
    const startRX = targetRX - spinsX;
    const startRY = targetRY + spinsY;

    const tl = gsap.timeline({
      onComplete: () => {
        cube.dataset.val = v;
        gsap.set(cube, { rotationX: targetRX, rotationY: targetRY, rotationZ: 0, z: 0 });
        isDiceRolling = false;
        if (onComplete) onComplete(v);
      }
    });

    // 1. Z-axis leap towards user with bounce (CodePen physics: z: 0 -> z: 32 -> z: 0)
    tl.fromTo(cube, {
      z: 0
    }, {
      duration: 0.26,
      z: 32,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    }, 0);

    // 2. Full 3D rotational tumble landing smoothly on target face with back.out spring
    tl.fromTo(cube, {
      rotationX: startRX,
      rotationY: startRY,
      rotationZ: gsap.utils.random(-30, 30)
    }, {
      duration: 0.54,
      ease: 'back.out(2.2)',
      rotationX: targetRX,
      rotationY: targetRY,
      rotationZ: 0
    }, 0);

  } else {
    cube.dataset.val = v;
    cube.style.transform = `rotateX(${targetRX}deg) rotateY(${targetRY}deg) translateZ(0)`;
    isDiceRolling = false;
    if (onComplete) onComplete(v);
  }
}

function handleTokenMove(tokenIndex) {
  if (!currentRoomState || currentRoomState.status !== 'playing') return;
  const isMyTurn = currentRoomState.currentTurn === myColor;
  if (isMyTurn && currentRoomState.dice.rolled && currentRoomState.movableTokens.includes(tokenIndex)) {
    socket.emit('move_token', { tokenIndex });
  }
}

// ============================================================================
// 4. ANIMATION & SOCKET LISTENERS
// ============================================================================
const BOARD_ROTATIONS = {
  blue: 0,
  red: 270,
  yellow: 90,
  green: 180
};

const CARD_LAYOUTS = {
  blue: {
    topLeft: 'red',
    topRight: 'green',
    bottomLeft: 'blue',
    bottomRight: 'yellow'
  },
  green: {
    topLeft: 'yellow',
    topRight: 'blue',
    bottomLeft: 'green',
    bottomRight: 'red'
  },
  red: {
    topLeft: 'green',
    topRight: 'yellow',
    bottomLeft: 'red',
    bottomRight: 'blue'
  },
  yellow: {
    topLeft: 'blue',
    topRight: 'red',
    bottomLeft: 'yellow',
    bottomRight: 'green'
  }
};

function updatePlayerCardLayout(userColor) {
  const layout = CARD_LAYOUTS[userColor] || CARD_LAYOUTS.blue;
  const topRow = document.querySelector('.top-players-row');
  const bottomRow = document.querySelector('.bottom-players-row');
  if (!topRow || !bottomRow) return;

  function placeCard(color, targetRow, side) {
    const cardEl = document.getElementById(`card-${color}`);
    if (!cardEl) return;
    const avatarCol = cardEl.querySelector('.rm-card-avatar-col');
    const diceCol = cardEl.querySelector('.rm-card-dice-col');
    const anchor = cardEl.querySelector('.rm-reaction-anchor');

    if (side === 'left') {
      cardEl.classList.remove('rm-card-right');
      cardEl.classList.add('rm-card-left');
      if (avatarCol && diceCol) {
        cardEl.appendChild(avatarCol);
        cardEl.appendChild(diceCol);
      }
    } else {
      cardEl.classList.remove('rm-card-left');
      cardEl.classList.add('rm-card-right');
      if (avatarCol && diceCol) {
        cardEl.appendChild(diceCol);
        cardEl.appendChild(avatarCol);
      }
    }

    if (anchor) {
      if (targetRow === topRow) {
        anchor.classList.remove('anchor-bottom-player');
        anchor.classList.add('anchor-top-player');
      } else {
        anchor.classList.remove('anchor-top-player');
        anchor.classList.add('anchor-bottom-player');
      }
      cardEl.appendChild(anchor);
    }

    targetRow.appendChild(cardEl);
  }

  placeCard(layout.topLeft, topRow, 'left');
  placeCard(layout.topRight, topRow, 'right');
  placeCard(layout.bottomLeft, bottomRow, 'left');
  placeCard(layout.bottomRight, bottomRow, 'right');
}

function updateBoardPerspective(userColor) {
  const rotation = BOARD_ROTATIONS[userColor] || 0;
  const boardEl = document.getElementById('game-board-container');
  if (boardEl) {
    boardEl.style.transform = `rotate(${rotation}deg)`;
    boardEl.style.transition = 'transform 0.4s ease';
    boardEl.style.setProperty('--counter-rot', `${-rotation}deg`);
  }
  // Counter-rotate the pawns so numbers and teardrops always stay upright!
  document.querySelectorAll('.pin-pawn').forEach(token => {
    token.style.setProperty('--counter-rot', `${-rotation}deg`);
  });

  // Re-arrange player cards so user's card and dice are ALWAYS at bottom-left!
  updatePlayerCardLayout(userColor);
}

socket.on('animate_token_step', ({ color, tokenIndex, fromStep, toStep, diceValue, captured, tokens }) => {
  if (diceValue) {
    setDiceFace(color, diceValue);
  }

  if (tokens && currentRoomState) {
    currentRoomState.tokens = tokens;
  }

  const activeColors = currentRoomState && currentRoomState.activeColors 
    ? currentRoomState.activeColors 
    : ['blue', 'green'];

  // Hop tile-by-tile sequentially through each square
  boardInstance.animateStepByStep(color, tokenIndex, fromStep, toStep, captured, () => {
    if (currentRoomState) {
      boardInstance.updateTokens(
        currentRoomState.tokens,
        currentRoomState.movableTokens || [],
        currentRoomState.currentTurn,
        handleTokenMove,
        activeColors
      );
    }
  });
});

socket.on('room_created', ({ roomCode, playerToken, color, state }) => {
  myColor = color || 'blue';
  window.myColor = myColor;
  saveMatchSession({
    roomCode: roomCode,
    playerToken: playerToken,
    color: myColor,
    playerName: myPlayerName,
    userId: (window.currentUser && window.currentUser.id) ? window.currentUser.id : null
  });
  renderState(state);
});

socket.on('room_joined', ({ roomCode, playerToken, color, state }) => {
  myColor = color;
  window.myColor = myColor;
  saveMatchSession({
    roomCode: roomCode,
    playerToken: playerToken,
    color: color,
    playerName: myPlayerName,
    userId: (window.currentUser && window.currentUser.id) ? window.currentUser.id : null
  });
  renderState(state);
});

socket.on('reconnect_success', ({ roomCode, playerToken, color, state }) => {
  myColor = color;
  window.myColor = myColor;
  saveMatchSession({
    roomCode: roomCode,
    playerToken: playerToken,
    color: color,
    playerName: myPlayerName,
    userId: (window.currentUser && window.currentUser.id) ? window.currentUser.id : null
  });

  const screenLogin = document.getElementById('screen-login');
  if (screenLogin) screenLogin.classList.add('hidden');
  if (screenLobby) screenLobby.classList.add('hidden');
  if (screenWaiting) screenWaiting.classList.add('hidden');
  if (screenGame) screenGame.classList.remove('hidden');

  showToast(`🟢 Reconnected! Resumed control of ${color.toUpperCase()}!`);
  updateBoardPerspective(color);
  renderGameTable(state, currentRoomState);
  currentRoomState = state;
});

socket.on('reconnect_failed', ({ message }) => {
  clearMatchSession();
  if (message) showToast(message, true);
});

socket.on('game_update', (state) => {
  renderState(state);
});

socket.on('chat_message', (data) => {
  if (data.color) {
    spawnFloatingChat(data.color, data.text, data.sender);
  }

  // If chat drawer is closed, alert user with unread notification dot
  if (modalMenu && modalMenu.classList.contains('hidden')) {
    if (chatUnreadBadge && data.sender !== myPlayerName) {
      chatUnreadBadge.classList.remove('hidden');
    }
  }

  if (!chatMessages) return;
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-entry';
  msgEl.innerHTML = `
    <span style="font-weight:700; color: ${getColorHex(data.color)}">${escapeHtml(data.sender)}:</span>
    <span style="word-break: break-word; flex: 1;">${escapeHtml(data.text)}</span>
    <span style="font-size:10px; opacity:0.6; margin-left:auto; flex-shrink:0;">${data.time}</span>
  `;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('player_emoji', (data) => {
  if (data.color !== myColor) {
    spawnFloatingEmoji(data.color, data);
    if (window.sounds) {
      const durMs = (parseFloat(data.duration) || 5) * 1000;
      window.sounds.playEmojiSound(data.soundType, data.soundValue, durMs);
    }
  }
});

socket.on('emoji_cooldown_start', (data) => {
  if (typeof startEmojiCooldown === 'function') {
    startEmojiCooldown(data.durationSec || 5, data.cooldownSec || 10);
  }
});

socket.on('emoji_cooldown_active', (data) => {
  if (typeof startEmojiCooldown === 'function') {
    const rem = data.remainingSec || 10;
    if (rem > 10) {
      startEmojiCooldown(rem - 10, 10);
    } else {
      startEmojiCooldown(0, rem);
    }
  }
  if (data.message) {
    showToast(data.message, true);
  }
});

socket.on('error_message', (msg) => {
  if (msg === 'The match has already started' || (typeof msg === 'string' && msg.includes('already started'))) {
    const modalBlocked = document.getElementById('modal-match-started');
    if (modalBlocked) {
      modalBlocked.classList.remove('hidden');
    }
    if (inputRoomCode) inputRoomCode.value = '';
    showToast('The match has already started', true);
    return;
  }
  alert(msg);
});

const btnCloseMatchStarted = document.getElementById('btn-close-match-started');
const matchStartedBackdrop = document.getElementById('match-started-backdrop');
if (btnCloseMatchStarted) {
  btnCloseMatchStarted.onclick = () => {
    const modal = document.getElementById('modal-match-started');
    if (modal) modal.classList.add('hidden');
    window.location.href = '/';
  };
}
if (matchStartedBackdrop) {
  matchStartedBackdrop.onclick = () => {
    const modal = document.getElementById('modal-match-started');
    if (modal) modal.classList.add('hidden');
    window.location.href = '/';
  };
}

// ============================================================================
// 5. STATE RENDERING (PIXEL-TO-PIXEL FIGMA INTEGRATION)
// ============================================================================
function renderState(state) {
  const previousState = currentRoomState;
  currentRoomState = state;

  const me = state.players.find(p => p.id === socket.id);
  if (me) {
    myColor = me.color;
    window.myColor = myColor;
  }

  if (state.status === 'waiting') {
    screenLobby.classList.add('hidden');
    screenWaiting.classList.remove('hidden');
    screenGame.classList.add('hidden');

    if (waitingRoomCode) waitingRoomCode.textContent = state.id;
    const heroRoomCode = document.getElementById('waiting-room-code-hero');
    if (heroRoomCode) heroRoomCode.textContent = state.id;
    if (drawerRoomCode) drawerRoomCode.textContent = state.id;
    renderWaitingList(state);
  } else if (state.status === 'playing' || state.status === 'ended') {
    if (state.status === 'ended') {
      clearMatchSession();
    }
    screenLobby.classList.add('hidden');
    screenWaiting.classList.add('hidden');
    screenGame.classList.remove('hidden');

    renderGameTable(state, previousState);
  }
}

function renderWaitingList(state) {
  if (!waitingPlayerList) return;
  waitingPlayerList.innerHTML = '';

  state.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'waiting-card';
    const isYou = p.id === socket.id;
    const firstName = getPlayerFirstName(p.name);
    card.innerHTML = `
      <div class="waiting-avatar" style="background: ${getColorHex(p.color)}">
        ${p.color[0].toUpperCase()}
      </div>
      <div style="flex:1; text-align:left;">
        <div style="font-weight:700; font-size:14px;">${firstName} ${isYou ? '(You)' : ''} ${p.isHost ? '👑' : ''}</div>
        <div style="font-size:11px; color:#cbd5e1;">${p.color.toUpperCase()} ${p.isBot ? '• AI Bot' : ''} ${p.color === 'green' ? '• Diagonal Cross' : ''}</div>
      </div>
    `;
    waitingPlayerList.appendChild(card);
  });

  const me = state.players.find(p => p.id === socket.id);
  const isHost = me && me.isHost;

  if (btnAddBot) {
    btnAddBot.style.display = (isHost && state.players.length < 4) ? 'block' : 'none';
  }
  if (btnStartGame) {
    btnStartGame.style.display = isHost ? 'block' : 'none';
    btnStartGame.disabled = state.players.length < 2;
    btnStartGame.textContent = state.players.length < 2 
      ? 'Waiting for Opponent...' 
      : `Start Match (${state.players.length}P Cross Match)`;
  }
}

function renderGameTable(state, prevState) {
  if (gameRoomTag) gameRoomTag.textContent = state.id;
  if (drawerRoomCode) drawerRoomCode.textContent = state.id;

  const activeColors = state.activeColors || state.players.map(p => p.color);
  const allColors = ['blue', 'green', 'red', 'yellow'];

  allColors.forEach(color => {
    const cardObj = PLAYER_CARDS[color];
    if (!cardObj || !cardObj.card) return;

    const player = state.players.find(p => p.color === color);
    const isActive = activeColors.includes(color) && !!player;

    if (!isActive) {
      // Inactive card in 2-Player mode
      cardObj.card.classList.add('card-inactive');
      cardObj.card.classList.remove('active-turn-pulse');
      if (cardObj.name) cardObj.name.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      setDiceFace(color, 1);
      return;
    }

    // Active Card
    cardObj.card.classList.remove('card-inactive');
    const isCurrentTurn = state.currentTurn === color;
    if (isCurrentTurn) {
      cardObj.card.classList.add('active-turn-pulse');
    } else {
      cardObj.card.classList.remove('active-turn-pulse');
    }

    // Offline Bot vs Eliminated status badge
    if (player.eliminated) {
      cardObj.card.classList.add('card-eliminated');
      if (cardObj.name) {
        cardObj.name.innerHTML = `${getPlayerFirstName(player.name)} <span class="badge-eliminated-pill">❌ OUT</span>`;
      }
    } else if (!player.connected && !player.isBot) {
      cardObj.card.classList.add('card-offline-bot');
      if (cardObj.name) {
        cardObj.name.innerHTML = `${getPlayerFirstName(player.name)} <span class="badge-bot-pill">🤖 BOT</span>`;
      }
    } else {
      cardObj.card.classList.remove('card-eliminated', 'card-offline-bot');
      if (cardObj.name) {
        cardObj.name.textContent = getPlayerFirstName(player.name);
      }
    }

    // Dice box interactivity
    const isYou = player.id === socket.id;
    if (cardObj.diceBox) {
      if (isYou && isCurrentTurn && !state.dice.rolled) {
        cardObj.diceBox.classList.add('interactive-dice');
      } else {
        cardObj.diceBox.classList.remove('interactive-dice');
      }
    }

    // Dice face synchronization & GSAP 3D roll handling
    if (state.dice.rolled && state.dice.value !== null) {
      if (isCurrentTurn) {
        const currentRollKey = `${state.id}-${color}-${state.dice.value}-${state.dice.consecutiveSixes}-${state.lastAction}`;
        if (lastRollStateKey !== currentRollKey) {
          lastRollStateKey = currentRollKey;
          animateDiceRoll(color, state.dice.value);
          if (state.dice.value === 6) {
            window.sounds.playSix();
          }
        } else if (!isDiceRolling) {
          setDiceFace(color, state.dice.value);
        }
      } else {
        setDiceFace(color, 1);
      }
    } else {
      if (isCurrentTurn) {
        lastRollStateKey = null;
      }
    }
  });

  if (state.status === 'ended') {
    if (prevState && prevState.status !== 'ended') {
      window.sounds.playVictory();
    }
    if (modalVictory && modalVictory.classList.contains('hidden')) {
      modalVictory.classList.remove('hidden');
      const winner = state.players.find(p => p.color === state.winner) || state.players[0];
      const winName = winner ? getPlayerFirstName(winner.name) : 'Champion';
      if (victoryWinnerName) victoryWinnerName.textContent = `${winName} Wins!`;
      if (victoryAvatar) victoryAvatar.textContent = winName[0].toUpperCase();
    }
  } else {
    if (modalVictory) modalVictory.classList.add('hidden');
  }

  // Apply Board Perspective (User's home always at bottom-left!)
  updateBoardPerspective(myColor);

  // Update Board Pawns
  boardInstance.updateTokens(
    state.tokens,
    state.movableTokens || [],
    state.currentTurn,
    handleTokenMove,
    activeColors
  );

  updateTurnToast(state);
  updateTurnTimerRing(state);
}

let turnTimerInterval = null;
let lastTickedSecond = null;
const TIMER_CIRCUMFERENCE = 119.38;

function updateTurnTimerRing(state) {
  if (turnTimerInterval) {
    clearInterval(turnTimerInterval);
    turnTimerInterval = null;
  }

  const allColors = ['blue', 'green', 'red', 'yellow'];
  const activeColor = state.currentTurn;
  const isPlaying = state.status === 'playing';

  // Reset inactive rings
  allColors.forEach(c => {
    const ring = document.getElementById(`timer-ring-${c}`);
    const card = document.getElementById(`card-${c}`);
    if (ring) {
      if (c !== activeColor || !isPlaying) {
        ring.style.strokeDashoffset = TIMER_CIRCUMFERENCE;
      }
    }
    if (card) {
      card.classList.remove('timer-urgent');
    }
  });

  if (!isPlaying || !state.turnExpiresAt) {
    lastTickedSecond = null;
    return;
  }

  const expiresAt = state.turnExpiresAt;
  const maxDuration = (state.turnDuration || 17) * 1000;
  const activeRing = document.getElementById(`timer-ring-${activeColor}`);
  const activeCard = document.getElementById(`card-${activeColor}`);

  function stepTimer() {
    const now = Date.now();
    const remainingMs = Math.max(0, expiresAt - now);
    const fraction = Math.min(1, Math.max(0, remainingMs / maxDuration));
    const offset = TIMER_CIRCUMFERENCE * (1 - fraction);

    if (activeRing) {
      activeRing.style.strokeDashoffset = offset;
    }

    const remainingSec = remainingMs / 1000;
    const secCeil = Math.ceil(remainingSec);

    // Urgent tick countdown for final 3 seconds (Digital Blip)
    if (secCeil <= 3 && secCeil >= 1) {
      if (activeCard) activeCard.classList.add('timer-urgent');
      if (lastTickedSecond !== secCeil) {
        lastTickedSecond = secCeil;
        if (window.sounds) window.sounds.playTimerTick();
      }
    } else {
      if (activeCard) activeCard.classList.remove('timer-urgent');
    }

    if (remainingMs <= 0) {
      if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
      }
      if (activeCard) activeCard.classList.remove('timer-urgent');
    }
  }

  stepTimer();
  turnTimerInterval = setInterval(stepTimer, 50);
}

function updateTurnToast(state) {
  if (!gameStatusAction) return;

  if (state.status === 'ended') {
    gameStatusAction.textContent = state.lastAction || 'Match Ended!';
    return;
  }

  const isMyTurn = state.currentTurn === myColor;
  if (isMyTurn) {
    if (!state.dice.rolled) {
      gameStatusAction.textContent = 'YOUR TURN! Tap your 3D dice to roll!';
      gameStatusAction.style.color = '#ffd700';
    } else if (state.movableTokens && state.movableTokens.length > 0) {
      gameStatusAction.textContent = `Rolled ${state.dice.value}! Tap a glowing pawn to move.`;
      gameStatusAction.style.color = '#38bdf8';
    } else {
      gameStatusAction.textContent = `Rolled ${state.dice.value} — No legal moves. Passing turn...`;
      gameStatusAction.style.color = '#cbd5e1';
    }
  } else {
    const opp = state.players.find(p => p.color === state.currentTurn);
    const oppName = opp ? getPlayerFirstName(opp.name) : 'Opponent';
    gameStatusAction.textContent = `${oppName}'s Turn (${state.currentTurn.toUpperCase()})...`;
    gameStatusAction.style.color = '#cbd5e1';
  }
}

function showToast(msg) {
  if (gameStatusAction) {
    gameStatusAction.textContent = msg;
  }
  if (typeof window.showGlobalToast === 'function') {
    window.showGlobalToast(msg);
  }
}

function getColorHex(color) {
  const map = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b'
  };
  return map[color] || '#3b82f6';
}
