const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const EMOJIS_UPLOAD_DIR = path.join(UPLOADS_DIR, 'emojis');
const AUDIO_UPLOAD_DIR = path.join(UPLOADS_DIR, 'audio');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, EMOJIS_UPLOAD_DIR, AUDIO_UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Password Hashing Helper
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const result = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return result === hash;
}

// Initial Database Template
const INITIAL_DB = {
  users: [],
  inviteTokens: [],
  resetTokens: [],
  emojis: [
    {
      id: 'em_fire',
      label: 'Fire',
      type: 'unicode',
      content: '🔥',
      soundType: 'preset',
      soundValue: 'sparkle_shield',
      size: 42,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'em_party',
      label: 'Celebration',
      type: 'unicode',
      content: '🎉',
      soundType: 'preset',
      soundValue: 'cheery_fanfare',
      size: 42,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'em_laugh',
      label: 'Laugh',
      type: 'unicode',
      content: '😂',
      soundType: 'preset',
      soundValue: 'pop',
      size: 42,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'em_crown',
      label: 'Crown',
      type: 'unicode',
      content: '👑',
      soundType: 'preset',
      soundValue: 'victory',
      size: 44,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'em_shield',
      label: 'Shield',
      type: 'unicode',
      content: '🛡️',
      soundType: 'preset',
      soundValue: 'sparkle_shield',
      size: 42,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'em_rocket',
      label: 'Rocket',
      type: 'unicode',
      content: '🚀',
      soundType: 'preset',
      soundValue: 'cheery_fanfare',
      size: 42,
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  quickMessages: [
    { id: 'qm_1', text: 'Good Game! 👏', active: true, order: 1 },
    { id: 'qm_2', text: 'Well Played! 🔥', active: true, order: 2 },
    { id: 'qm_3', text: 'Roll a 6! 🎲', active: true, order: 3 },
    { id: 'qm_4', text: 'Hurry Up! ⏳', active: true, order: 4 },
    { id: 'qm_5', text: 'Oops! 😅', active: true, order: 5 },
    { id: 'qm_6', text: 'Nice move! 🎯', active: true, order: 6 }
  ],
  matches: []
};

class Database {
  constructor() {
    this.data = this.load();
    this.seedDefaults();
  }

  load() {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading db.json, recreating defaults:', err);
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
  }

  save() {
    fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  seedDefaults() {
    // Seed default Super Admin if no super admin exists
    const hasSuperAdmin = this.data.users.some(u => u.role === 'super_admin');
    if (!hasSuperAdmin) {
      const { hash, salt } = hashPassword('admin123');
      this.data.users.push({
        id: 'usr_superadmin',
        username: 'superadmin',
        email: 'superadmin@ludo.pro',
        name: 'Super Admin',
        role: 'super_admin',
        avatar: '👑',
        passwordHash: hash,
        salt: salt,
        active: true,
        createdAt: new Date().toISOString()
      });
      console.log('👑 Default Super Admin created: username="superadmin", password="admin123"');
    }

    // Seed default General Admin if none exists
    const hasAdmin = this.data.users.some(u => u.role === 'general_admin');
    if (!hasAdmin) {
      const { hash, salt } = hashPassword('admin123');
      this.data.users.push({
        id: 'usr_admin',
        username: 'admin',
        email: 'admin@ludo.pro',
        name: 'General Admin',
        role: 'general_admin',
        avatar: '🛡️',
        passwordHash: hash,
        salt: salt,
        active: true,
        createdAt: new Date().toISOString()
      });
      console.log('🛡️ Default General Admin created: username="admin", password="admin123"');
    }

    if (!this.data.emojis || this.data.emojis.length === 0) {
      this.data.emojis = [...INITIAL_DB.emojis];
    }
    if (!this.data.quickMessages || this.data.quickMessages.length === 0) {
      this.data.quickMessages = [...INITIAL_DB.quickMessages];
    }
    if (!this.data.matches) {
      this.data.matches = [];
    }

    this.save();
  }

  // --- USER METHODS ---
  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  findUserByNameOrUsername(identifier) {
    if (!identifier) return null;
    const lower = identifier.toLowerCase().trim();
    return this.data.users.find(u => 
      (u.username && u.username.toLowerCase() === lower) || 
      (u.name && u.name.toLowerCase() === lower) || 
      (u.email && u.email.toLowerCase() === lower)
    );
  }

  findUserByUsernameOrEmail(identifier) {
    return this.findUserByNameOrUsername(identifier);
  }

  createUser({ username, email, name, password, role = 'user', avatar = '🎲' }) {
    if (this.findUserByUsernameOrEmail(username)) {
      throw new Error('Username already taken.');
    }
    if (email && this.findUserByUsernameOrEmail(email)) {
      throw new Error('Email already registered.');
    }

    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      username: username.trim(),
      email: email ? email.trim() : '',
      name: name ? name.trim() : username.trim(),
      role: role,
      avatar: avatar,
      passwordHash: hash,
      salt: salt,
      active: true,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserProfile(userId, { name, avatar, password }) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;
    if (password && password.length >= 4) {
      const { hash, salt } = hashPassword(password);
      user.passwordHash = hash;
      user.salt = salt;
    }
    this.save();
    return user;
  }

  deleteUser(userId) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');
    if (user.role === 'super_admin') throw new Error('Cannot delete super admin.');

    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.save();
    return true;
  }

  getAllUsers() {
    return this.data.users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.createdAt,
      active: u.active
    }));
  }

  // --- INVITE TOKEN METHODS ---
  createInviteToken({ createdBy, role = 'user' }) {
    const token = crypto.randomBytes(16).toString('hex');
    const invite = {
      token: token,
      createdBy: createdBy,
      role: role,
      used: false,
      usedBy: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7 days
    };
    this.data.inviteTokens.push(invite);
    this.save();
    return invite;
  }

  getInviteToken(token) {
    return this.data.inviteTokens.find(t => t.token === token);
  }

  consumeInviteToken(token, userId) {
    const invite = this.getInviteToken(token);
    if (!invite) throw new Error('Invalid invite link.');
    if (invite.used) throw new Error('This invite link has already been used.');
    if (new Date(invite.expiresAt) < new Date()) throw new Error('Invite link has expired.');

    invite.used = true;
    invite.usedBy = userId;
    invite.usedAt = new Date().toISOString();
    this.save();
    return invite;
  }

  getAllInviteTokens() {
    return this.data.inviteTokens;
  }

  // --- PASSWORD RESET METHODS ---
  createPasswordResetToken(userId) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');

    const token = crypto.randomBytes(16).toString('hex');
    const reset = {
      token: token,
      userId: userId,
      username: user.username,
      used: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() // 24 hours
    };
    this.data.resetTokens.push(reset);
    this.save();
    return reset;
  }

  resetPasswordWithToken(token, newPassword) {
    const reset = this.data.resetTokens.find(r => r.token === token);
    if (!reset) throw new Error('Invalid reset token.');
    if (reset.used) throw new Error('Reset link already used.');
    if (new Date(reset.expiresAt) < new Date()) throw new Error('Reset link has expired.');

    const user = this.findUserById(reset.userId);
    if (!user) throw new Error('User not found.');

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    reset.used = true;
    reset.usedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // --- EMOJIS & ANIMATED STICKERS ---
  getAllEmojis() {
    return this.data.emojis.filter(e => e.active !== false);
  }

  addEmoji({ label, type, content, mediaData, soundType, soundValue, soundData, size = 48, duration = 5 }) {
    let finalContent = content;
    let finalSoundValue = soundValue;

    // Handle Image / Animated Sticker / WebM Video Upload (Base64 data)
    if (type === 'image' || type === 'animated' || type === 'sticker' || type === 'webm') {
      if (mediaData && mediaData.startsWith('data:')) {
        const matches = mediaData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1].toLowerCase();
          const buffer = Buffer.from(matches[2], 'base64');
          let ext = 'png';
          if (mime.includes('gif')) ext = 'gif';
          else if (mime.includes('webp')) ext = 'webp';
          else if (mime.includes('svg')) ext = 'svg';
          else if (mime.includes('webm') || mime.includes('video')) ext = 'webm';
          else if (mime.includes('mp4')) ext = 'mp4';

          const filename = `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
          const filePath = path.join(EMOJIS_UPLOAD_DIR, filename);
          fs.writeFileSync(filePath, buffer);
          finalContent = `/uploads/emojis/${filename}`;
        }
      }
    }

    // Handle Custom Audio / Voice Upload (Base64 data - MP3, WEBA, WEBM, WAV, OGG, M4A)
    if (soundType === 'custom') {
      if (soundData && soundData.startsWith('data:')) {
        const matches = soundData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1].toLowerCase();
          const buffer = Buffer.from(matches[2], 'base64');
          let ext = 'mp3';
          if (mime.includes('wav')) ext = 'wav';
          else if (mime.includes('ogg') || mime.includes('opus')) ext = 'ogg';
          else if (mime.includes('weba')) ext = 'weba';
          else if (mime.includes('webm')) ext = 'webm';
          else if (mime.includes('m4a') || mime.includes('mp4')) ext = 'm4a';
          else if (mime.includes('aac')) ext = 'aac';

          const filename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
          const filePath = path.join(AUDIO_UPLOAD_DIR, filename);
          fs.writeFileSync(filePath, buffer);
          finalSoundValue = `/uploads/audio/${filename}`;
        }
      }
    }

    const newEmoji = {
      id: `em_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: label ? label.trim() : 'Custom',
      type: type || 'unicode',
      content: finalContent || '✨',
      soundType: soundType || 'preset',
      soundValue: finalSoundValue || 'pop',
      size: Math.max(24, Math.min(120, parseInt(size) || 48)),
      duration: Math.max(1, Math.min(30, parseFloat(duration) || 5)),
      active: true,
      createdAt: new Date().toISOString()
    };

    this.data.emojis.push(newEmoji);
    this.save();
    return newEmoji;
  }

  deleteEmoji(id) {
    this.data.emojis = this.data.emojis.filter(e => e.id !== id);
    this.save();
    return true;
  }

  // --- QUICK CHAT MESSAGES ---
  getAllQuickMessages() {
    return this.data.quickMessages.filter(m => m.active !== false).sort((a, b) => a.order - b.order);
  }

  addQuickMessage(text) {
    if (!text || !text.trim()) throw new Error('Message cannot be empty.');
    const newMsg = {
      id: `qm_${Date.now()}`,
      text: text.trim().slice(0, 80),
      order: this.data.quickMessages.length + 1,
      active: true
    };
    this.data.quickMessages.push(newMsg);
    this.save();
    return newMsg;
  }

  deleteQuickMessage(id) {
    this.data.quickMessages = this.data.quickMessages.filter(m => m.id !== id);
    this.save();
    return true;
  }

  // --- MATCH HISTORY ---
  recordMatch(matchData) {
    const record = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      roomCode: matchData.roomCode,
      startedAt: matchData.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      players: matchData.players || [],
      winner: matchData.winner || null,
      turnsCount: matchData.turnsCount || 0,
      durationSec: matchData.durationSec || 0
    };
    this.data.matches.unshift(record);
    // Keep last 500 matches
    if (this.data.matches.length > 500) {
      this.data.matches = this.data.matches.slice(0, 500);
    }
    this.save();
    return record;
  }

  getAllMatches() {
    return this.data.matches || [];
  }

  getUserMatches(userId, username) {
    return (this.data.matches || []).filter(m => 
      m.players.some(p => p.userId === userId || p.name === username)
    );
  }
}

const db = new Database();

module.exports = {
  db,
  verifyPassword,
  hashPassword
};
