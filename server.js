const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');
const { db, verifyPassword, hashPassword } = require('./data/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Active In-Memory Sessions
const sessions = new Map();

function getSessionUser(req) {
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token;
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/ludo_auth_token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1].trim());
  }
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;
  if (sess.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return sess;
}

function requireAuth(req, res, next) {
  const sess = getSessionUser(req);
  if (!sess) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.user = sess;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const sess = getSessionUser(req);
    if (!sess) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(sess.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    }
    req.user = sess;
    next();
  };
}

// ============================================================================
// 🔐 REST API: AUTH & USER MANAGEMENT
// ============================================================================

app.post('/api/auth/login', (req, res) => {
  const identifier = (req.body.name || req.body.username || req.body.usernameOrEmail || '').trim();
  const password = req.body.password;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Name and password required.' });
  }
  const user = db.findUserByNameOrUsername(identifier);
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid name or password.' });
  }
  if (!verifyPassword(password, user.passwordHash, user.salt)) {
    return res.status(401).json({ error: 'Invalid name or password.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const sessionData = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    expiresAt: Date.now() + 14 * 24 * 3600 * 1000 // 14 days
  };
  sessions.set(token, sessionData);

  res.setHeader('Set-Cookie', `ludo_auth_token=${token}; Path=/; Max-Age=${14 * 24 * 3600}; SameSite=Lax`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { inviteToken, username, email, name, displayName, password, avatar } = req.body;
  const finalName = name || displayName || username;
  if (!inviteToken) {
    return res.status(400).json({ error: 'Registration requires a valid invite link.' });
  }
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const invite = db.getInviteToken(inviteToken);
  if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired invite link.' });
  }

  try {
    const newUser = db.createUser({
      username,
      email,
      name: finalName,
      password,
      role: invite.role || 'user',
      avatar: avatar || '🎮'
    });

    db.consumeInviteToken(inviteToken, newUser.id);

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, {
      userId: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar,
      expiresAt: Date.now() + 14 * 24 * 3600 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.json({ loggedIn: false });
  const user = db.findUserById(sess.userId);
  if (!user) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token) sessions.delete(token);
  res.json({ success: true });
});

app.post('/api/auth/profile', requireAuth, (req, res) => {
  const { name, avatar, password } = req.body;
  try {
    const user = db.updateUserProfile(req.user.userId, { name, avatar, password });
    req.user.name = user.name;
    req.user.avatar = user.avatar;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch(err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password required.' });
  }
  try {
    db.resetPasswordWithToken(resetToken, newPassword);
    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 🎨 PUBLIC GAME CONTENT APIS
// ============================================================================

app.get('/api/emojis', (req, res) => {
  res.json(db.getAllEmojis());
});

app.get('/api/quick-messages', (req, res) => {
  res.json(db.getAllQuickMessages());
});

app.get('/api/match-history', (req, res) => {
  const sess = getSessionUser(req);
  if (sess && sess.role === 'super_admin') {
    return res.json(db.getAllMatches());
  } else if (sess) {
    return res.json(db.getUserMatches(sess.userId, sess.username));
  }
  res.json([]);
});

// ============================================================================
// 🛡️ ADMIN MANAGEMENT APIS (General Admin & Super Admin)
// ============================================================================

app.get('/api/admin/users', requireRole('general_admin', 'super_admin'), (req, res) => {
  res.json(db.getAllUsers());
});

app.post('/api/admin/users', requireRole('general_admin', 'super_admin'), (req, res) => {
  const { username, email, name, password, role, avatar } = req.body;
  if (req.user.role !== 'super_admin' && role === 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can create other Super Admins.' });
  }
  try {
    const user = db.createUser({ username, email, name, password, role: role || 'user', avatar });
    res.json({ success: true, user });
  } catch(err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireRole('general_admin', 'super_admin'), (req, res) => {
  const targetId = req.params.id;
  const target = db.findUserById(targetId);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.role === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Cannot delete Super Admin.' });
  }
  try {
    db.deleteUser(targetId);
    res.json({ success: true });
  } catch(err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/invite-link', requireRole('general_admin', 'super_admin'), (req, res) => {
  const { role } = req.body;
  const invite = db.createInviteToken({
    createdBy: req.user.username,
    role: (req.user.role === 'super_admin' && role) ? role : 'user'
  });
  const origin = `${req.protocol}://${req.get('host')}`;
  const fullUrl = `${origin}/?invite=${invite.token}`;
  res.json({
    success: true,
    inviteToken: invite.token,
    inviteLink: fullUrl,
    inviteUrl: fullUrl,
    expiresAt: invite.expiresAt
  });
});

app.get('/api/admin/invite-links', requireRole('general_admin', 'super_admin'), (req, res) => {
  res.json(db.getAllInviteTokens());
});

app.post('/api/admin/reset-link', requireRole('general_admin', 'super_admin'), (req, res) => {
  const { userId } = req.body;
  try {
    const reset = db.createPasswordResetToken(userId);
    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({
      success: true,
      resetToken: reset.token,
      resetLink: `${origin}/?reset=${reset.token}`,
      expiresAt: reset.expiresAt
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 👑 SUPER ADMIN EXCLUSIVE APIS (Custom Emojis, Audio Voice, Phrases, History)
// ============================================================================

app.get('/api/admin/emojis', requireRole('super_admin'), (req, res) => {
  res.json(db.getAllEmojis());
});

app.post('/api/admin/emojis', requireRole('super_admin'), (req, res) => {
  const { label, type, content, mediaData, soundType, soundValue, soundData, size, duration } = req.body;
  try {
    const emoji = db.addEmoji({
      label,
      type,
      content,
      mediaData,
      soundType,
      soundValue,
      soundData,
      size: parseInt(size) || 48,
      duration: parseFloat(duration) || 5
    });
    res.json({ success: true, emoji });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/emojis/:id', requireRole('super_admin'), (req, res) => {
  try {
    db.deleteEmoji(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/quick-messages', requireRole('super_admin'), (req, res) => {
  res.json(db.getAllQuickMessages());
});

app.post('/api/admin/quick-messages', requireRole('super_admin'), (req, res) => {
  const { text } = req.body;
  try {
    const msg = db.addQuickMessage(text);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/quick-messages/:id', requireRole('super_admin'), (req, res) => {
  try {
    db.deleteQuickMessage(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/match-history', requireRole('super_admin'), (req, res) => {
  res.json(db.getAllMatches());
});

// Board Track Mapping (52 cells)
// Diagonal Cross Pairing: Blue (Bottom-Left, Player) <---> Green (Top-Right, Opponent)
const COLOR_STARTS = { blue: 39, green: 13, red: 0, yellow: 26 };
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// In-Memory Room Registry
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getGlobalPosition(color, step) {
  if (step < 0) return { type: 'base', color, step };
  if (step >= 51 && step <= 55) return { type: 'home_path', color, step: step - 51 };
  if (step === 56) return { type: 'finished', color };
  const globalIndex = (COLOR_STARTS[color] + step) % 52;
  return { type: 'track', globalIndex };
}

function getMovableTokens(tokens, dice) {
  const movable = [];
  tokens.forEach((step, idx) => {
    if (step === -1 && dice === 6) movable.push(idx);
    else if (step >= 0 && step < 56 && step + dice <= 56) movable.push(idx);
  });
  return movable;
}

// ============================================================================
// 🧠 1. ADAPTIVE COMPETITIVE DICE ENGINE (DDA / ANTI-FRUSTRATION)
// Based on Ludo King, Dota 2 PRD & Game Balancing Research
// ============================================================================
class AdaptiveDiceEngine {
  constructor() {
    this.BASE_WEIGHT = 100;
  }

  generateRoll(room, playerColor) {
    if (!room.playerEngineData) room.playerEngineData = {};
    if (!room.playerEngineData[playerColor]) {
      room.playerEngineData[playerColor] = {};
    }
    const pData = room.playerEngineData[playerColor];
    if (pData.turnsStuckInBase === undefined) pData.turnsStuckInBase = 0;
    if (pData.consecutiveSixes === undefined) pData.consecutiveSixes = 0;
    if (pData.corridorMissTurns === undefined) pData.corridorMissTurns = 0;
    if (!Array.isArray(pData.history)) pData.history = [];

    const tokens = room.tokens[playerColor];
    const tokensInBase = tokens.filter(s => s === -1).length;
    const tokensOnTrack = tokens.filter(s => s >= 0 && s < 56).length;

    // A. HARD PITY CEILING: All tokens stuck in base for 5+ turns => 100% Six!
    if (tokensInBase === 4 && pData.turnsStuckInBase >= 5) {
      pData.turnsStuckInBase = 0;
      pData.consecutiveSixes = 1;
      return 6;
    }

    const weights = { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100 };

    // B. SOFT PITY: Progressively boost 6 when stuck in base
    if (tokensInBase > 0) {
      if (pData.turnsStuckInBase >= 2) {
        // Ramp probability smoothly (approx 35% on turn 3, 60% on turn 4)
        weights[6] += (pData.turnsStuckInBase - 1) * 65 * (tokensInBase / 2);
      }
    }

    // C. CONSECUTIVE SIX MITIGATION (Prevent unfair runaway streaks)
    if (pData.consecutiveSixes >= 2) {
      weights[6] = 2; // Near zero chance for 3rd six
    }

    // D. DEAD ROLL SUPPRESSION IN HOME CORRIDOR (Eliminates the "need a 1" forever curse)
    const legalRolls = new Set();
    for (let d = 1; d <= 6; d++) {
      for (const s of tokens) {
        if (s === -1 && d === 6) legalRolls.add(d);
        if (s >= 0 && s + d <= 56) legalRolls.add(d);
      }
    }
    for (let d = 1; d <= 6; d++) {
      if (!legalRolls.has(d)) {
        weights[d] *= 0.35; // 65% suppression for dead rolls
      }
    }

    // E. DYNAMIC TENSION & CLASHING NUDGE (Exciting Chases, Cuts, & Near-Misses)
    const oppColor = playerColor === 'blue' ? 'green' : 'blue';
    const isUnderdog = this.isTrailing(room, playerColor, oppColor);

    for (let d = 1; d <= 6; d++) {
      tokens.forEach(s => {
        if (s < 0 || s + d > 56) return;
        const targetStep = s + d;
        const targetGlobal = (COLOR_STARTS[playerColor] + targetStep) % 52;

        // Cut / Capture Opportunity
        if (targetStep <= 50 && !SAFE_SQUARES.includes(targetGlobal)) {
          room.tokens[oppColor].forEach(oppStep => {
            if (oppStep >= 0 && oppStep <= 50) {
              const oppGlobal = (COLOR_STARTS[oppColor] + oppStep) % 52;
              if (oppGlobal === targetGlobal) {
                // Check if cheap spawn-kill (victim just left base 0-2 steps)
                if (oppStep <= 2) {
                  weights[d] *= 0.75; // Dampen cheap spawn-kill
                  if (d > 1) weights[d - 1] += 30; // Near-miss chase instead
                } else {
                  // Deserved Mid-Track Hunt
                  weights[d] += isUnderdog ? 85 : 55;
                  if (d > 1) weights[d - 1] += 30; // Tension near-miss behind prey
                }
              }
            }
          });
        }

        // Flee into Safe Star while being pursued
        if (SAFE_SQUARES.includes(targetGlobal) && this.isThreatened(room, playerColor, s)) {
          weights[d] += isUnderdog ? 50 : 30;
        }

        // Exact Finishing Roll in corridor
        if (targetStep === 56) {
          weights[d] += 60 + (pData.corridorMissTurns * 25);
        }
      });
    }

    // F. STATISTICAL HISTORY SMOOTHING (Chi-Square rolling window)
    if (pData.history.length >= 12) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      pData.history.forEach(r => counts[r]++);
      const exp = pData.history.length / 6;
      for (let d = 1; d <= 6; d++) {
        if (counts[d] > exp * 1.8) weights[d] *= 0.65; // Dampen over-represented
        else if (counts[d] < exp * 0.4) weights[d] *= 1.35; // Boost starved
      }
    }

    // G. BOUNDED PROBABILITY SAMPLING (Strictly between 8% and 32% per face)
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0);
    let probs = {};
    for (let d = 1; d <= 6; d++) {
      probs[d] = Math.max(0.08, Math.min(0.32, weights[d] / totalW));
    }
    const finalTotal = Object.values(probs).reduce((a, b) => a + b, 0);

    let rand = Math.random() * finalTotal;
    let chosen = 6;
    for (let d = 1; d <= 6; d++) {
      if (rand < probs[d]) {
        chosen = d;
        break;
      }
      rand -= probs[d];
    }

    // Update Player Stats
    if (chosen === 6) {
      pData.turnsStuckInBase = 0;
      pData.consecutiveSixes += 1;
    } else {
      pData.consecutiveSixes = 0;
      if (tokensInBase > 0 && tokensOnTrack === 0) {
        pData.turnsStuckInBase += 1;
      }
    }

    const inCorridor = tokens.some(s => s >= 51 && s < 56);
    if (inCorridor && chosen !== 6) pData.corridorMissTurns += 1;
    else if (tokens.some(s => s === 56)) pData.corridorMissTurns = 0;

    pData.history.push(chosen);
    if (pData.history.length > 25) pData.history.shift();

    room.playerEngineData[playerColor] = pData;
    return chosen;
  }

  isTrailing(room, myColor, oppColor) {
    const myDist = room.tokens[myColor].reduce((a, s) => a + (s === -1 ? 56 : (56 - s)), 0);
    const oppDist = room.tokens[oppColor].reduce((a, s) => a + (s === -1 ? 56 : (56 - s)), 0);
    return myDist > oppDist + 15; // Trailing by >15 steps
  }

  isThreatened(room, myColor, step) {
    if (step < 0 || step >= 51) return false;
    const globalIdx = (COLOR_STARTS[myColor] + step) % 52;
    if (SAFE_SQUARES.includes(globalIdx)) return false;

    const oppColor = myColor === 'blue' ? 'green' : 'blue';
    return room.tokens[oppColor].some(oppStep => {
      if (oppStep < 0 || oppStep >= 51) return false;
      const oppGlobal = (COLOR_STARTS[oppColor] + oppStep) % 52;
      const dist = (globalIdx - oppGlobal + 52) % 52;
      return dist >= 1 && dist <= 6;
    });
  }
}

const diceEngine = new AdaptiveDiceEngine();

// ============================================================================
// 🤖 2. EXPECTIMINIMAX & GAME-THEORY BOT DECISION ENGINE
// Calibrated weights for attack, defense, safety, and human-like Softmax temperature
// ============================================================================
const BOT_WEIGHTS = {
  cutBase: 120.0,
  cutStep: 1.8,
  bonusRoll: 30.0,
  lossBase: 50.0,
  lossStep: 2.0,
  starBase: 45.0,
  stretchEntry: 80.0,
  progStep: 2.5,
  urgency: 25.0,
  homeBase: 250.0,
  gameWin: 10000.0,
  deployBase: 95.0,
  temperature: 0.8 // Softmax realistic human spread
};

function scoreMove(room, color, tokenIndex, dice) {
  const curStep = room.tokens[color][tokenIndex];
  const newStep = curStep === -1 ? 0 : curStep + dice;
  if (newStep > 56) return -999999;

  let score = 0;

  // 1. Victory & Finishing
  if (newStep === 56) {
    const isWinner = room.tokens[color].filter((s, i) => i !== tokenIndex && s === 56).length === 3;
    return isWinner ? BOT_WEIGHTS.gameWin : (BOT_WEIGHTS.homeBase + BOT_WEIGHTS.bonusRoll);
  }

  // 2. Deploy from Base on 6
  if (curStep === -1 && dice === 6) {
    const activePieces = room.tokens[color].filter(s => s >= 0 && s < 56).length;
    score += Math.max(30, BOT_WEIGHTS.deployBase - activePieces * 25);
  }

  // 3. Track Moves & Collisions
  if (newStep >= 0 && newStep <= 50) {
    const targetPos = getGlobalPosition(color, newStep);
    const isSafe = SAFE_SQUARES.includes(targetPos.globalIndex);

    if (isSafe) {
      score += BOT_WEIGHTS.starBase;
    } else {
      // Attack: Cut Enemy
      const oppColor = color === 'blue' ? 'green' : 'blue';
      room.tokens[oppColor].forEach(oppStep => {
        if (oppStep >= 0 && oppStep <= 50) {
          const oppGlobal = getGlobalPosition(oppColor, oppStep).globalIndex;
          if (oppGlobal === targetPos.globalIndex) {
            score += BOT_WEIGHTS.cutBase + (oppStep * BOT_WEIGHTS.cutStep) + BOT_WEIGHTS.bonusRoll;
          }
        }
      });

      // Defense: Threat from Enemy Behind
      let threatProb = 0;
      room.tokens[oppColor].forEach(oppStep => {
        if (oppStep >= 0 && oppStep <= 50) {
          const oppGlobal = getGlobalPosition(oppColor, oppStep).globalIndex;
          const dist = (targetPos.globalIndex - oppGlobal + 52) % 52;
          if (dist >= 1 && dist <= 6) threatProb += (1 / 6);
        }
      });

      if (threatProb > 0) {
        const assetValue = BOT_WEIGHTS.lossBase + (newStep * BOT_WEIGHTS.lossStep);
        score -= Math.min(1.0, threatProb) * assetValue;
      }
    }
  }

  // 4. Safe Home Corridor Entry
  if (newStep >= 51 && newStep <= 55) {
    score += BOT_WEIGHTS.stretchEntry + (newStep - 51) * 10;
  }

  // 5. Progression
  score += dice * BOT_WEIGHTS.progStep + (newStep / 56) * BOT_WEIGHTS.urgency;

  return score;
}

function selectBotMove(room, color, legalMoves, dice) {
  if (legalMoves.length === 1) return legalMoves[0];

  const scores = legalMoves.map(idx => scoreMove(room, color, idx, dice));
  const maxScore = Math.max(...scores);

  // Softmax selection with Temperature T=0.8
  const exps = scores.map(s => Math.exp((s - maxScore) / BOT_WEIGHTS.temperature));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sumExps);

  let rand = Math.random();
  for (let i = 0; i < legalMoves.length; i++) {
    if (rand < probs[i]) return legalMoves[i];
    rand -= probs[i];
  }
  return legalMoves[0];
}

// ============================================================================
// 🎮 3. GAME STATE & TURN LOGIC
// ============================================================================
function getNextTurn(room) {
  const active = room.players.filter(p => !room.rankings.includes(p.color));
  if (active.length <= 1) return null;

  const currentIdx = room.turnOrder.indexOf(room.currentTurn);
  for (let i = 1; i <= room.turnOrder.length; i++) {
    const nextColor = room.turnOrder[(currentIdx + i) % room.turnOrder.length];
    const player = room.players.find(p => p.color === nextColor && !room.rankings.includes(p.color));
    if (player) return nextColor;
  }
  return null;
}

const TURN_TIMEOUT_SEC = 17;

function createGameState(room) {
  return {
    id: room.id,
    status: room.status,
    host: room.host,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      isBot: p.isBot,
      connected: p.connected
    })),
    activeColors: room.players.map(p => p.color),
    currentTurn: room.currentTurn,
    turnOrder: room.turnOrder || [],
    dice: room.dice,
    tokens: room.tokens,
    rankings: room.rankings,
    lastAction: room.lastAction,
    movableTokens: room.movableTokens || [],
    turnExpiresAt: room.turnExpiresAt || null,
    turnPhase: room.turnPhase || 'roll',
    turnDuration: TURN_TIMEOUT_SEC
  };
}

function startRoomTurnTimer(room, phase) {
  clearRoomTurnTimer(room);
  if (room.status !== 'playing') return;

  room.turnPhase = phase;
  room.turnExpiresAt = Date.now() + (TURN_TIMEOUT_SEC * 1000);

  io.to(room.id).emit('game_update', createGameState(room));

  room.turnTimer = setTimeout(() => {
    handleTurnTimeout(room, phase);
  }, TURN_TIMEOUT_SEC * 1000);
}

function clearRoomTurnTimer(room) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  room.turnExpiresAt = null;
}

function handleTurnTimeout(room, phase) {
  if (room.status !== 'playing') return;
  const currentPlayer = room.players.find(p => p.color === room.currentTurn);
  if (!currentPlayer) return;

  if (phase === 'roll') {
    if (!room.dice.rolled) {
      room.autoExecutedDice = true;
      room.lastAction = `⏱️ ${currentPlayer.name} timed out! AI auto-rolling...`;
      executeDiceRoll(room);
    }
  } else if (phase === 'move') {
    if (room.dice.rolled && room.movableTokens && room.movableTokens.length > 0) {
      room.lastAction = `⏱️ ${currentPlayer.name} timed out! AI auto-moving...`;
      const bestMove = selectBotMove(room, room.currentTurn, room.movableTokens, room.dice.value);
      executeMoveToken(room, bestMove);
    }
  }
}

io.on('connection', (socket) => {
  let userRoomId = null;

  socket.on('create_room', ({ playerName, userId }) => {
    const code = generateRoomCode();
    const hostPlayerToken = crypto.randomBytes(16).toString('hex');
    const room = {
      id: code,
      host: socket.id,
      status: 'waiting',
      players: [{
        id: socket.id,
        playerToken: hostPlayerToken,
        name: playerName || 'Player 1',
        color: 'blue',
        userId: userId || null,
        isHost: true,
        isBot: false,
        connected: true
      }],
      turnOrder: ['blue'],
      currentTurn: 'blue',
      dice: { value: null, rolled: false, consecutiveSixes: 0 },
      tokens: {
        blue: [-1, -1, -1, -1],
        green: [-1, -1, -1, -1],
        red: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1]
      },
      playerEngineData: { blue: {}, green: {}, red: {}, yellow: {} },
      rankings: [],
      turnTimer: null,
      turnExpiresAt: null,
      turnPhase: 'roll',
      autoExecutedDice: false,
      startedAt: null,
      turnsCount: 0,
      disconnectTimers: {},
      lastAction: `${playerName || 'Player 1'} created the room.`
    };

    rooms.set(code, room);
    userRoomId = code;
    socket.join(code);
    socket.emit('room_created', { 
      roomCode: code, 
      color: 'blue',
      playerToken: hostPlayerToken,
      state: createGameState(room) 
    });
  });

  socket.on('join_room', ({ roomCode, playerName, userId, playerToken }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return socket.emit('error_message', 'Room not found.');

    // Check if player is reconnecting (strictly by token or userId, never by plain name to avoid guest hijacking)
    const existing = room.players.find(p => 
      (playerToken && p.playerToken === playerToken) ||
      (userId && p.userId === userId)
    );

    if (existing) {
      if (existing.eliminated) {
        return socket.emit('error_message', 'You were eliminated after 5 minutes offline. This match is locked.');
      }
      if (room.disconnectTimers && room.disconnectTimers[existing.color]) {
        clearTimeout(room.disconnectTimers[existing.color]);
        delete room.disconnectTimers[existing.color];
      }
      existing.connected = true;
      existing.disconnectedAt = null;
      existing.disconnectDeadline = null;
      existing.id = socket.id;
      userRoomId = code;
      socket.join(code);
      room.lastAction = `🟢 ${existing.name} reconnected!`;
      socket.emit('reconnect_success', {
        roomCode: code,
        color: existing.color,
        playerToken: existing.playerToken,
        state: createGameState(room)
      });
      if (existing.emojiCooldownUntil && existing.emojiCooldownUntil > Date.now()) {
        const rem = Math.ceil((existing.emojiCooldownUntil - Date.now()) / 1000);
        socket.emojiCooldownUntil = existing.emojiCooldownUntil;
        socket.emit('emoji_cooldown_active', {
          remainingSec: rem,
          message: `Emoji cooldown active (${rem}s remaining).`
        });
      }
      io.to(code).emit('game_update', createGameState(room));
      return;
    }

    if (room.status !== 'waiting') {
      return socket.emit('error_message', 'The match has already started');
    }

    if (room.players.length >= 4) return socket.emit('error_message', 'Room is full (max 4).');

    // 2-Player mode is strictly Cross: Blue (Bottom-Left) vs Green (Top-Right)
    const colorSlots = ['blue', 'green', 'red', 'yellow'];
    const assignedColor = colorSlots[room.players.length];
    const newPlayerToken = crypto.randomBytes(16).toString('hex');

    let finalPlayerName = (playerName || '').trim() || `Player ${room.players.length + 1}`;
    if (room.players.some(p => p.name && p.name.toLowerCase() === finalPlayerName.toLowerCase())) {
      finalPlayerName = `${finalPlayerName} (${room.players.length + 1})`;
    }

    const newPlayer = {
      id: socket.id,
      playerToken: newPlayerToken,
      name: finalPlayerName,
      color: assignedColor,
      userId: userId || null,
      isHost: false,
      isBot: false,
      connected: true
    };

    room.players.push(newPlayer);
    userRoomId = code;
    socket.join(code);

    room.lastAction = `${newPlayer.name} joined as ${assignedColor.toUpperCase()} (Cross match).`;
    socket.emit('room_joined', {
      roomCode: code,
      color: assignedColor,
      playerToken: newPlayerToken,
      state: createGameState(room)
    });
    io.to(code).emit('game_update', createGameState(room));
  });

  socket.on('reconnect_room', ({ roomCode, playerToken, playerName, userId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return socket.emit('reconnect_failed', { message: 'Match is no longer active or room not found.' });

    const player = room.players.find(p => 
      (playerToken && p.playerToken === playerToken) ||
      (userId && p.userId === userId)
    );

    if (!player) {
      return socket.emit('reconnect_failed', { message: 'Player not recognized in this match.' });
    }

    if (player.eliminated) {
      return socket.emit('reconnect_failed', { message: 'You were eliminated after 5 minutes of disconnection. Match is locked.' });
    }

    // Cancel 5-minute elimination timer
    if (room.disconnectTimers && room.disconnectTimers[player.color]) {
      clearTimeout(room.disconnectTimers[player.color]);
      delete room.disconnectTimers[player.color];
    }

    player.connected = true;
    player.disconnectedAt = null;
    player.disconnectDeadline = null;
    player.id = socket.id;
    userRoomId = code;
    socket.join(code);

    room.lastAction = `🟢 ${player.name} returned! Bot control removed.`;
    socket.emit('reconnect_success', {
      roomCode: code,
      color: player.color,
      playerToken: player.playerToken,
      state: createGameState(room)
    });
    io.to(code).emit('game_update', createGameState(room));
  });

  socket.on('add_bot', () => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room || room.status !== 'waiting' || room.players.length >= 4) return;
    if (room.host !== socket.id) return;

    const colorSlots = ['blue', 'green', 'red', 'yellow'];
    const assignedColor = colorSlots[room.players.length];
    const botNames = ['Robo-Alex', 'Luna-AI', 'Neo-Bot', 'LudoMaster AI'];
    const botName = botNames[room.players.length - 1] || `Bot ${room.players.length + 1}`;

    room.players.push({
      id: `bot_${Date.now()}_${Math.random()}`,
      name: botName,
      color: assignedColor,
      userId: null,
      isHost: false,
      isBot: true,
      connected: true
    });

    room.lastAction = `${botName} (AI) joined as ${assignedColor.toUpperCase()} (Cross diagonal).`;
    io.to(room.id).emit('game_update', createGameState(room));
  });

  socket.on('start_game', () => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room || room.status !== 'waiting' || room.host !== socket.id) return;
    if (room.players.length < 2) return socket.emit('error_message', 'Need at least 2 players to start!');

    room.status = 'playing';
    room.startedAt = new Date().toISOString();
    room.turnsCount = 0;

    if (room.players.length === 2) {
      room.turnOrder = ['blue', 'green'];
    } else {
      // Clockwise round cycle: Blue (Bottom-Left) -> Red (Top-Left) -> Green (Top-Right) -> Yellow (Bottom-Right)
      const clockwiseCycle = ['blue', 'red', 'green', 'yellow'];
      room.turnOrder = clockwiseCycle.filter(c => room.players.some(p => p.color === c));
    }
    room.currentTurn = room.turnOrder[0];
    room.dice = { value: null, rolled: false, consecutiveSixes: 0 };
    room.autoExecutedDice = false;
    room.lastAction = `Match started! Turn: ${room.players[0].name} (${room.currentTurn.toUpperCase()})`;

    io.to(room.id).emit('game_update', createGameState(room));
    const firstPlayer = room.players.find(p => p.color === room.currentTurn);
    if (firstPlayer && firstPlayer.isBot) {
      handleBotTurnIfApplicable(room);
    } else {
      startRoomTurnTimer(room, 'roll');
    }
  });

  socket.on('roll_dice', () => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players.find(p => p.color === room.currentTurn);
    if (!currentPlayer || (currentPlayer.id !== socket.id && !currentPlayer.isBot)) return;
    if (room.dice.rolled) return;

    clearRoomTurnTimer(room);
    room.autoExecutedDice = false;
    executeDiceRoll(room);
  });

  socket.on('move_token', ({ tokenIndex }) => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players.find(p => p.color === room.currentTurn);
    if (!currentPlayer || (currentPlayer.id !== socket.id && !currentPlayer.isBot)) return;
    if (!room.dice.rolled || room.dice.value === null) return;

    clearRoomTurnTimer(room);
    executeMoveToken(room, tokenIndex);
  });

  socket.on('send_chat', ({ message }) => {
    if (!userRoomId || !message) return;
    const room = rooms.get(userRoomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    io.to(userRoomId).emit('chat_message', {
      sender: player ? player.name : 'Spectator',
      color: player ? player.color : '#888',
      text: message.slice(0, 100),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('send_emoji', (data) => {
    if (!userRoomId || !data) return;
    const room = rooms.get(userRoomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const now = Date.now();
    const cooldownUntil = Math.max(
      socket.emojiCooldownUntil || 0,
      (player && player.emojiCooldownUntil) || 0
    );

    if (now < cooldownUntil) {
      const remainingSec = Math.ceil((cooldownUntil - now) / 1000);
      socket.emit('emoji_cooldown_active', {
        remainingSec,
        message: remainingSec > 10 
          ? 'Emoji reaction is currently active. Please wait!'
          : `Please wait ${remainingSec}s before sending another emoji!`
      });
      return;
    }

    const duration = Math.max(1, Math.min(30, parseFloat(data.duration) || 5));
    const cooldownSec = 10;
    const totalSec = duration + cooldownSec;
    const newCooldownUntil = now + (totalSec * 1000);

    socket.emojiCooldownUntil = newCooldownUntil;
    if (player) {
      player.emojiCooldownUntil = newCooldownUntil;
    }

    socket.emit('emoji_cooldown_start', {
      durationSec: duration,
      cooldownSec: cooldownSec,
      totalSec: totalSec
    });

    io.to(userRoomId).emit('player_emoji', {
      sender: player ? player.name : 'Player',
      color: player ? player.color : 'blue',
      emoji: data.emoji || '🔥',
      content: data.content || data.emoji || '',
      type: data.type || 'unicode',
      mediaUrl: data.mediaUrl || null,
      size: data.size || 48,
      duration: duration,
      soundType: data.soundType || 'preset',
      soundValue: data.soundValue || 'pop'
    });
  });

  socket.on('leave_room', () => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    const player = room.players[playerIndex];

    const targetRoomId = userRoomId;
    socket.leave(targetRoomId);
    userRoomId = null;

    if (room.status === 'waiting') {
      room.players.splice(playerIndex, 1);
      if (room.players.length === 0) {
        rooms.delete(targetRoomId);
        return;
      }
      if (room.host === socket.id && room.players.length > 0) {
        room.host = room.players[0].id;
        room.players[0].isHost = true;
      }
      room.lastAction = `${player.name} left the room.`;
      io.to(targetRoomId).emit('game_update', createGameState(room));
    } else if (room.status === 'playing') {
      player.connected = false;
      player.isBot = true;
      player.eliminated = true;
      room.lastAction = `👋 ${player.name} left the match. Bot is playing for them.`;
      io.to(targetRoomId).emit('game_update', createGameState(room));

      const remainingHumans = room.players.filter(p => !p.isBot && !p.eliminated);
      if (remainingHumans.length === 0) {
        if (room.turnTimer) clearTimeout(room.turnTimer);
        rooms.delete(targetRoomId);
        return;
      }

      if (room.currentTurn === player.color) {
        clearRoomTurnTimer(room);
        if (room.dice.rolled && room.movableTokens && room.movableTokens.length > 0) {
          const bestMove = selectBotMove(room, room.currentTurn, room.movableTokens, room.dice.value);
          executeMoveToken(room, bestMove);
        } else if (!room.dice.rolled) {
          handleBotTurnIfApplicable(room);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (!userRoomId) return;
    const room = rooms.get(userRoomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;

      if (room.status === 'waiting') {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(userRoomId);
          return;
        }
        if (room.host === socket.id) {
          room.host = room.players[0].id;
          room.players[0].isHost = true;
        }
        io.to(userRoomId).emit('game_update', createGameState(room));
        return;
      }

      if (room.status === 'playing') {
        player.disconnectedAt = Date.now();
        const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes grace period
        player.disconnectDeadline = Date.now() + GRACE_PERIOD_MS;

        room.lastAction = `⚠️ ${player.name} went offline! Bot taking over (5m reconnect limit).`;

        if (!room.disconnectTimers) room.disconnectTimers = {};
        if (room.disconnectTimers[player.color]) {
          clearTimeout(room.disconnectTimers[player.color]);
        }
        room.disconnectTimers[player.color] = setTimeout(() => {
          handlePlayerElimination(room, player.color);
        }, GRACE_PERIOD_MS);

        io.to(userRoomId).emit('game_update', createGameState(room));

        // If it was currently this disconnected player's turn, bot takes over immediately!
        if (room.currentTurn === player.color) {
          clearRoomTurnTimer(room);
          if (room.dice.rolled && room.movableTokens && room.movableTokens.length > 0) {
            const bestMove = selectBotMove(room, room.currentTurn, room.movableTokens, room.dice.value);
            executeMoveToken(room, bestMove);
          } else if (!room.dice.rolled) {
            handleBotTurnIfApplicable(room);
          }
        }
      }
    }
  });
});

function handlePlayerElimination(room, color) {
  if (room.status !== 'playing') return;
  const player = room.players.find(p => p.color === color);
  if (!player || player.connected) return; // Reconnected in time

  player.eliminated = true;
  player.connected = false;
  // Permanently lock their pieces to base (-99)
  room.tokens[color] = [-99, -99, -99, -99];

  room.lastAction = `❌ ${player.name} was eliminated (5 min offline timeout). Match locked for them.`;

  // Check remaining active non-eliminated players
  const remainingActive = room.players.filter(p => !p.eliminated);
  if (remainingActive.length <= 1) {
    const winner = remainingActive[0];
    room.status = 'finished';
    room.winner = winner ? { color: winner.color, name: winner.name } : null;
    room.lastAction = `🏆 ${winner ? winner.name : 'Match'} wins by elimination!`;
    clearRoomTurnTimer(room);
    io.to(room.id).emit('game_update', createGameState(room));
    return;
  }

  // If it was this player's turn, pass to next non-eliminated player!
  if (room.currentTurn === color) {
    passTurnToNext(room);
  } else {
    io.to(room.id).emit('game_update', createGameState(room));
  }
}

function executeDiceRoll(room) {
  clearRoomTurnTimer(room);

  // Uses our Master Adaptive Competitive Dice Engine
  const diceValue = diceEngine.generateRoll(room, room.currentTurn);
  room.dice.value = diceValue;
  room.dice.rolled = true;

  if (diceValue === 6) {
    room.dice.consecutiveSixes += 1;
  } else {
    room.dice.consecutiveSixes = 0;
  }

  const currentPlayer = room.players.find(p => p.color === room.currentTurn);

  // 3 sixes forfeits turn
  if (room.dice.consecutiveSixes === 3) {
    room.lastAction = `${currentPlayer.name} rolled 3 sixes! Turn passed!`;
    room.movableTokens = [];
    io.to(room.id).emit('game_update', createGameState(room));

    setTimeout(() => passTurnToNext(room), 1200);
    return;
  }

  const movable = getMovableTokens(room.tokens[room.currentTurn], diceValue);
  room.movableTokens = movable;
  room.lastAction = `${currentPlayer.name} rolled a ${diceValue}!`;

  io.to(room.id).emit('game_update', createGameState(room));

  if (movable.length === 0) {
    setTimeout(() => passTurnToNext(room), 1100);
  } else if (movable.length === 1) {
    // Smart auto-step: when only 1 choice exists (e.g. rolling 6 with all in base), auto-step after dice lands!
    setTimeout(() => executeMoveToken(room, movable[0]), 650);
  } else if (room.autoExecutedDice) {
    // Player timed out on roll -> AI executes the move automatically!
    setTimeout(() => {
      const bestMove = selectBotMove(room, room.currentTurn, movable, diceValue);
      executeMoveToken(room, bestMove);
    }, 700);
  } else if (currentPlayer.isBot || !currentPlayer.connected) {
    // Bot decision using Expectiminimax heuristics for bots and offline players!
    setTimeout(() => {
      const bestMove = selectBotMove(room, room.currentTurn, movable, diceValue);
      executeMoveToken(room, bestMove);
    }, 750);
  } else {
    // Human player rolled manually and has multiple choices: start 17s move timer!
    startRoomTurnTimer(room, 'move');
  }
}

function executeMoveToken(room, tokenIndex) {
  clearRoomTurnTimer(room);
  const diceValue = room.dice.value;
  const color = room.currentTurn;
  const currentStep = room.tokens[color][tokenIndex];
  const currentPlayer = room.players.find(p => p.color === color);

  let newStep;
  if (currentStep === -1) {
    if (diceValue !== 6) return;
    newStep = 0;
  } else {
    newStep = currentStep + diceValue;
    if (newStep > 56) return;
  }

  let capturedPiece = null;
  let bonusRoll = (diceValue === 6);

  // Collision / Capture Detection
  if (newStep >= 0 && newStep <= 50) {
    const globalPos = getGlobalPosition(color, newStep);
    const isSafe = SAFE_SQUARES.includes(globalPos.globalIndex);

    if (!isSafe) {
      const oppColors = room.players.filter(p => p.color !== color).map(p => p.color);
      for (const oppColor of oppColors) {
        room.tokens[oppColor].forEach((oppStep, oppIdx) => {
          if (oppStep >= 0 && oppStep <= 50) {
            const oppGlobal = getGlobalPosition(oppColor, oppStep).globalIndex;
            if (oppGlobal === globalPos.globalIndex) {
              capturedPiece = { color: oppColor, index: oppIdx };
              bonusRoll = true;
            }
          }
        });
        if (capturedPiece) break;
      }
    }
  }

  if (newStep === 56) bonusRoll = true;

  // 1. Commit state immediately
  room.tokens[color][tokenIndex] = newStep;
  if (capturedPiece) {
    room.tokens[capturedPiece.color][capturedPiece.index] = -1;
    // Dynamic Social Emojis on Capture
    if (currentPlayer && currentPlayer.isBot) {
      setTimeout(() => {
        io.to(room.id).emit('player_emoji', {
          sender: currentPlayer.name,
          color: currentPlayer.color,
          emoji: '👑'
        });
      }, 450);
    } else {
      const oppPlayer = room.players.find(p => p.color === capturedPiece.color);
      if (oppPlayer && oppPlayer.isBot) {
        setTimeout(() => {
          io.to(room.id).emit('player_emoji', {
            sender: oppPlayer.name,
            color: oppPlayer.color,
            emoji: '😡'
          });
        }, 450);
      }
    }
  }

  // 2. Broadcast smooth animation payload to all clients
  io.to(room.id).emit('animate_token_step', {
    color,
    tokenIndex,
    fromStep: currentStep,
    toStep: newStep,
    diceValue,
    captured: capturedPiece,
    tokens: room.tokens
  });

  const stepsCount = (currentStep === -1) ? 1 : (newStep - currentStep);
  const animDuration = stepsCount * 150 + 200;

  setTimeout(() => {
    if (capturedPiece) {
      const opp = room.players.find(p => p.color === capturedPiece.color);
      room.lastAction = `💥 ${currentPlayer.name} cut ${opp ? opp.name : ''}'s piece! Bonus roll!`;
    }

    if (newStep === 56) {
      room.lastAction = `🎉 ${currentPlayer.name} reached HOME!`;
      const allHome = room.tokens[color].every(s => s === 56);
      if (allHome && !room.rankings.includes(color)) {
        room.rankings.push(color);
        room.lastAction = `👑 ${currentPlayer.name} WON (${room.rankings.length === 1 ? '1st Place!' : 'Finished!'})`;
      }
    }

    const remaining = room.players.filter(p => !room.rankings.includes(p.color));
    if (remaining.length <= 1) {
      room.status = 'ended';
      if (remaining.length === 1) room.rankings.push(remaining[0].color);
      const winnerColor = room.rankings[0];
      const winnerPlayer = room.players.find(p => p.color === winnerColor);
      room.lastAction = `🏆 Match Over! Winner: ${winnerPlayer ? winnerPlayer.name : 'Unknown'}!`;

      try {
        db.recordMatch({
          roomCode: room.id,
          startedAt: room.startedAt,
          players: room.players.map(p => ({
            name: p.name,
            color: p.color,
            isBot: p.isBot,
            userId: p.userId || null
          })),
          winner: winnerPlayer ? {
            name: winnerPlayer.name,
            color: winnerPlayer.color,
            userId: winnerPlayer.userId || null
          } : null,
          turnsCount: room.turnsCount || 0,
          durationSec: Math.round((Date.now() - (room.startedAt ? new Date(room.startedAt).getTime() : Date.now())) / 1000)
        });
      } catch(e) {
        console.error('Failed to record match:', e);
      }

      io.to(room.id).emit('game_update', createGameState(room));
      return;
    }

    room.dice = { value: null, rolled: false, consecutiveSixes: bonusRoll ? room.dice.consecutiveSixes : 0 };
    room.movableTokens = [];

    if (bonusRoll) {
      room.autoExecutedDice = false;
      if (!capturedPiece && newStep !== 56) {
        room.lastAction = `${currentPlayer.name} rolled a 6! Rolls again!`;
      }
      io.to(room.id).emit('game_update', createGameState(room));
      if (currentPlayer.isBot || !currentPlayer.connected) {
        handleBotTurnIfApplicable(room);
      } else {
        startRoomTurnTimer(room, 'roll');
      }
    } else {
      passTurnToNext(room);
    }
  }, animDuration);
}

function passTurnToNext(room) {
  clearRoomTurnTimer(room);
  room.autoExecutedDice = false;
  room.dice = { value: null, rolled: false, consecutiveSixes: 0 };
  room.movableTokens = [];

  const nextColor = getNextTurn(room);
  if (!nextColor) {
    room.status = 'ended';
    io.to(room.id).emit('game_update', createGameState(room));
    return;
  }

  room.currentTurn = nextColor;
  const nextPlayer = room.players.find(p => p.color === nextColor);
  room.lastAction = `Turn: ${nextPlayer ? nextPlayer.name : ''} (${nextColor.toUpperCase()})`;

  io.to(room.id).emit('game_update', createGameState(room));
  if (nextPlayer && (nextPlayer.isBot || !nextPlayer.connected)) {
    handleBotTurnIfApplicable(room);
  } else {
    startRoomTurnTimer(room, 'roll');
  }
}

function handleBotTurnIfApplicable(room) {
  if (room.status !== 'playing') return;
  const currentPlayer = room.players.find(p => p.color === room.currentTurn);
  if (!currentPlayer || currentPlayer.eliminated) return;
  const shouldBotPlay = currentPlayer.isBot || !currentPlayer.connected;
  if (!shouldBotPlay) return;

  // Natural human-like cognitive delay
  setTimeout(() => {
    if (room.status === 'playing' && room.currentTurn === currentPlayer.color && !room.dice.rolled) {
      executeDiceRoll(room);
    }
  }, 900);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Ludo Live Master Engine running on http://localhost:${PORT}`);
});
