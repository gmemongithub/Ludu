import os

css_to_append = """

/* ==========================================================================
   USER AUTHENTICATION, ADMIN DASHBOARD & CUSTOM EMOJI ENGINE STYLES
   ========================================================================== */

.topbar-user-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-topbar-pill {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.btn-topbar-pill:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.btn-topbar-pill.admin-active {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  border-color: #38bdf8;
  color: #fff;
}

.role-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.role-super_admin {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #ffffff;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.role-general_admin {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: #ffffff;
}

.role-user {
  background: rgba(255, 255, 255, 0.16);
  color: #94a3b8;
}

/* System Modals */
.sys-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  transition: opacity 0.2s ease;
}

.sys-modal.hidden {
  display: none !important;
}

.sys-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 14, 29, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.sys-modal-card {
  position: relative;
  z-index: 10;
  background: #111a2e;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.12);
  display: flex;
  flex-direction: column;
  color: #fff;
  animation: modalPop 0.2s ease-out;
}

@keyframes modalPop {
  0% { transform: scale(0.94); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.sys-modal-card.admin-card-wide {
  max-width: 660px;
}

.sys-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sys-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sys-btn-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.15s;
}

.sys-btn-close:hover {
  color: #ef4444;
}

.sys-modal-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.sys-tab-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.sys-tab-btn.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.sys-modal-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sys-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sys-form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.sys-form-group label .req {
  color: #f43f5e;
  font-weight: 400;
}

.sys-form-group input,
.sys-form-group select {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sys-form-group input:focus,
.sys-form-group select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.sys-form-group select option {
  background: #111a2e;
  color: #fff;
}

.sys-hint-text {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  margin-top: 4px;
}

.sys-btn-primary {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
  transition: all 0.15s ease;
}

.sys-btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.5);
}

.sys-btn-primary:active {
  transform: scale(0.98);
}

.sys-btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #e2e8f0;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sys-btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.sys-btn-danger:hover {
  background: #b91c1c;
}

.sys-btn-action {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.sys-btn-action:hover {
  background: rgba(56, 189, 248, 0.25);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
}

/* Profile Card Specifics */
.profile-header-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.profile-avatar-emoji {
  font-size: 32px;
  line-height: 1;
}

.profile-header-badge h4 {
  margin: 0 0 3px 0;
  font-size: 15px;
  font-weight: 700;
}

.profile-stats-card {
  display: flex;
  justify-content: space-around;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  padding: 10px;
  margin-top: 4px;
}

.profile-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-stat-item .val {
  font-size: 18px;
  font-weight: 700;
  color: #38bdf8;
}

.profile-stat-item .lbl {
  font-size: 11px;
  color: #94a3b8;
}

/* Admin Tabs */
.admin-tabs-nav {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
}

.admin-tab {
  padding: 7px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.admin-tab:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.admin-tab.active {
  background: #0284c7;
  color: #fff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.admin-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.admin-section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #f1f5f9;
}

/* Admin Tables */
.admin-table-wrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.admin-table th {
  background: rgba(255, 255, 255, 0.05);
  padding: 9px 12px;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-table td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.admin-table tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

/* Emoji Management Grid */
.emoji-admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  margin-top: 10px;
  max-height: 380px;
  overflow-y: auto;
}

.emoji-admin-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  text-align: center;
}

.emoji-admin-visual {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-admin-visual img {
  max-height: 48px;
  max-width: 48px;
  object-fit: contain;
}

.emoji-admin-card .emoji-admin-name {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
}

.emoji-admin-card .emoji-admin-meta {
  font-size: 10px;
  color: #94a3b8;
}

/* Interactive Floating Preview & Size Box */
.emoji-preview-section {
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(56, 189, 248, 0.4);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.emoji-live-preview-box {
  width: 100%;
  height: 120px;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.preview-stage {
  width: 100%;
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-emoji-flying {
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: previewFloat 2s ease-in-out infinite alternate;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));
}

.preview-emoji-flying img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@keyframes previewFloat {
  0% { transform: translateY(6px) scale(0.98); }
  100% { transform: translateY(-6px) scale(1.02); }
}

.preview-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: -4px;
}

.slider-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-control-row input[type="range"] {
  flex: 1;
  accent-color: #38bdf8;
  cursor: pointer;
}

/* Global Toast */
.sys-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0284c7;
  color: #fff;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.4);
  z-index: 100000;
  animation: toastFade 0.25s ease-out;
  pointer-events: none;
}

@keyframes toastFade {
  0% { opacity: 0; transform: translate(-50%, 12px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

/* Floating reaction container for in-game emojis/stickers */
.floating-emoji-item {
  position: absolute;
  pointer-events: none;
  z-index: 2500;
  animation: floatEmojiUp 2.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-emoji-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@keyframes floatEmojiUp {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.5);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1.1);
  }
  25% {
    transform: translateY(-8px) scale(1.0);
  }
  80% {
    opacity: 1;
    transform: translateY(-60px) scale(1.0);
  }
  100% {
    opacity: 0;
    transform: translateY(-110px) scale(0.8);
  }
}
"""

with open('public/style.css', 'a', encoding='utf-8') as f:
    f.write(css_to_append)

print("CSS appended successfully!")
