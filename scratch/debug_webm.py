import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    c1 = browser.new_context(viewport={"width": 375, "height": 812})
    c2 = browser.new_context(viewport={"width": 375, "height": 812})
    p1 = c1.new_page()
    p2 = c2.new_page()
    p1.goto('http://localhost:3000')
    p1.fill('#input-player-name', 'Host')
    p1.click('#btn-create-room')
    p1.wait_for_selector('#screen-waiting')
    code = p1.locator('#waiting-room-code-hero').inner_text().strip()
    
    p2.goto(f'http://localhost:3000/?room={code}')
    p2.fill('#input-player-name', 'Player 2')
    p2.click('#btn-join-room')
    p2.wait_for_selector('#screen-waiting')
    
    p1.click('#btn-start-game')
    p1.wait_for_selector('#screen-game')
    p2.wait_for_selector('#screen-game')
    
    # Send WebM
    p1.click('#btn-open-emoji')
    btn = p1.locator(".rm-emoji-btn[title='Animated WebM Sticker']")
    print('Button found:', btn.count())
    btn.click()
    time.sleep(0.6)
    
    anchors_html = p2.evaluate('''() => {
        return Array.from(document.querySelectorAll('.rm-reaction-anchor')).map(a => a.innerHTML);
    }''')
    print('P2 anchors innerHTML:', anchors_html)
    browser.close()
