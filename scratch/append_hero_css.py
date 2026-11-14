import os

css_hero = """

/* ==========================================================================
   STUNNING HERO COPY ROOM LINK CARD & WEBM VIDEO STICKER ENHANCEMENTS
   ========================================================================== */

.room-invite-card-hero {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.45) 50%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 16px;
  padding: 16px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 10px 0 16px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.room-invite-card-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 65%);
  pointer-events: none;
}

.invite-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invite-badge {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.invite-room-code {
  font-family: 'Fredoka', sans-serif;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #facc15;
  text-shadow: 0 0 12px rgba(250, 204, 21, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
}

.invite-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-copy-room-link {
  width: 100%;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 18px rgba(2, 132, 199, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-copy-room-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(2, 132, 199, 0.6);
  filter: brightness(1.1);
}

.btn-copy-room-link:active {
  transform: scale(0.98);
}

.btn-copy-room-link.copied,
.btn-copy-room-link-drawer.copied {
  background: linear-gradient(135deg, #059669, #10b981) !important;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.5) !important;
  border-color: #34d399 !important;
}

/* Drawer Room Card */
.room-share-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.room-share-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.room-share-tag {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.room-share-code {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #facc15;
}

.btn-copy-room-link-drawer {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.blocked-lock-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Video animated sticker styling in floating emoji & preview */
.preview-emoji-flying video,
.floating-emoji-item video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
  display: block;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5));
}
"""

with open('public/style.css', 'a', encoding='utf-8') as f:
    f.write(css_hero)

print("Appended hero copy card and webm sticker CSS!")
