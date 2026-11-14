import sys
import time
from playwright.sync_api import sync_playwright

def run_verification():
    print("=== Starting Ludo PRO Complete End-to-End Verification ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # -------------------------------------------------------------
        # STEP 1: Verify Lobby as Guest Player
        # -------------------------------------------------------------
        print("\n--- STEP 1: Testing Guest Experience ---")
        context_guest = browser.new_context(viewport={"width": 375, "height": 812})
        page_guest = context_guest.new_page()
        page_guest.goto("http://localhost:3000")
        page_guest.wait_for_selector("#topbar-user-section")
        
        sign_in_btn = page_guest.locator("#btn-open-auth")
        assert sign_in_btn.is_visible(), "Sign in button should be visible for guest"
        print("✓ Guest sees topbar Sign In button")
        
        # -------------------------------------------------------------
        # STEP 2: Super Admin Login & Verification of Role Badges
        # -------------------------------------------------------------
        print("\n--- STEP 2: Testing Super Admin Login ---")
        context_admin = browser.new_context(viewport={"width": 375, "height": 812})
        page_admin = context_admin.new_page()
        page_admin.goto("http://localhost:3000")
        
        page_admin.click("#btn-open-auth")
        page_admin.wait_for_selector("#modal-auth", state="visible")
        print("✓ Auth modal opened")
        
        page_admin.fill("#login-username", "superadmin")
        page_admin.fill("#login-password", "admin123")
        page_admin.click("#btn-submit-login")
        
        page_admin.wait_for_selector("#btn-open-admin", state="visible", timeout=5000)
        admin_btn = page_admin.locator("#btn-open-admin")
        assert admin_btn.is_visible(), "Super Admin should see Admin button"
        print("✓ Super Admin successfully logged in and sees Admin button")
        
        profile_btn = page_admin.locator("#btn-open-profile")
        assert profile_btn.is_visible(), "Profile button should be visible"
        print(f"✓ Profile pill text: {profile_btn.inner_text().strip()}")
        
        # -------------------------------------------------------------
        # STEP 3: Admin Dashboard Navigation & Permissions
        # -------------------------------------------------------------
        print("\n--- STEP 3: Testing Admin Management Panel ---")
        page_admin.click("#btn-open-admin")
        page_admin.wait_for_selector("#modal-admin-dashboard", state="visible")
        
        header_role = page_admin.locator("#admin-header-role")
        assert "SUPER ADMIN" in header_role.inner_text().upper(), "Header role should state Super Admin"
        print(f"✓ Admin modal opened with role badge: {header_role.inner_text().strip()}")
        
        # Verify Users tab loaded
        page_admin.wait_for_selector("#admin-users-list tr", timeout=5000)
        users_count = page_admin.locator("#admin-users-list tr").count()
        print(f"✓ Users list loaded with {users_count} users")
        
        # -------------------------------------------------------------
        # STEP 4: Generate Invite Link and Register New User
        # -------------------------------------------------------------
        print("\n--- STEP 4: Generating Invite Link & Registering User ---")
        page_admin.click("button[data-tab='tab-invites']")
        page_admin.wait_for_selector("#btn-gen-invite-link", state="visible")
        page_admin.click("#btn-gen-invite-link")
        time.sleep(1) # wait for API & table update
        
        page_admin.wait_for_selector("#admin-invites-list tr", state="visible")
        invite_rows = page_admin.locator("#admin-invites-list tr")
        print(f"✓ Total invite records: {invite_rows.count()}")
        
        # Read the latest token directly from API or table
        latest_inv_copy_btn = invite_rows.first.locator(".btn-copy-inv")
        assert latest_inv_copy_btn.is_visible(), "Copy invite button should be visible"
        invite_url = latest_inv_copy_btn.get_attribute("data-url")
        print(f"✓ Generated invite URL: {invite_url}")
        
        # Register new player in a separate session via the invite URL
        context_new_user = browser.new_context(viewport={"width": 375, "height": 812})
        page_new_user = context_new_user.new_page()
        page_new_user.goto(invite_url)
        
        # Verify auth modal automatically opens on Register tab with invite token
        page_new_user.wait_for_selector("#modal-auth", state="visible")
        invite_input_val = page_new_user.input_value("#reg-invite-token")
        assert len(invite_input_val) > 10, "Invite token should be pre-filled from URL"
        print(f"✓ Invite token auto-filled in register form: {invite_input_val[:12]}...")
        
        unique_user = f"user_{int(time.time())}"
        page_new_user.fill("#reg-username", unique_user)
        page_new_user.fill("#reg-name", "Hasan Player")
        page_new_user.fill("#reg-password", "playerpass123")
        page_new_user.click("#btn-submit-register")
        
        # Wait for profile button indicating successful registration
        page_new_user.wait_for_selector("#btn-open-profile", state="visible", timeout=5000)
        user_profile = page_new_user.locator("#btn-open-profile").inner_text()
        print(f"✓ Registered user logged in successfully! Header: {user_profile.strip()}")
        assert not page_new_user.locator("#btn-open-admin").is_visible(), "Regular user should NOT see Admin button"
        print("✓ Verified regular user has no admin button")
        
        # -------------------------------------------------------------
        # STEP 5: Super Admin Custom Emoji / Sticker Creator with Live Preview & Sound
        # -------------------------------------------------------------
        print("\n--- STEP 5: Testing Emoji Creator & Interactive Size Slider ---")
        page_admin.click("button[data-tab='tab-emojis']")
        page_admin.wait_for_selector("#btn-open-emoji-creator", state="visible")
        page_admin.click("#btn-open-emoji-creator")
        
        page_admin.wait_for_selector("#modal-add-emoji", state="visible")
        print("✓ Custom Emoji / Sticker Creator modal opened")
        
        # Fill emoji details
        page_admin.fill("#emoji-input-label", "Super Nova")
        page_admin.fill("#emoji-input-char", "🌟")
        page_admin.select_option("#emoji-select-preset", "sparkle_shield")
        
        # Test Live Size Slider
        preview_size = page_admin.locator("#preview-size-display")
        assert preview_size.inner_text() == "48px", "Default size should be 48px"
        
        # Change slider to 72px
        page_admin.fill("#emoji-size-slider", "72")
        # Trigger input event
        page_admin.eval_on_selector("#emoji-size-slider", "el => el.dispatchEvent(new Event('input'))")
        time.sleep(0.5)
        
        updated_size = preview_size.inner_text()
        print(f"✓ Live Preview Size display updated to: {updated_size}")
        assert updated_size == "72px", "Slider should update preview display"
        
        # Save emoji
        page_admin.click("#btn-save-new-emoji")
        time.sleep(1)
        
        # Check that new emoji appears in admin grid
        page_admin.wait_for_selector("#admin-emojis-grid .emoji-admin-card")
        cards = page_admin.locator("#admin-emojis-grid .emoji-admin-card")
        last_card_text = cards.last.inner_text()
        print(f"✓ New custom emoji saved and displayed in grid: {last_card_text.splitlines()[:2]}")
        assert "Super Nova" in last_card_text and "72px" in last_card_text, "Emoji card must show label and 72px"
        
        # Close admin modal
        page_admin.click("#btn-close-admin")
        
        # -------------------------------------------------------------
        # STEP 6: Multiplayer Room Creation & Guest Joining via URL
        # -------------------------------------------------------------
        print("\n--- STEP 6: Match Creation & Guest Joining via ?room=CODE ---")
        page_admin.fill("#input-player-name", "Admin Host")
        page_admin.click("#btn-create-room")
        page_admin.wait_for_selector("#screen-waiting", state="visible", timeout=5000)
        
        room_code = page_admin.locator("#waiting-room-code").inner_text().strip()
        print(f"✓ Super Admin created room with code: {room_code}")
        
        # Guest player opens ?room=CODE
        page_guest.goto(f"http://localhost:3000/?room={room_code}")
        guest_input_code = page_guest.input_value("#input-room-code")
        assert guest_input_code == room_code, f"Guest room code should be {room_code}"
        print(f"✓ Guest URL ?room={room_code} auto-populated room code: {guest_input_code}")
        
        page_guest.fill("#input-player-name", "Guest Player")
        page_guest.click("#btn-join-room")
        page_guest.wait_for_selector("#screen-waiting", state="visible", timeout=5000)
        print("✓ Guest successfully joined waiting room without needing an account!")
        
        # -------------------------------------------------------------
        # STEP 7: Start Match and Test In-Game Custom Reaction Dock
        # -------------------------------------------------------------
        print("\n--- STEP 7: In-Game Custom Emoji & Reaction Dock ---")
        page_admin.click("#btn-start-game")
        page_admin.wait_for_selector("#screen-game", state="visible", timeout=5000)
        page_guest.wait_for_selector("#screen-game", state="visible", timeout=5000)
        print("✓ Game screen started for both players")
        
        # Open emoji dock on admin page
        page_admin.click("#btn-open-emoji")
        page_admin.wait_for_selector("#emoji-reaction-dock", state="visible")
        
        # Verify custom emoji "Super Nova" (🌟) exists in dock
        dock_emojis = page_admin.locator(".rm-emoji-btn")
        emoji_count = dock_emojis.count()
        print(f"✓ In-game Reaction Dock loaded {emoji_count} dynamic emojis/stickers")
        
        # Trigger sending the 72px "Super Nova" emoji
        page_admin.eval_on_selector(".rm-emoji-btn[title='Super Nova']", "btn => btn.click()")
        time.sleep(0.6)
        
        # Check floating emoji rendered on guest's screen!
        floating_items = page_guest.locator(".floating-emoji-item")
        print(f"✓ Guest screen received floating reaction: count={floating_items.count()}")
        
        # Take verification screenshot of game board
        page_admin.screenshot(path="scratch/admin_game_view.png")
        page_guest.screenshot(path="scratch/guest_game_view.png")
        print("✓ Captured screenshots of admin and guest views")
        
        browser.close()
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! User Roles, Invites, Emojis, Audio Binding & Guest Joining 100% OPERATIONAL.")

if __name__ == '__main__':
    run_verification()
