import json, os

db_path = 'data/db.json'
with open(db_path, 'r', encoding='utf-8') as f:
    db = json.load(f)

# Define clean Font Awesome 6 gaming emojis + WebM animated sticker
new_emojis = [
    {
        "id": "fa_fire",
        "label": "Fire Blaze",
        "type": "fontawesome",
        "content": "fa-solid fa-fire",
        "soundType": "preset",
        "soundValue": "sparkle_shield",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_laugh",
        "label": "Laugh Out Loud",
        "type": "fontawesome",
        "content": "fa-solid fa-face-laugh-squint",
        "soundType": "preset",
        "soundValue": "pop",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_crown",
        "label": "Victory Crown",
        "type": "fontawesome",
        "content": "fa-solid fa-crown",
        "soundType": "preset",
        "soundValue": "victory",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_shield",
        "label": "Guardian Shield",
        "type": "fontawesome",
        "content": "fa-solid fa-shield-halved",
        "soundType": "preset",
        "soundValue": "sparkle_shield",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_rocket",
        "label": "Turbo Rocket",
        "type": "fontawesome",
        "content": "fa-solid fa-rocket",
        "soundType": "preset",
        "soundValue": "cheery_fanfare",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_heart",
        "label": "Love Heart",
        "type": "fontawesome",
        "content": "fa-solid fa-heart",
        "soundType": "preset",
        "soundValue": "pop",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_party",
        "label": "Celebration",
        "type": "fontawesome",
        "content": "fa-solid fa-champagne-glasses",
        "soundType": "preset",
        "soundValue": "cheery_fanfare",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_bolt",
        "label": "Thunder Bolt",
        "type": "fontawesome",
        "content": "fa-solid fa-bolt",
        "soundType": "preset",
        "soundValue": "digital_blip",
        "size": 48,
        "active": True
    },
    {
        "id": "fa_star",
        "label": "Super Star",
        "type": "fontawesome",
        "content": "fa-solid fa-star",
        "soundType": "preset",
        "soundValue": "sparkle_shield",
        "size": 52,
        "active": True
    },
    {
        "id": "fa_dice",
        "label": "Lucky 6 Dice",
        "type": "fontawesome",
        "content": "fa-solid fa-dice",
        "soundType": "preset",
        "soundValue": "dice_roll",
        "size": 48,
        "active": True
    },
    {
        "id": "stk_dragon_webm",
        "label": "Animated WebM Sticker",
        "type": "sticker",
        "content": "/uploads/emojis/sticker_sample.webm",
        "soundType": "preset",
        "soundValue": "cheery_fanfare",
        "size": 64,
        "active": True
    }
]

db['emojis'] = new_emojis
with open(db_path, 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2)

print("Updated db.json emojis with Font Awesome and WebM animated sticker!")
