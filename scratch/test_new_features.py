import time
from playwright.sync_api import sync_playwright

def run_test():
    print("=== Testing Font Awesome, WebM Animated Stickers, Hero Copy Link & Match Started Blocking ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # -------------------------------------------------------------
        # TEST 1: Hero Copy Room Link Card
        # -------------------------------------------------------------
        print("\n--- TEST 1: Beautiful Hero Copy Room Link Card ---")
        context_host = browser.new_context(viewport={"width": 375, "height": 812})
        page_host = context_host.new_page()
        page_host.goto("http://localhost:3000")
        
        # Host creates room
        page_host.fill("#input-player-name", "Host Pro")
        page_host.click("#btn-create-room")
        page_host.wait_for_selector("#screen-waiting", state="visible")
        
        # Verify Hero card elements
        hero_code_el = page_host.locator("#waiting-room-code-hero")
        assert hero_code_el.is_visible(), "Hero room code element must be visible"
        room_code = hero_code_el.inner_text().strip()
        assert len(room_code) == 4, f"Expected 4-letter code, got {room_code}"
        print(f"✓ Hero card displays 4-letter room code: {room_code}")
        
        hero_copy_btn = page_host.locator("#btn-copy-invite-hero")
        assert hero_copy_btn.is_visible(), "Hero copy button must be visible"
        
        # Click copy button and verify instant visual transition
        hero_copy_btn.click()
        time.sleep(0.3)
        assert "Copied!" in hero_copy_btn.inner_text(), "Hero button should change text to Copied!"
        print("✓ Hero copy button transformed smoothly to 'Copied!'")
        
        # -------------------------------------------------------------
        # TEST 2: Second Player Joins in Waiting State
        # -------------------------------------------------------------
        print("\n--- TEST 2: Second Player Joins Waiting Room ---")
        context_player2 = browser.new_context(viewport={"width": 375, "height": 812})
        page_player2 = context_player2.new_page()
        page_player2.goto(f"http://localhost:3000/?room={room_code}")
        
        page_player2.fill("#input-player-name", "Player Two")
        page_player2.click("#btn-join-room")
        page_player2.wait_for_selector("#screen-waiting", state="visible")
        print("✓ Player 2 successfully joined waiting room")
        
        # -------------------------------------------------------------
        # TEST 3: Start Match & Verify In-Game Font Awesome Emojis and WebM Sticker
        # -------------------------------------------------------------
        print("\n--- TEST 3: Font Awesome Emojis & Animated WebM Stickers ---")
        page_host.click("#btn-start-game")
        page_host.wait_for_selector("#screen-game", state="visible")
        page_player2.wait_for_selector("#screen-game", state="visible")
        print("✓ Match started. Game screen visible for both players")
        
        # Host opens Reaction Dock
        page_host.click("#btn-open-emoji")
        page_host.wait_for_selector("#emoji-reaction-dock", state="visible")
        
        # Check Font Awesome icons inside reaction dock
        fa_icons = page_host.locator("#emoji-reaction-dock .rm-emoji-btn i")
        fa_count = fa_icons.count()
        print(f"✓ Reaction Dock contains {fa_count} Font Awesome icon buttons")
        assert fa_count >= 5, "Reaction dock should have Font Awesome icon buttons"
        
        # Check WebM animated video sticker inside reaction dock
        webm_videos = page_host.locator("#emoji-reaction-dock .rm-emoji-btn video")
        webm_count = webm_videos.count()
        print(f"✓ Reaction Dock contains {webm_count} WebM video animated stickers")
        assert webm_count >= 1, "Reaction dock must contain the WebM animated sticker"
        
        # Click a Font Awesome emoji (e.g. Fire)
        page_host.eval_on_selector(".rm-emoji-btn[title='Fire Blaze']", "btn => btn.click()")
        time.sleep(0.5)
        
        # Verify Player 2 receives floating Font Awesome emoji
        floating_fa = page_player2.locator(".floating-emoji-item i.fa-fire")
        assert floating_fa.is_visible(), "Floating Font Awesome fire icon should appear on Player 2's board"
        print("✓ Player 2 received glowing Font Awesome <i> fire reaction!")
        
        # Click WebM video sticker
        time.sleep(1.0)
        page_host.click("#btn-open-emoji")
        page_host.wait_for_selector("#emoji-reaction-dock", state="visible")
        page_host.locator(".rm-emoji-btn[title='Animated WebM Sticker']").click()
        time.sleep(0.6)
        
        # Verify Player 2 receives floating WebM video
        floating_webm = page_player2.locator(".floating-emoji-item video")
        assert floating_webm.count() > 0, "Floating WebM video should appear on Player 2's board"
        print("✓ Player 2 received floating WebM animated video sticker!")
        
        # Capture screenshot of gameplay with reaction
        page_player2.screenshot(path="scratch/fontawesome_reaction_view.png")
        print("✓ Saved screenshot of Font Awesome & WebM reaction")
        
        # -------------------------------------------------------------
        # TEST 4: "The Match Has Already Started" Blocking
        # -------------------------------------------------------------
        print("\n--- TEST 4: Attempting to Join Ongoing Match (Should Be Blocked) ---")
        context_late = browser.new_context(viewport={"width": 375, "height": 812})
        page_late = context_late.new_page()
        page_late.goto(f"http://localhost:3000/?room={room_code}")
        
        page_late.fill("#input-player-name", "Late Guest")
        page_late.click("#btn-join-room")
        
        # Wait for the modal "The Match Has Already Started"
        page_late.wait_for_selector("#modal-match-started", state="visible", timeout=5000)
        blocked_title = page_late.locator("#modal-match-started h3").inner_text()
        print(f"✓ Blocked modal appeared with title: '{blocked_title}'")
        assert "The Match Has Already Started" in blocked_title, "Modal must state The Match Has Already Started"
        
        # Click "Back to Lobby" button
        page_late.click("#btn-close-match-started")
        time.sleep(1)
        assert page_late.locator("#screen-lobby").is_visible(), "User should be safely back on Lobby screen"
        print("✓ User safely redirected back to Lobby upon closing modal")
        
        browser.close()
        print("\n🎉 ALL 3 NEW REQUIREMENTS VERIFIED AND 100% OPERATIONAL!")

if __name__ == '__main__':
    run_test()
