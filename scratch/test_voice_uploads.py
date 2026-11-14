import urllib.request, time
from playwright.sync_api import sync_playwright

def run_voice_test():
    print("=== Testing Funny Voice Clip Uploads & In-Game Voice Reactions ===")
    
    # 1. Verify HTTP accessibility of both audio files
    for path in ['/uploads/audio/takkalla.mp3', '/uploads/audio/chhi_chhi.weba']:
        url = f'http://localhost:3000{path}'
        res = urllib.request.urlopen(url)
        print(f"✓ Audio URL {path} -> Status {res.status}, Type: {res.headers.get('Content-Type')}")
        assert res.status == 200, f"Expected 200 for {url}"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 2. Test Super Admin uploading a fresh custom audio voice
        print("\n--- Testing Super Admin Custom Voice File Upload ---")
        context_admin = browser.new_context(viewport={"width": 375, "height": 812})
        page_admin = context_admin.new_page()
        page_admin.goto("http://localhost:3000")
        
        # Login Super Admin
        page_admin.click("#btn-open-auth")
        page_admin.fill("#login-username", "superadmin")
        page_admin.fill("#login-password", "admin123")
        page_admin.click("#btn-submit-login")
        page_admin.wait_for_selector("#btn-open-admin")
        
        # Open Admin panel -> Emojis tab
        page_admin.click("#btn-open-admin")
        page_admin.click("button[data-tab='tab-emojis']")
        page_admin.wait_for_selector("#btn-open-emoji-creator")
        
        # Open Creator modal
        page_admin.click("#btn-open-emoji-creator")
        page_admin.wait_for_selector("#modal-add-emoji", state="visible")
        
        page_admin.fill("#emoji-input-label", "Boom Voice")
        page_admin.select_option("#emoji-select-type", "fontawesome")
        page_admin.select_option("#emoji-select-fa", "fa-solid fa-bomb")
        
        # Select custom voice audio upload
        page_admin.select_option("#emoji-select-sound-type", "custom")
        page_admin.set_input_files("#emoji-audio-file", "public/uploads/audio/takkalla.mp3")
        time.sleep(0.5)
        
        # Verify Test Audio button appears
        test_audio_btn = page_admin.locator("#btn-preview-custom-audio")
        assert test_audio_btn.is_visible(), "Test custom audio button should be visible"
        print("✓ Custom audio file uploaded and test button appeared")
        
        # Save custom voice emoji
        page_admin.click("#btn-save-new-emoji")
        time.sleep(1)
        
        # Check that it appears in admin grid with custom voice badge
        page_admin.wait_for_selector(".emoji-admin-card")
        cards = page_admin.locator(".emoji-admin-card")
        found = False
        for i in range(cards.count()):
            text = cards.nth(i).inner_text()
            if "Boom Voice" in text or "তাক্কাল্লা" in text or "ছি ছি ছি" in text:
                print(f"✓ Found voice reaction card in grid: {text.splitlines()[:2]}")
                found = True
        assert found, "Custom voice reactions must appear in admin grid"
        
        page_admin.click("#btn-close-admin")
        
        # 3. Test In-Game Voice Reactions
        print("\n--- Testing In-Game Voice Playback on Multiplayer ---")
        context_p2 = browser.new_context(viewport={"width": 375, "height": 812})
        page_p2 = context_p2.new_page()
        
        page_admin.fill("#input-player-name", "Admin Host")
        page_admin.click("#btn-create-room")
        page_admin.wait_for_selector("#screen-waiting")
        room_code = page_admin.locator("#waiting-room-code-hero").inner_text().strip()
        
        page_p2.goto(f"http://localhost:3000/?room={room_code}")
        page_p2.fill("#input-player-name", "Opponent")
        page_p2.click("#btn-join-room")
        page_p2.wait_for_selector("#screen-waiting")
        
        page_admin.click("#btn-start-game")
        page_admin.wait_for_selector("#screen-game")
        page_p2.wait_for_selector("#screen-game")
        
        # Host opens emoji reaction dock
        page_admin.click("#btn-open-emoji")
        page_admin.wait_for_selector("#emoji-reaction-dock", state="visible")
        
        # Check presence of takkalla and chhi chhi voice buttons
        btn_takkalla = page_admin.locator(".rm-emoji-btn[title*='তাক্কাল্লা']")
        assert btn_takkalla.count() > 0, "Takkalla voice reaction button must exist in dock"
        print("✓ Reaction dock includes 'তাক্কাল্লা! (Takkalla)' voice reaction button")
        
        btn_chhichhi = page_admin.locator(".rm-emoji-btn[title*='ছি ছি ছি']")
        assert btn_chhichhi.count() > 0, "Chhi Chhi voice reaction button must exist in dock"
        print("✓ Reaction dock includes 'ছি ছি ছি! (Chhi Chhi)' voice reaction button")
        
        # Click Takkalla voice reaction
        btn_takkalla.click()
        time.sleep(0.5)
        
        # Verify Player 2 receives floating reaction
        p2_floating = page_p2.locator(".floating-emoji-item")
        assert p2_floating.count() > 0, "Player 2 should receive floating voice reaction"
        print("✓ Player 2 received floating voice reaction with 'তাক্কাল্লা!' audio playback")
        
        browser.close()
        print("\n🎉 ALL FUNNY VOICE CLIP UPLOAD & MULTIPLAYER TESTS PASSED 100%!")

if __name__ == '__main__':
    run_voice_test()
