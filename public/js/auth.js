// Ludo Master Pro - User Authentication & Admin Management Engine (Font Awesome & WebM Edition)
(function() {
  const TOKEN_KEY = 'ludo_auth_token';
  window.currentUser = null;

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
  }

  function setCookie(name, val, days = 14) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(val)}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
  }

  function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || getCookie('ludo_auth_token');
  }

  function setAuthToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      setCookie('ludo_auth_token', token, 14);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      deleteCookie('ludo_auth_token');
    }
  }

  async function apiFetch(url, options = {}) {
    const headers = options.headers || {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    options.headers = headers;

    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed with status ' + res.status);
    }
    return data;
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('sys-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = isError ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0284c7, #2563eb)';
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3200);

    const gameAction = document.getElementById('game-status-action');
    if (gameAction && msg) {
      gameAction.textContent = msg;
    }
  }
  window.showGlobalToast = showToast;

  function copyTextToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopyText(text, successMsg);
      });
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  function fallbackCopyText(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      prompt('Copy this link:', text);
    }
    document.body.removeChild(ta);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // Visual Renderer for Font Awesome, WebM Videos, Image Stickers & Emojis
  // -------------------------------------------------------------
  function renderEmojiVisual(data, size = 48) {
    if (!data) return `<span style="font-size:${size}px;">⭐</span>`;
    const isObj = typeof data === 'object';
    const type = isObj ? (data.type || 'unicode') : 'unicode';
    const content = isObj ? (data.content || data.emoji || data.value || '') : String(data);
    const mediaUrl = isObj ? (data.mediaUrl || (content.startsWith('/') || content.startsWith('http') || content.startsWith('data:') ? content : null)) : null;

    // 1. WebM/MP4 Video Animated Sticker
    const isWebm = (mediaUrl && (mediaUrl.includes('.webm') || mediaUrl.includes('.mp4'))) || (content && (content.includes('.webm') || content.includes('.mp4'))) || (mediaUrl && mediaUrl.startsWith('data:video/'));
    if (isWebm) {
      const src = mediaUrl || content;
      return `<video autoplay loop muted playsinline preload="auto" src="${src}" style="width:${size}px; height:${size}px; object-fit:contain; pointer-events:none; display:block;"></video>`;
    }

    // 2. Image / GIF / SVG Sticker
    if (type === 'sticker' || type === 'image' || type === 'animated' || (mediaUrl && (mediaUrl.includes('.png') || mediaUrl.includes('.gif') || mediaUrl.includes('.webp') || mediaUrl.includes('.svg') || mediaUrl.startsWith('data:image')))) {
      const src = mediaUrl || content;
      return `<img src="${src}" style="width:${size}px; height:${size}px; object-fit:contain; pointer-events:none; display:block;">`;
    }

    // 3. Font Awesome Icon
    const isFontAwesome = type === 'fontawesome' || content.startsWith('fa-') || content.includes('fa-solid') || content.includes('fa-regular') || content.includes('fa-brands');
    if (isFontAwesome) {
      let iconClass = content.trim();
      if (!iconClass.includes('fa-solid') && !iconClass.includes('fa-regular') && !iconClass.includes('fa-brands')) {
        iconClass = `fa-solid ${iconClass}`;
      }
      let colorStyle = '#ffd700';
      if (iconClass.includes('fire')) colorStyle = '#ff4500';
      else if (iconClass.includes('heart')) colorStyle = '#ff1744';
      else if (iconClass.includes('shield')) colorStyle = '#00e676';
      else if (iconClass.includes('rocket')) colorStyle = '#ff5722';
      else if (iconClass.includes('bolt')) colorStyle = '#ffeb3b';
      else if (iconClass.includes('champagne') || iconClass.includes('party')) colorStyle = '#38bdf8';
      else if (iconClass.includes('dice')) colorStyle = '#ffffff';
      else if (iconClass.includes('skull')) colorStyle = '#cbd5e1';

      return `<i class="${iconClass}" style="font-size:${size}px; color:${colorStyle}; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));"></i>`;
    }

    // 4. Fallback Unicode Text
    return `<span style="font-size:${size}px; line-height:1;">${escapeHtml(content) || '⭐'}</span>`;
  }
  window.renderEmojiVisual = renderEmojiVisual;

  // -------------------------------------------------------------
  // Topbar Rendering
  // -------------------------------------------------------------
  function renderUserHeader() {
    const container = document.getElementById('topbar-user-section');
    if (!container) return;

    // Preserve sound toggle button
    const soundBtn = document.getElementById('btn-sound-toggle-lobby');

    container.innerHTML = '';

    if (window.currentUser) {
      const u = window.currentUser;
      const roleClass = `role-${u.role}`;
      const roleLabel = u.role === 'super_admin' ? 'Super Admin' : (u.role === 'general_admin' ? 'Admin' : 'Player');

      // Admin button for super_admin and general_admin
      if (u.role === 'super_admin' || u.role === 'general_admin') {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'btn-open-admin';
        adminBtn.className = 'btn-topbar-pill admin-active';
        adminBtn.innerHTML = `<i class="fa-solid fa-gear"></i><span>Admin</span>`;
        adminBtn.onclick = () => openAdminModal();
        container.appendChild(adminBtn);
      }

      // User profile button
      const userBtn = document.createElement('button');
      userBtn.id = 'btn-open-profile';
      userBtn.className = 'btn-topbar-pill';
      userBtn.title = 'View / Edit Profile';
      userBtn.innerHTML = `
        <span style="font-size:14px;"><i class="fa-solid fa-user"></i></span>
        <span>${escapeHtml(u.displayName || u.name || u.username)}</span>
        <span class="role-pill ${roleClass}">${roleLabel}</span>
      `;
      userBtn.onclick = () => openProfileModal();
      container.appendChild(userBtn);

      // Pre-fill name input in lobby
      const inputPlayerName = document.getElementById('input-player-name');
      if (inputPlayerName) {
        inputPlayerName.value = u.displayName || u.name || u.username;
      }
    } else {
      // Guest: show Sign In button
      const loginBtn = document.createElement('button');
      loginBtn.id = 'btn-open-auth';
      loginBtn.className = 'btn-topbar-pill';
      loginBtn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i><span>Sign In</span>`;
      loginBtn.onclick = () => openAuthModal('login');
      container.appendChild(loginBtn);
    }

    if (soundBtn) {
      container.appendChild(soundBtn);
    } else {
      const newSoundBtn = document.createElement('button');
      newSoundBtn.id = 'btn-sound-toggle-lobby';
      newSoundBtn.className = 'btn-topbar-icon';
      newSoundBtn.title = 'Toggle Sound';
      newSoundBtn.innerHTML = (window.sounds && window.sounds.enabled) ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      newSoundBtn.onclick = () => {
        if (window.sounds) {
          window.sounds.enabled = !window.sounds.enabled;
          newSoundBtn.innerHTML = window.sounds.enabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        }
      };
      container.appendChild(newSoundBtn);
    }
  }

  // -------------------------------------------------------------
  // Modals Open / Close Helpers
  // -------------------------------------------------------------
  function openAuthModal(view = 'login', tokenVal = '') {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;
    modal.classList.remove('hidden');

    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const viewLogin = document.getElementById('auth-view-login');
    const viewRegister = document.getElementById('auth-view-register');
    const viewReset = document.getElementById('auth-view-reset');
    const tabsRow = document.getElementById('auth-tabs-row');

    if (view === 'reset') {
      tabsRow.classList.add('hidden');
      viewLogin.classList.add('hidden');
      viewRegister.classList.add('hidden');
      viewReset.classList.remove('hidden');
      const resetTokenInput = document.getElementById('reset-token-input');
      if (resetTokenInput) resetTokenInput.value = tokenVal;
      document.getElementById('auth-modal-title').textContent = 'Reset Account Password';
    } else if (view === 'register') {
      tabsRow.classList.remove('hidden');
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
      viewLogin.classList.add('hidden');
      viewRegister.classList.remove('hidden');
      viewReset.classList.add('hidden');
      document.getElementById('auth-modal-title').textContent = 'Register New Account';
      if (tokenVal) {
        const regToken = document.getElementById('reg-invite-token');
        if (regToken) regToken.value = tokenVal;
      }
    } else {
      tabsRow.classList.remove('hidden');
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      viewLogin.classList.remove('hidden');
      viewRegister.classList.add('hidden');
      viewReset.classList.add('hidden');
      document.getElementById('auth-modal-title').textContent = 'Sign In to Ludo PRO';
    }
  }

  function closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('hidden');
  }

  function openProfileModal() {
    if (!window.currentUser) return;
    const modal = document.getElementById('modal-profile');
    if (!modal) return;
    modal.classList.remove('hidden');

    const u = window.currentUser;
    const avatarDisplay = document.getElementById('profile-avatar-display');
    const nameDisplay = document.getElementById('profile-display-name');
    const rolePill = document.getElementById('profile-role-pill');
    const inputName = document.getElementById('profile-input-name');
    const inputAvatar = document.getElementById('profile-input-avatar');
    const inputPass = document.getElementById('profile-input-password');

    if (avatarDisplay) avatarDisplay.innerHTML = `<i class="fa-solid fa-user"></i>`;
    if (nameDisplay) nameDisplay.textContent = u.displayName || u.name || u.username;
    if (rolePill) {
      rolePill.className = `role-pill role-${u.role}`;
      rolePill.textContent = u.role === 'super_admin' ? 'Super Admin' : (u.role === 'general_admin' ? 'Admin' : 'Player');
    }
    if (inputName) inputName.value = u.displayName || u.name || u.username;
    if (inputAvatar) inputAvatar.value = u.avatar || '🎮';
    if (inputPass) inputPass.value = '';
  }

  function closeProfileModal() {
    const modal = document.getElementById('modal-profile');
    if (modal) modal.classList.add('hidden');
  }

  function openAdminModal() {
    if (!window.currentUser || (window.currentUser.role !== 'super_admin' && window.currentUser.role !== 'general_admin')) {
      showToast('Admin privileges required!', true);
      return;
    }

    const modal = document.getElementById('modal-admin-dashboard');
    if (!modal) return;
    modal.classList.remove('hidden');

    const u = window.currentUser;
    const roleBadge = document.getElementById('admin-header-role');
    if (roleBadge) {
      roleBadge.className = `role-pill role-${u.role}`;
      roleBadge.textContent = u.role === 'super_admin' ? 'Super Admin' : 'General Admin';
    }

    // Toggle super-admin-only visibility
    document.querySelectorAll('.super-admin-only').forEach(el => {
      if (u.role === 'super_admin') {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Default activate first tab: users
    switchAdminTab('tab-users');
  }

  function closeAdminModal() {
    const modal = document.getElementById('modal-admin-dashboard');
    if (modal) modal.classList.add('hidden');
  }

  function switchAdminTab(targetTabId) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
      if (btn.dataset.tab === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
      if (content.id === targetTabId) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });

    if (targetTabId === 'tab-users') loadAdminUsers();
    else if (targetTabId === 'tab-invites') loadAdminInvites();
    else if (targetTabId === 'tab-emojis') loadAdminEmojis();
    else if (targetTabId === 'tab-messages') loadAdminPhrases();
    else if (targetTabId === 'tab-history') loadAdminHistory();
  }

  // -------------------------------------------------------------
  // Admin Data Loaders
  // -------------------------------------------------------------
  async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-list');
    const counter = document.getElementById('users-counter');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#94a3b8;">Loading users...</td></tr>';

    try {
      const data = await apiFetch('/api/admin/users');
      const users = (Array.isArray(data) ? data : (data.users || [])).slice().reverse();
      if (counter) counter.textContent = `Total Users: ${users.length}`;

      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#64748b;">No registered users found.</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => {
        const rolePill = `<span class="role-pill role-${u.role}">${u.role.replace('_', ' ')}</span>`;
        const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-';
        const isSelf = window.currentUser && window.currentUser.id === u.id;
        return `
          <tr>
            <td>
              <div style="font-weight:600; color:#fff;">${escapeHtml(u.displayName || u.name || u.username)}</div>
              <div style="font-size:11px; color:#94a3b8;">@${escapeHtml(u.username)} ${u.email ? '• ' + escapeHtml(u.email) : ''}</div>
            </td>
            <td>${rolePill}</td>
            <td style="font-size:11px; color:#94a3b8;">${dateStr}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="sys-btn-action btn-gen-reset" data-uid="${u.id}" data-name="${escapeHtml(u.displayName || u.name || u.username)}"><i class="fa-solid fa-key"></i> Reset</button>
                ${!isSelf ? `<button class="sys-btn-danger btn-delete-user" data-uid="${u.id}" data-name="${escapeHtml(u.displayName || u.name || u.username)}"><i class="fa-solid fa-trash"></i></button>` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-gen-reset').forEach(btn => {
        btn.onclick = async () => {
          const uid = btn.dataset.uid;
          const name = btn.dataset.name;
          try {
            const res = await apiFetch('/api/admin/reset-link', {
              method: 'POST',
              body: { userId: uid }
            });
            copyTextToClipboard(res.resetUrl, `Password reset link for ${name} copied to clipboard!`);
          } catch(err) {
            showToast(err.message, true);
          }
        };
      });

      tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.onclick = async () => {
          const uid = btn.dataset.uid;
          const name = btn.dataset.name;
          if (!confirm(`Are you sure you want to delete user "${name}"? This cannot be undone.`)) return;

          try {
            await apiFetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
            showToast(`User ${name} deleted successfully!`);
            loadAdminUsers();
          } catch(err) {
            showToast(err.message, true);
          }
        };
      });

    } catch(err) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444; padding:15px; text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function loadAdminInvites() {
    const tbody = document.getElementById('admin-invites-list');
    const counter = document.getElementById('invites-counter');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#94a3b8;">Loading invites...</td></tr>';

    try {
      const data = await apiFetch('/api/admin/invite-links');
      const rawInvites = Array.isArray(data) ? data : (data.invites || []);
      const invites = rawInvites.slice().reverse();
      const activeCount = invites.filter(i => (!i.used && !i.isUsed) && new Date(i.expiresAt) > new Date()).length;
      if (counter) counter.textContent = `Active Links: ${activeCount}`;

      if (invites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#64748b;">No invite links created yet.</td></tr>';
        return;
      }

      tbody.innerHTML = invites.map(inv => {
        const isExpired = new Date(inv.expiresAt) < new Date();
        const isUsed = Boolean(inv.used || inv.isUsed);
        const statusBadge = isUsed 
          ? '<span style="color:#ef4444; font-size:11px; font-weight:600;">Used</span>'
          : (isExpired ? '<span style="color:#f59e0b; font-size:11px;">Expired</span>' : '<span style="color:#10b981; font-weight:700;">Active</span>');

        const inviteUrl = `${window.location.origin}/?invite=${inv.token}`;

        return `
          <tr>
            <td>
              <span class="token-code">${inv.token.substring(0, 14)}...</span>
              <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Expires: ${new Date(inv.expiresAt).toLocaleDateString()}</div>
            </td>
            <td><span class="role-pill role-${inv.role}">${inv.role}</span></td>
            <td>${statusBadge}</td>
            <td>
              ${!isUsed && !isExpired ? `<button class="sys-btn-action btn-copy-inv" data-url="${inviteUrl}"><i class="fa-solid fa-copy"></i> Copy Link</button>` : '<span style="color:#64748b; font-size:11px;">-</span>'}
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-copy-inv').forEach(btn => {
        btn.onclick = () => {
          copyTextToClipboard(btn.dataset.url, 'Invite registration link copied!');
        };
      });

    } catch(err) {
      tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444; padding:15px; text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function loadAdminEmojis() {
    const grid = document.getElementById('admin-emojis-grid');
    const counter = document.getElementById('emojis-counter');
    if (!grid) return;
    grid.innerHTML = '<div style="color:#94a3b8; grid-column:1/-1; text-align:center; padding:20px;">Loading emojis...</div>';

    try {
      const data = await apiFetch('/api/admin/emojis');
      const emojis = Array.isArray(data) ? data : (data.emojis || []);
      if (counter) counter.textContent = `Active Emojis: ${emojis.length}`;

      if (emojis.length === 0) {
        grid.innerHTML = '<div style="color:#64748b; grid-column:1/-1; text-align:center; padding:20px;">No custom emojis found.</div>';
        return;
      }

      grid.innerHTML = emojis.map(em => {
        const visual = renderEmojiVisual(em, em.size || 48);
        const soundLabel = em.soundType === 'custom' ? '🎵 Custom Voice' : `🔊 ${em.soundValue}`;
        const durLabel = `${em.duration || 5}s`;

        return `
          <div class="emoji-admin-card">
            <div class="emoji-admin-visual">${visual}</div>
            <div class="emoji-admin-name">${escapeHtml(em.label || em.name)}</div>
            <div class="emoji-admin-meta">${durLabel} • ${em.size || 48}px • ${soundLabel}</div>
            <div style="display:flex; gap:6px; margin-top:4px;">
              <button class="btn-sm-secondary btn-test-em-sound" data-stype="${em.soundType}" data-sval="${escapeHtml(em.soundValue)}" data-dur="${em.duration || 5}">🔊 Test</button>
              <button class="sys-btn-danger btn-delete-emoji" data-eid="${em.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('video').forEach(v => {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.play().catch(() => {});
      });

      grid.querySelectorAll('.btn-test-em-sound').forEach(btn => {
        btn.onclick = () => {
          if (window.sounds) {
            const durMs = (parseFloat(btn.dataset.dur) || 5) * 1000;
            window.sounds.playEmojiSound(btn.dataset.stype, btn.dataset.sval, durMs);
          }
        };
      });

      grid.querySelectorAll('.btn-delete-emoji').forEach(btn => {
        btn.onclick = async () => {
          const eid = btn.dataset.eid;
          if (!confirm('Remove this emoji from the reaction dock?')) return;
          try {
            await apiFetch(`/api/admin/emojis/${eid}`, { method: 'DELETE' });
            showToast('Emoji removed!');
            loadAdminEmojis();
            loadGameEmojis();
          } catch(err) {
            showToast(err.message, true);
          }
        };
      });

    } catch(err) {
      grid.innerHTML = `<div style="color:#ef4444; grid-column:1/-1; text-align:center; padding:20px;">${escapeHtml(err.message)}</div>`;
    }
  }

  async function loadAdminPhrases() {
    const list = document.getElementById('admin-phrases-list');
    if (!list) return;
    list.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:15px;">Loading phrases...</div>';

    try {
      const data = await apiFetch('/api/admin/quick-messages');
      const phrases = Array.isArray(data) ? data : (data.messages || []);

      if (phrases.length === 0) {
        list.innerHTML = '<div style="color:#64748b; text-align:center; padding:15px;">No quick chat phrases configured.</div>';
        return;
      }

      list.innerHTML = phrases.map(p => `
        <div class="phrase-item">
          <span class="phrase-text">${escapeHtml(p.text)}</span>
          <button class="sys-btn-danger btn-delete-phrase" data-pid="${p.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('');

      list.querySelectorAll('.btn-delete-phrase').forEach(btn => {
        btn.onclick = async () => {
          try {
            await apiFetch(`/api/admin/quick-messages/${btn.dataset.pid}`, { method: 'DELETE' });
            showToast('Phrase removed!');
            loadAdminPhrases();
            loadGameQuickMessages();
          } catch(err) {
            showToast(err.message, true);
          }
        };
      });

    } catch(err) {
      list.innerHTML = `<div style="color:#ef4444; text-align:center; padding:15px;">${escapeHtml(err.message)}</div>`;
    }
  }

  async function loadAdminHistory() {
    const tbody = document.getElementById('admin-history-list');
    const counter = document.getElementById('history-counter');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#94a3b8;">Loading match history...</td></tr>';

    try {
      const data = await apiFetch('/api/admin/match-history');
      const matches = (Array.isArray(data) ? data : (data.matches || [])).slice().reverse();
      if (counter) counter.textContent = `Matches Played: ${matches.length}`;

      if (matches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#64748b;">No finished matches recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = matches.map(m => {
        const playersList = (m.players || []).map(p => escapeHtml(p.name)).join(', ');
        const dateStr = m.timestamp ? new Date(m.timestamp).toLocaleString() : '-';
        const mins = Math.floor((m.durationSeconds || 0) / 60);
        const secs = (m.durationSeconds || 0) % 60;
        const durStr = `${mins}m ${secs}s`;

        return `
          <tr>
            <td><strong style="color:#38bdf8;">${escapeHtml(m.roomCode)}</strong></td>
            <td><span style="font-weight:700; color:#10b981;">🏆 ${escapeHtml(m.winner ? m.winner.name : 'Unknown')}</span></td>
            <td style="font-size:11px; color:#cbd5e1;">${playersList}</td>
            <td style="text-align:center;">${m.turns || 0}</td>
            <td style="font-size:11px; color:#94a3b8;">${durStr}</td>
            <td style="font-size:11px; color:#94a3b8;">${dateStr}</td>
          </tr>
        `;
      }).join('');

    } catch(err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; padding:15px; text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // -------------------------------------------------------------
  // Dynamic Game Emojis & Quick Messages Dock Loaders
  // -------------------------------------------------------------
  async function loadGameEmojis() {
    const dockGrid = document.querySelector('.rm-emoji-grid');
    if (!dockGrid) return;

    try {
      const res = await fetch('/api/emojis');
      const emojis = await res.json();
      if (!Array.isArray(emojis) || emojis.length === 0) return;

      dockGrid.innerHTML = '';
      const isCurrentlyCooling = typeof window.isEmojiOnCooldown === 'function' && window.isEmojiOnCooldown();
      emojis.forEach(em => {
        const btn = document.createElement('button');
        btn.className = 'rm-emoji-btn';
        if (isCurrentlyCooling) {
          btn.disabled = true;
          btn.classList.add('disabled');
        }
        btn.title = em.label || em.name || 'Emoji';
        btn.innerHTML = renderEmojiVisual(em, 26);

        const btnVid = btn.querySelector('video');
        if (btnVid) {
          btnVid.muted = true;
          btnVid.defaultMuted = true;
          btnVid.playsInline = true;
          btnVid.play().catch(() => {});
        }

        btn.onclick = () => {
          const dur = parseFloat(em.duration) || 5;
          const payload = {
            emoji: em.content || em.label,
            content: em.content || em.label,
            type: em.type,
            mediaUrl: (em.content && (em.content.startsWith('/') || em.content.startsWith('http') || em.content.startsWith('data:'))) ? em.content : null,
            size: em.size || 48,
            duration: dur,
            soundType: em.soundType || 'preset',
            soundValue: em.soundValue || 'pop'
          };
          if (typeof window.triggerPlayerEmoji === 'function') {
            window.triggerPlayerEmoji(payload);
          } else {
            if (window.socket) {
              window.socket.emit('send_emoji', payload);
            }
            if (typeof window.spawnFloatingEmoji === 'function') {
              window.spawnFloatingEmoji(window.myColor || 'blue', payload);
            }
            if (window.sounds) {
              window.sounds.playEmojiSound(payload.soundType, payload.soundValue, dur * 1000);
            }
            const dock = document.getElementById('emoji-reaction-dock');
            if (dock) dock.classList.add('hidden');
          }
        };

        dockGrid.appendChild(btn);
      });
    } catch(err) {
      console.warn('Failed to load active emojis:', err);
    }
  }
  window.loadGameEmojis = loadGameEmojis;

  async function loadGameQuickMessages() {
    const container = document.querySelector('.quick-phrase-row');
    if (!container) return;

    try {
      const res = await fetch('/api/quick-messages');
      const phrases = await res.json();
      if (!Array.isArray(phrases) || phrases.length === 0) return;

      container.innerHTML = '';
      phrases.forEach(p => {
        const span = document.createElement('span');
        span.className = 'rx-pill';
        span.textContent = p.text;
        span.onclick = () => {
          if (window.socket) {
            window.socket.emit('send_chat', { text: p.text });
          }
          const drawer = document.getElementById('modal-menu');
          if (drawer) drawer.classList.add('hidden');
        };
        container.appendChild(span);
      });
    } catch(err) {
      console.warn('Failed to load active quick messages:', err);
    }
  }
  window.loadGameQuickMessages = loadGameQuickMessages;

  // -------------------------------------------------------------
  // Emoji / Sticker Creator Modal Controller (Super Admin)
  // -------------------------------------------------------------
  let creatorStickerData = null;
  let creatorAudioData = null;
  let creatorDisplaySize = 48;
  let creatorDisplayDuration = 5;

  function initEmojiCreator() {
    const modal = document.getElementById('modal-add-emoji');
    const selectType = document.getElementById('emoji-select-type');
    const groupFa = document.getElementById('group-emoji-fa');
    const selectFa = document.getElementById('emoji-select-fa');
    const inputCustomFa = document.getElementById('emoji-custom-fa-input');
    const groupUnicode = document.getElementById('group-emoji-unicode');
    const groupFile = document.getElementById('group-emoji-file');
    const inputChar = document.getElementById('emoji-input-char');
    const inputFile = document.getElementById('emoji-file-input');
    const selectSoundType = document.getElementById('emoji-select-sound-type');
    const groupSoundPreset = document.getElementById('group-sound-preset');
    const groupSoundCustom = document.getElementById('group-sound-custom');
    const selectPreset = document.getElementById('emoji-select-preset');
    const btnTestPreset = document.getElementById('btn-preview-preset-sound');
    const inputAudio = document.getElementById('emoji-audio-file');
    const btnTestCustomAudio = document.getElementById('btn-preview-custom-audio');
    const sliderSize = document.getElementById('emoji-size-slider');
    const sizeDisplay = document.getElementById('preview-size-display');
    const previewElement = document.getElementById('emoji-preview-element');
    const btnSave = document.getElementById('btn-save-new-emoji');
    const btnClose = document.getElementById('btn-close-emoji-creator');
    const backdrop = document.getElementById('emoji-creator-backdrop');

    if (!modal) return;

    function updateLivePreview() {
      const type = selectType ? selectType.value : 'fontawesome';
      if (sizeDisplay) sizeDisplay.textContent = `${creatorDisplaySize}px`;

      if (type === 'fontawesome') {
        const faVal = selectFa.value === 'custom' ? (inputCustomFa.value || 'fa-solid fa-fire') : selectFa.value;
        previewElement.innerHTML = renderEmojiVisual({ type: 'fontawesome', content: faVal }, creatorDisplaySize);
        previewElement.style.width = 'auto';
        previewElement.style.height = 'auto';
      } else if (type === 'unicode') {
        const ch = (inputChar.value || '⭐').trim() || '⭐';
        previewElement.innerHTML = renderEmojiVisual({ type: 'unicode', content: ch }, creatorDisplaySize);
        previewElement.style.width = 'auto';
        previewElement.style.height = 'auto';
      } else {
        if (creatorStickerData) {
          previewElement.innerHTML = renderEmojiVisual({ type: 'sticker', content: creatorStickerData }, creatorDisplaySize);
          const pv = previewElement.querySelector('video');
          if (pv) {
            pv.muted = true;
            pv.defaultMuted = true;
            pv.playsInline = true;
            pv.play().catch(() => {});
          }
        } else {
          previewElement.innerHTML = `<span style="font-size:${creatorDisplaySize}px;">🖼️</span>`;
        }
        previewElement.style.width = `${creatorDisplaySize}px`;
        previewElement.style.height = `${creatorDisplaySize}px`;
      }
    }

    if (selectType) {
      selectType.onchange = () => {
        const type = selectType.value;
        if (type === 'fontawesome') {
          if (groupFa) groupFa.classList.remove('hidden');
          if (groupUnicode) groupUnicode.classList.add('hidden');
          if (groupFile) groupFile.classList.add('hidden');
        } else if (type === 'unicode') {
          if (groupFa) groupFa.classList.add('hidden');
          if (groupUnicode) groupUnicode.classList.remove('hidden');
          if (groupFile) groupFile.classList.add('hidden');
        } else {
          if (groupFa) groupFa.classList.add('hidden');
          if (groupUnicode) groupUnicode.classList.add('hidden');
          if (groupFile) groupFile.classList.remove('hidden');
        }
        updateLivePreview();
      };
    }

    if (selectFa) {
      selectFa.onchange = () => {
        if (selectFa.value === 'custom') {
          if (inputCustomFa) inputCustomFa.classList.remove('hidden');
        } else {
          if (inputCustomFa) inputCustomFa.classList.add('hidden');
        }
        updateLivePreview();
      };
    }

    if (inputCustomFa) {
      inputCustomFa.oninput = () => updateLivePreview();
    }

    if (inputChar) {
      inputChar.oninput = () => updateLivePreview();
    }

    if (inputFile) {
      inputFile.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          creatorStickerData = evt.target.result;
          updateLivePreview();
        };
        reader.readAsDataURL(file);
      };
    }

    if (selectSoundType) {
      selectSoundType.onchange = () => {
        const stype = selectSoundType.value;
        if (stype === 'preset') {
          groupSoundPreset.classList.remove('hidden');
          groupSoundCustom.classList.add('hidden');
        } else {
          groupSoundPreset.classList.add('hidden');
          groupSoundCustom.classList.remove('hidden');
        }
      };
    }

    if (btnTestPreset && selectPreset) {
      btnTestPreset.onclick = () => {
        if (window.sounds) {
          window.sounds.playEmojiSound('preset', selectPreset.value);
        }
      };
    }

    const sliderDuration = document.getElementById('emoji-duration-slider');
    const durationDisplay = document.getElementById('preview-duration-display');

    if (sliderDuration) {
      sliderDuration.oninput = (e) => {
        creatorDisplayDuration = parseFloat(e.target.value) || 5;
        if (durationDisplay) durationDisplay.textContent = `${creatorDisplayDuration}s`;
      };
    }

    if (inputAudio) {
      inputAudio.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          creatorAudioData = evt.target.result;
          if (btnTestCustomAudio) btnTestCustomAudio.classList.remove('hidden');

          // Auto-detect audio file duration and prefill slider!
          const probeAudio = new Audio();
          probeAudio.src = evt.target.result;
          probeAudio.onloadedmetadata = () => {
            if (probeAudio.duration && probeAudio.duration > 0 && !isNaN(probeAudio.duration)) {
              const detected = Math.min(15, Math.max(1, Math.round(probeAudio.duration * 10) / 10));
              creatorDisplayDuration = detected;
              if (sliderDuration) sliderDuration.value = detected;
              if (durationDisplay) durationDisplay.textContent = `${detected}s`;
            }
          };
        };
        reader.readAsDataURL(file);
      };
    }

    if (btnTestCustomAudio) {
      btnTestCustomAudio.onclick = () => {
        if (creatorAudioData && window.sounds) {
          window.sounds.playCustomAudio(creatorAudioData, creatorDisplayDuration * 1000);
        }
      };
    }

    if (sliderSize) {
      sliderSize.oninput = (e) => {
        creatorDisplaySize = parseInt(e.target.value, 10) || 48;
        updateLivePreview();
      };
    }

    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (backdrop) backdrop.onclick = () => modal.classList.add('hidden');

    if (btnSave) {
      btnSave.onclick = async () => {
        const label = (document.getElementById('emoji-input-label').value || '').trim();
        const type = selectType.value;
        const soundType = selectSoundType.value;
        const soundPreset = selectPreset.value;

        if (!label) {
          showToast('Please provide a label name for the emoji', true);
          return;
        }

        let contentVal = '';
        let mediaDataVal = null;

        if (type === 'fontawesome') {
          contentVal = selectFa.value === 'custom' ? (inputCustomFa.value || '').trim() : selectFa.value;
          if (!contentVal) {
            showToast('Please select or enter a Font Awesome icon class', true);
            return;
          }
        } else if (type === 'unicode') {
          contentVal = (inputChar.value || '⭐').trim();
        } else {
          if (!creatorStickerData) {
            showToast('Please select a sticker or WebM file', true);
            return;
          }
          mediaDataVal = creatorStickerData;
        }

        if (soundType === 'custom' && !creatorAudioData) {
          showToast('Please upload a custom audio file (MP3, WAV, OGG)', true);
          return;
        }

        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';

        try {
          await apiFetch('/api/admin/emojis', {
            method: 'POST',
            body: {
              label: label,
              type: type === 'fontawesome' ? 'fontawesome' : (type === 'unicode' ? 'unicode' : 'sticker'),
              content: contentVal,
              mediaData: mediaDataVal,
              soundType: soundType,
              soundValue: soundPreset,
              soundData: soundType === 'custom' ? creatorAudioData : null,
              size: creatorDisplaySize,
              duration: creatorDisplayDuration
            }
          });

          showToast('Emoji / Sticker created successfully!');
          modal.classList.add('hidden');

          // Reset fields
          document.getElementById('emoji-input-label').value = '';
          creatorStickerData = null;
          creatorAudioData = null;
          if (btnTestCustomAudio) btnTestCustomAudio.classList.add('hidden');

          loadAdminEmojis();
          loadGameEmojis();
        } catch(err) {
          showToast(err.message, true);
        } finally {
          btnSave.disabled = false;
          btnSave.textContent = 'Save Emoji / Sticker';
        }
      };
    }
  }

  // -------------------------------------------------------------
  // Initialization & Event Attachments
  // -------------------------------------------------------------
  async function initAuth() {
    const token = getAuthToken();
    const screenLogin = document.getElementById('screen-login');
    const screenLobby = document.getElementById('screen-lobby');

    if (token) {
      try {
        setAuthToken(token);
        const res = await apiFetch('/api/auth/me');
        if (res && res.user) {
          window.currentUser = res.user;
          const nameInput = document.getElementById('input-player-name');
          if (nameInput) nameInput.value = res.user.name || res.user.username;
          if (screenLogin) screenLogin.classList.add('hidden');
          if (screenLobby) screenLobby.classList.remove('hidden');
        } else {
          throw new Error('Invalid session');
        }
      } catch(e) {
        setAuthToken(null);
        window.currentUser = null;
        if (screenLogin) screenLogin.classList.remove('hidden');
        if (screenLobby) screenLobby.classList.add('hidden');
      }
    } else {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get('invite');
      const resetParam = params.get('reset');
      const roomParam = params.get('room') || params.get('join') || params.get('code');

      if (inviteParam) {
        if (screenLogin) screenLogin.classList.add('hidden');
        if (screenLobby) screenLobby.classList.remove('hidden');
        openAuthModal('register', inviteParam);
      } else if (resetParam) {
        if (screenLogin) screenLogin.classList.add('hidden');
        if (screenLobby) screenLobby.classList.remove('hidden');
        openAuthModal('reset', resetParam);
      } else if (roomParam) {
        const targetCode = roomParam.toUpperCase().trim();
        if (screenLogin) screenLogin.classList.add('hidden');
        if (screenLobby) screenLobby.classList.remove('hidden');
        const codeInput = document.getElementById('input-room-code');
        if (codeInput) codeInput.value = targetCode;
        showToast(`Room ${targetCode} invite loaded!`);
      } else {
        if (screenLogin) screenLogin.classList.remove('hidden');
        if (screenLobby) screenLobby.classList.add('hidden');
      }
    }

    renderUserHeader();
    loadGameEmojis();
    loadGameQuickMessages();
  }

  // Setup DOM listeners once ready
  function setupDomListeners() {
    // Auth Modal Tabs
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const viewLogin = document.getElementById('auth-view-login');
    const viewRegister = document.getElementById('auth-view-register');
    const viewReset = document.getElementById('auth-view-reset');
    const btnCloseAuth = document.getElementById('btn-close-auth');
    const authBackdrop = document.getElementById('auth-backdrop');

    if (tabLogin) {
      tabLogin.onclick = () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        viewLogin.classList.remove('hidden');
        viewRegister.classList.add('hidden');
        viewReset.classList.add('hidden');
      };
    }

    if (tabRegister) {
      tabRegister.onclick = () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        viewRegister.classList.remove('hidden');
        viewLogin.classList.add('hidden');
        viewReset.classList.add('hidden');
      };
    }

    if (btnCloseAuth) btnCloseAuth.onclick = closeAuthModal;
    if (authBackdrop) authBackdrop.onclick = closeAuthModal;

    // 0. FIRST LOGIN SCREEN HANDLERS
    const btnFirstLogin = document.getElementById('btn-first-login-submit');
    const inputFirstName = document.getElementById('first-login-name');
    const inputFirstPass = document.getElementById('first-login-password');
    const btnQuickGuest = document.getElementById('btn-quick-guest');

    if (btnFirstLogin) {
      const doFirstLogin = async () => {
        const name = (inputFirstName.value || '').trim();
        const password = inputFirstPass.value || '';
        if (!name || !password) {
          showToast('Please enter your name and password', true);
          return;
        }
        try {
          btnFirstLogin.disabled = true;
          btnFirstLogin.innerHTML = '<span>Signing In...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
          const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: { name, password }
          });
          setAuthToken(res.token);
          window.currentUser = res.user;
          const nameInput = document.getElementById('input-player-name');
          if (nameInput) nameInput.value = res.user.name || res.user.username;
          renderUserHeader();
          showToast(`Welcome back, ${res.user.name}!`);

          const screenLogin = document.getElementById('screen-login');
          const screenLobby = document.getElementById('screen-lobby');
          if (screenLogin) screenLogin.classList.add('hidden');
          if (screenLobby) screenLobby.classList.remove('hidden');
        } catch(err) {
          showToast(err.message || 'Invalid name or password', true);
        } finally {
          btnFirstLogin.disabled = false;
          btnFirstLogin.innerHTML = '<span>Sign In to Account</span> <i class="fa-solid fa-arrow-right"></i>';
        }
      };

      btnFirstLogin.onclick = doFirstLogin;
      if (inputFirstPass) {
        inputFirstPass.onkeydown = (e) => {
          if (e.key === 'Enter') doFirstLogin();
        };
      }
      if (inputFirstName) {
        inputFirstName.onkeydown = (e) => {
          if (e.key === 'Enter') inputFirstPass.focus();
        };
      }
    }

    if (btnQuickGuest) {
      btnQuickGuest.onclick = () => {
        const screenLogin = document.getElementById('screen-login');
        const screenLobby = document.getElementById('screen-lobby');
        if (screenLogin) screenLogin.classList.add('hidden');
        if (screenLobby) screenLobby.classList.remove('hidden');
        showToast('Playing as Guest');
      };
    }

    // Login Submit
    const btnSubmitLogin = document.getElementById('btn-submit-login');
    if (btnSubmitLogin) {
      btnSubmitLogin.onclick = async () => {
        const usernameOrEmail = (document.getElementById('login-username').value || '').trim();
        const password = document.getElementById('login-password').value || '';
        if (!usernameOrEmail || !password) {
          showToast('Please enter both username and password', true);
          return;
        }

        try {
          const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: { username: usernameOrEmail, usernameOrEmail, password }
          });
          setAuthToken(res.token);
          window.currentUser = res.user;
          renderUserHeader();
          closeAuthModal();
          showToast(`Welcome back, ${res.user.displayName || res.user.name || res.user.username}!`);
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    // Register Submit (Invite Only)
    const btnSubmitRegister = document.getElementById('btn-submit-register');
    if (btnSubmitRegister) {
      btnSubmitRegister.onclick = async () => {
        const inviteToken = (document.getElementById('reg-invite-token').value || '').trim();
        const username = (document.getElementById('reg-username').value || '').trim();
        const displayName = (document.getElementById('reg-name').value || '').trim();
        const email = (document.getElementById('reg-email').value || '').trim();
        const password = document.getElementById('reg-password').value || '';

        if (!inviteToken) {
          showToast('An invite token is required to register!', true);
          return;
        }
        if (!username || !password) {
          showToast('Username and password are required', true);
          return;
        }

        try {
          const res = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: { inviteToken, username, displayName, name: displayName, email, password }
          });
          setAuthToken(res.token);
          window.currentUser = res.user;
          renderUserHeader();
          closeAuthModal();
          showToast(`Account created! Welcome, ${res.user.displayName || res.user.name || res.user.username}!`);
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    // Reset Password Submit
    const btnSubmitReset = document.getElementById('btn-submit-reset');
    if (btnSubmitReset) {
      btnSubmitReset.onclick = async () => {
        const token = (document.getElementById('reset-token-input').value || '').trim();
        const newPassword = document.getElementById('reset-new-password').value || '';

        if (!token || !newPassword) {
          showToast('Please enter the new password', true);
          return;
        }

        try {
          await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: { token, newPassword }
          });
          showToast('Password reset successfully! You can now sign in.');
          openAuthModal('login');
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    // Profile Modal Listeners
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const profileBackdrop = document.getElementById('profile-backdrop');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnLogout = document.getElementById('btn-logout');

    if (btnCloseProfile) btnCloseProfile.onclick = closeProfileModal;
    if (profileBackdrop) profileBackdrop.onclick = closeProfileModal;

    if (btnSaveProfile) {
      btnSaveProfile.onclick = async () => {
        const displayName = (document.getElementById('profile-input-name').value || '').trim();
        const avatar = (document.getElementById('profile-input-avatar').value || '').trim();
        const newPassword = document.getElementById('profile-input-password').value;

        try {
          const res = await apiFetch('/api/auth/profile', {
            method: 'POST',
            body: { displayName, name: displayName, avatar, newPassword }
          });
          window.currentUser = res.user;
          renderUserHeader();
          closeProfileModal();
          showToast('Profile updated successfully!');
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    if (btnLogout) {
      btnLogout.onclick = async () => {
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' });
        } catch(e) {}
        setAuthToken(null);
        window.currentUser = null;
        renderUserHeader();
        closeProfileModal();
        const screenLogin = document.getElementById('screen-login');
        const screenLobby = document.getElementById('screen-lobby');
        if (screenLogin) screenLogin.classList.remove('hidden');
        if (screenLobby) screenLobby.classList.add('hidden');
        showToast('Logged out successfully.');
      };
    }

    // Admin Dashboard Listeners
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const adminBackdrop = document.getElementById('admin-backdrop');

    if (btnCloseAdmin) btnCloseAdmin.onclick = closeAdminModal;
    if (adminBackdrop) adminBackdrop.onclick = closeAdminModal;

    document.querySelectorAll('.admin-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        switchAdminTab(tabBtn.dataset.tab);
      };
    });

    // Generate Invite Link button
    const btnGenInvite = document.getElementById('btn-gen-invite-link');
    if (btnGenInvite) {
      btnGenInvite.onclick = async () => {
        try {
          const res = await apiFetch('/api/admin/invite-link', {
            method: 'POST',
            body: { maxUses: 1, expiresInHours: 72 }
          });
          copyTextToClipboard(res.inviteUrl || res.inviteLink, 'Sign-up invite link generated and copied!');
          loadAdminInvites();
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    // Open Emoji Creator button
    const btnOpenEmojiCreator = document.getElementById('btn-open-emoji-creator');
    if (btnOpenEmojiCreator) {
      btnOpenEmojiCreator.onclick = () => {
        const creatorModal = document.getElementById('modal-add-emoji');
        if (creatorModal) creatorModal.classList.remove('hidden');
      };
    }

    // Add Phrase button
    const btnAddPhrase = document.getElementById('btn-add-phrase');
    const inputPhrase = document.getElementById('input-new-phrase');
    if (btnAddPhrase && inputPhrase) {
      btnAddPhrase.onclick = async () => {
        const text = (inputPhrase.value || '').trim();
        if (!text) return;
        try {
          await apiFetch('/api/admin/quick-messages', {
            method: 'POST',
            body: { text }
          });
          inputPhrase.value = '';
          showToast('Quick phrase added!');
          loadAdminPhrases();
          loadGameQuickMessages();
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    // Create User Directly Modal (Admin)
    const btnOpenAddUser = document.getElementById('btn-open-add-user');
    const modalCreateUser = document.getElementById('modal-admin-create-user');
    const btnCloseCreateUser = document.getElementById('btn-close-create-user');
    const createUserBackdrop = document.getElementById('create-user-backdrop');
    const btnSubmitAdminCreateUser = document.getElementById('btn-submit-admin-create-user');

    if (btnOpenAddUser && modalCreateUser) {
      btnOpenAddUser.onclick = () => modalCreateUser.classList.remove('hidden');
    }
    if (btnCloseCreateUser && modalCreateUser) {
      btnCloseCreateUser.onclick = () => modalCreateUser.classList.add('hidden');
    }
    if (createUserBackdrop && modalCreateUser) {
      createUserBackdrop.onclick = () => modalCreateUser.classList.add('hidden');
    }

    if (btnSubmitAdminCreateUser) {
      btnSubmitAdminCreateUser.onclick = async () => {
        const username = (document.getElementById('admin-new-username').value || '').trim();
        const displayName = (document.getElementById('admin-new-name').value || '').trim();
        const email = (document.getElementById('admin-new-email').value || '').trim();
        const role = document.getElementById('admin-new-role').value;
        const password = document.getElementById('admin-new-password').value || '';

        if (!username || !password) {
          showToast('Username and password are required', true);
          return;
        }

        try {
          await apiFetch('/api/admin/users', {
            method: 'POST',
            body: { username, displayName, name: displayName, email, role, password }
          });
          showToast(`User ${username} created successfully!`);
          modalCreateUser.classList.add('hidden');
          loadAdminUsers();
        } catch(err) {
          showToast(err.message, true);
        }
      };
    }

    initEmojiCreator();
    initAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDomListeners);
  } else {
    setupDomListeners();
  }
})();
