import time
from playwright.sync_api import sync_playwright

def run_test():
    print("=== Testing Emoji Reaction 10s Cooldown (Per-Player) ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Host creates game
        context_blue = browser.new_context(viewport={"width": 375, "height": 812})
        page_blue = context_blue.new_page()
        page_blue.goto("http://localhost:3000")
        
        # Click Continue as Guest
        page_blue.click("#btn-quick-guest")
        page_blue.wait_for_selector("#screen-lobby", state="visible")
        
        page_blue.fill("#input-player-name", "Blue Pro")
        page_blue.click("#btn-create-room")
        page_blue.wait_for_selector("#screen-waiting", state="visible")
        
        hero_code_el = page_blue.locator("#waiting-room-code-hero")
        room_code = hero_code_el.inner_text().strip()
        print(f"✓ Room created with code: {room_code}")
        
        # 2. Green joins game
        context_green = browser.new_context(viewport={"width": 375, "height": 812})
        page_green = context_green.new_page()
        page_green.goto(f"http://localhost:3000/?room={room_code}")
        
        # Click Continue as Guest if on first-login
        if page_green.locator("#btn-quick-guest").is_visible():
            page_green.click("#btn-quick-guest")
        page_green.wait_for_selector("#screen-lobby", state="visible")
        
        page_green.fill("#input-player-name", "Green Master")
        page_green.click("#btn-join-room")
        page_green.wait_for_selector("#screen-waiting", state="visible")
        print("✓ Green joined room")
        
        # 3. Host starts game
        time.sleep(0.5)
        btn_start = page_blue.locator("#btn-start-game")
        btn_start.click()
        page_blue.wait_for_selector("#screen-game", state="visible")
        page_green.wait_for_selector("#screen-game", state="visible")
        print("✓ Game started for both players")
        
        # 4. Blue opens emoji dock
        time.sleep(0.5)
        btn_emoji_blue = page_blue.locator("#btn-open-emoji")
        assert btn_emoji_blue.is_visible(), "Blue emoji button must be visible"
        btn_emoji_blue.click()
        
        dock_blue = page_blue.locator("#emoji-reaction-dock")
        assert dock_blue.is_visible(), "Emoji dock should open for Blue"
        print("✓ Blue opened emoji reaction dock")
        
        # 5. Blue sends an emoji
        first_emoji_btn = page_blue.locator(".rm-emoji-btn").first
        first_emoji_btn.click()
        print("✓ Blue clicked emoji")
        
        # Dock should immediately close
        time.sleep(0.3)
        assert not dock_blue.is_visible(), "Emoji dock should automatically close after sending"
        print("✓ Emoji dock closed automatically")
        
        # Verify Blue's button has cooldown badge & on-cooldown class
        badge_blue = page_blue.locator("#emoji-cooldown-badge")
        assert badge_blue.is_visible(), "Cooldown badge should be visible on Blue button"
        badge_text_phase1 = badge_blue.inner_text()
        print(f"✓ Blue cooldown badge in Phase 1 (reaction playing): '{badge_text_phase1}'")
        assert "⏳" in badge_text_phase1 or "s" in badge_text_phase1
        
        # Verify Blue button has on-cooldown class
        btn_class = btn_emoji_blue.get_attribute("class")
        assert "on-cooldown" in btn_class, "Button should have on-cooldown class"
        
        # 6. Verify clicking Blue's button during cooldown does NOT open the dock
        btn_emoji_blue.click()
        time.sleep(0.2)
        assert not dock_blue.is_visible(), "Dock should NOT open while Blue is on cooldown"
        print("✓ Blue cannot open dock while on cooldown")
        
        # 7. Verify Green is NOT on cooldown (Per-Player isolation)
        btn_emoji_green = page_green.locator("#btn-open-emoji")
        green_class = btn_emoji_green.get_attribute("class")
        assert "on-cooldown" not in green_class, "Green should NOT be on cooldown"
        badge_green = page_green.locator("#emoji-cooldown-badge")
        assert not badge_green.is_visible(), "Green badge should NOT be visible"
        print("✓ Verified Per-Player isolation: Green is NOT on cooldown!")
        
        # 8. Wait for reaction duration (5s) to finish and check Phase 2 (10s countdown)
        print("Waiting 5.2 seconds for reaction duration to finish...")
        time.sleep(5.2)
        
        badge_text_phase2 = badge_blue.inner_text().strip()
        print(f"✓ Blue cooldown badge in Phase 2 (post-reaction countdown): '{badge_text_phase2}'")
        assert "s" in badge_text_phase2, f"Expected seconds like '10s' or '9s', got '{badge_text_phase2}'"
        
        # Take screenshot of the countdown state
        page_blue.screenshot(path="scratch/emoji_cooldown_countdown.png")
        print("✓ Saved screenshot of countdown state to scratch/emoji_cooldown_countdown.png")
        
        # 9. Wait for the 10s cooldown to expire completely
        print("Waiting remaining 10 seconds for cooldown to complete...")
        time.sleep(10.5)
        
        # 10. Verify cooldown is finished and Blue can send again!
        btn_class_after = btn_emoji_blue.get_attribute("class")
        assert "on-cooldown" not in btn_class_after, "on-cooldown should be removed after cooldown completes"
        assert not badge_blue.is_visible(), "Badge should be hidden after cooldown completes"
        print("✓ Cooldown finished! Button restored to normal state")
        
        # Blue clicks emoji button again
        btn_emoji_blue.click()
        time.sleep(0.3)
        assert dock_blue.is_visible(), "Blue can now open emoji dock again!"
        print("✓ Blue can now send emoji again!")
        
        browser.close()
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
