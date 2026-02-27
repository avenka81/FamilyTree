/**
 * Heritage Tree - Browser Tests (Playwright)
 * Tests actual rendering, interactions, and UI behavior in a real browser
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
let browser, context, page;
let passed = 0;
let failed = 0;
let errors = [];

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        errors.push({ name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function setup() {
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    page = await context.newPage();
    
    // Suppress expected console errors (Firebase network calls will fail)
    page.on('pageerror', err => {
        // Only report non-Firebase errors
        if (!err.message.includes('firebase') && !err.message.includes('Firebase') && 
            !err.message.includes('ERR_NAME') && !err.message.includes('fetch')) {
            console.log(`  ⚠️ Page error: ${err.message.substring(0, 100)}`);
        }
    });
    
    console.log(`📄 Loading ${HTML_PATH}...`);
    await page.goto(`file://${HTML_PATH}`, { waitUntil: 'domcontentloaded' });
    
    // Give scripts time to initialize
    await page.waitForTimeout(1500);
    console.log('   Page loaded\n');
}

async function teardown() {
    if (browser) await browser.close();
}

// ===================== TESTS =====================

async function runTests() {
    await setup();
    
    // ---- LAUNCH SCREEN ----
    console.log('📋 Launch Screen Tests:');
    
    await test('Launch screen is visible on load', async () => {
        const visible = await page.isVisible('#launchScreen');
        if (!visible) throw new Error('Launch screen not visible');
    });
    
    await test('Launch screen has all tree options', async () => {
        const options = await page.$$eval('#launchInput option', opts => opts.map(o => o.value));
        const expected = ['80', 'kochi', 'ayalur', 'avr', 'radha', 'all'];
        for (const opt of expected) {
            if (!options.includes(opt)) throw new Error(`Missing option: ${opt}`);
        }
    });
    
    await test('Launch screen defaults to "80"', async () => {
        const value = await page.$eval('#launchInput', el => el.value);
        if (value !== '80') throw new Error(`Default is "${value}", expected "80"`);
    });
    
    await test('Clicking "View Tree" hides launch screen', async () => {
        await page.click('.launch-btn');
        await page.waitForTimeout(800);
        const hasHidden = await page.$eval('#launchScreen', el => el.classList.contains('hidden'));
        if (!hasHidden) throw new Error('Launch screen did not get hidden class');
    });
    
    // ---- TREE RENDERING ----
    console.log('\n📋 Tree Rendering Tests:');
    
    await test('Tree container has content after launch', async () => {
        const content = await page.$eval('#treeContainer', el => el.innerHTML.length);
        if (content < 100) throw new Error(`Tree container nearly empty: ${content} chars`);
    });
    
    await test('Tree renders node cards', async () => {
        const cardCount = await page.$$eval('.node-card', cards => cards.length);
        if (cardCount < 5) throw new Error(`Only ${cardCount} cards rendered, expected many more`);
    });
    
    await test('Node cards have names', async () => {
        const names = await page.$$eval('.node-name', els => els.map(el => el.textContent.trim()).filter(Boolean));
        if (names.length < 5) throw new Error(`Only ${names.length} named cards`);
    });
    
    await test('Spouse pairs are rendered', async () => {
        const pairs = await page.$$eval('.spouse-pair', els => els.length);
        if (pairs < 2) throw new Error(`Only ${pairs} spouse pairs found`);
    });
    
    await test('Fold toggles are present', async () => {
        const toggles = await page.$$eval('.fold-toggle', els => els.length);
        if (toggles < 2) throw new Error(`Only ${toggles} fold toggles found`);
    });
    
    await test('Tree nodes have generation data attributes', async () => {
        const gens = await page.$$eval('.tree-node[data-generation]', els => els.length);
        if (gens < 3) throw new Error(`Only ${gens} nodes have data-generation`);
    });
    
    // ---- FOLD/COLLAPSE ----
    console.log('\n📋 Fold/Collapse Tests:');
    
    await test('Fold toggle collapses children', async () => {
        // Find an expanded toggle
        const toggle = await page.$('.fold-toggle.expanded');
        if (!toggle) throw new Error('No expanded toggle found');
        
        const personId = await toggle.getAttribute('data-person-id');
        const foldId = `fold-${personId}`;
        
        // Check children container exists and is visible
        const containerBefore = await page.$(`#${foldId}`);
        if (!containerBefore) throw new Error(`No children container #${foldId}`);
        
        const displayBefore = await containerBefore.evaluate(el => el.style.display);
        
        // Click the toggle
        await toggle.click();
        await page.waitForTimeout(300);
        
        // Check it collapsed
        const displayAfter = await page.$eval(`#${foldId}`, el => el.style.display);
        if (displayAfter !== 'none') throw new Error(`Expected display:none, got "${displayAfter}"`);
        
        // Check toggle changed to collapsed
        const isCollapsed = await toggle.evaluate(el => el.classList.contains('collapsed'));
        if (!isCollapsed) throw new Error('Toggle did not get collapsed class');
        
        // Re-expand for subsequent tests
        await toggle.click();
        await page.waitForTimeout(300);
    });
    
    // ---- PERSON DETAIL MODAL ----
    console.log('\n📋 Person Detail Modal Tests:');
    
    await test('Clicking a node card opens person detail modal', async () => {
        const card = await page.$('.node-card');
        if (!card) throw new Error('No node card found');
        
        await card.click();
        await page.waitForTimeout(500);
        
        const modal = await page.$('#personDetailModal');
        if (!modal) throw new Error('Person detail modal not created');
        
        const display = await modal.evaluate(el => window.getComputedStyle(el).display);
        if (display === 'none') throw new Error('Modal not visible');
    });
    
    await test('Person detail modal has name and close button', async () => {
        const name = await page.$eval('.person-detail-info h2', el => el.textContent.trim());
        if (!name) throw new Error('No name in detail modal');
        
        const closeBtn = await page.$('.person-detail-close');
        if (!closeBtn) throw new Error('No close button');
    });
    
    await test('Person detail modal shows relationships', async () => {
        const sections = await page.$$eval('.person-detail-section h3', els => els.map(el => el.textContent));
        // Should have at least one of: Parents, Spouse, Siblings, Children
        if (sections.length === 0) throw new Error('No relationship sections found');
    });
    
    await test('Person detail modal has View Tree button', async () => {
        const btn = await page.$('.person-detail-view-btn');
        if (!btn) throw new Error('No View Tree button');
    });
    
    await test('Close button closes person detail modal', async () => {
        await page.click('.person-detail-close');
        await page.waitForTimeout(500);
        
        const modal = await page.$('#personDetailModal');
        if (modal) {
            const display = await modal.evaluate(el => window.getComputedStyle(el).display);
            if (display !== 'none') throw new Error('Modal still visible after close');
        }
    });
    
    // ---- SIDEBAR ----
    console.log('\n📋 Sidebar Tests:');
    
    await test('Sidebar toggle button exists', async () => {
        const btn = await page.$('.mobile-sidebar-toggle');
        if (!btn) throw new Error('No sidebar toggle button');
    });
    
    await test('Sidebar opens when toggle clicked', async () => {
        await page.click('.main-search-bar .mobile-sidebar-toggle');
        await page.waitForTimeout(500);
        
        const isOpen = await page.$eval('#mobileSidebar', el => el.classList.contains('mobile-open'));
        if (!isOpen) throw new Error('Sidebar did not open');
    });
    
    await test('Sidebar has control buttons', async () => {
        const buttons = await page.$$eval('.sidebar-controls .control-btn', btns => btns.map(b => b.textContent.trim()));
        if (buttons.length < 2) throw new Error(`Only ${buttons.length} control buttons`);
    });
    
    await test('Sidebar closes when overlay clicked', async () => {
        await page.click('.mobile-overlay');
        await page.waitForTimeout(500);
        
        const isOpen = await page.$eval('#mobileSidebar', el => el.classList.contains('mobile-open'));
        if (isOpen) throw new Error('Sidebar did not close');
    });
    
    // ---- DATA MANAGER MODAL ----
    console.log('\n📋 Data Manager Modal Tests:');
    
    await test('Data manager opens via sidebar button', async () => {
        // Open sidebar first
        await page.click('.main-search-bar .mobile-sidebar-toggle');
        await page.waitForTimeout(400);
        
        // Click Data Manager button
        await page.click('#dataManagerBtn');
        await page.waitForTimeout(500);
        
        const isActive = await page.$eval('#dataManagerModal', el => el.classList.contains('active'));
        if (!isActive) throw new Error('Data manager modal did not get active class');
    });
    
    await test('Data manager has tabs', async () => {
        const tabs = await page.$$eval('.data-tab', els => els.map(el => el.textContent.trim()));
        const expected = ['Browse People', 'Add Person', 'Edit Person', 'Import/Export'];
        for (const tab of expected) {
            if (!tabs.includes(tab)) throw new Error(`Missing tab: ${tab}`);
        }
    });
    
    await test('Browse tab shows people list', async () => {
        const items = await page.$$eval('#peopleList .person-item', els => els.length);
        if (items < 10) throw new Error(`Only ${items} people in list, expected many more`);
    });
    
    await test('People list search works', async () => {
        await page.fill('#searchPeople', 'Sundaram');
        await page.waitForTimeout(300);
        
        const items = await page.$$eval('#peopleList .person-item', els => els.length);
        if (items < 1) throw new Error('Search for "Sundaram" returned 0 results');
        if (items > 10) throw new Error(`Search too broad: ${items} results for "Sundaram"`);
        
        // Clear search
        await page.fill('#searchPeople', '');
        await page.waitForTimeout(300);
    });
    
    await test('Data manager closes', async () => {
        await page.click('.data-manager-close');
        await page.waitForTimeout(500);
        
        const isActive = await page.$eval('#dataManagerModal', el => el.classList.contains('active'));
        if (isActive) throw new Error('Data manager still has active class');
    });
    
    // ---- AUTH MODAL ----
    console.log('\n📋 Auth Modal Tests:');
    
    await test('Auth modal opens when auth button clicked', async () => {
        // Open sidebar
        await page.click('.main-search-bar .mobile-sidebar-toggle');
        await page.waitForTimeout(400);
        
        // Check if auth button is visible
        const authBtnVisible = await page.isVisible('#authBtn');
        if (!authBtnVisible) {
            // User might be signed in, skip
            console.log('     (Auth button hidden - user may be signed in, skipping)');
            await page.click('.mobile-overlay');
            await page.waitForTimeout(300);
            return;
        }
        
        await page.click('#authBtn');
        await page.waitForTimeout(500);
        
        const isActive = await page.$eval('#authModal', el => el.classList.contains('active'));
        if (!isActive) throw new Error('Auth modal did not get active class');
    });
    
    await test('Auth modal has Google sign-in button', async () => {
        const isActive = await page.$eval('#authModal', el => el.classList.contains('active'));
        if (!isActive) return; // Skip if modal isn't open
        
        const googleBtn = await page.$('#authModal button');
        if (!googleBtn) throw new Error('No Google sign-in button found');
        
        const text = await googleBtn.evaluate(el => el.textContent.trim());
        if (!text.includes('Google')) throw new Error(`Button text: "${text}" doesn't mention Google`);
    });
    
    await test('Auth modal closes', async () => {
        const isActive = await page.$eval('#authModal', el => el.classList.contains('active'));
        if (!isActive) return; // Skip if modal isn't open
        
        await page.click('#authModal .data-manager-close');
        await page.waitForTimeout(500);
        
        const stillActive = await page.$eval('#authModal', el => el.classList.contains('active'));
        if (stillActive) throw new Error('Auth modal still active after close');
    });
    
    // ---- THEME SELECTOR ----
    console.log('\n📋 Theme Selector Tests:');
    
    await test('Theme selector opens', async () => {
        // Open sidebar
        await page.click('.main-search-bar .mobile-sidebar-toggle');
        await page.waitForTimeout(400);
        
        await page.click('#themeBtn');
        await page.waitForTimeout(500);
        
        const isActive = await page.$eval('#themeSelectorModal', el => el.classList.contains('active'));
        if (!isActive) throw new Error('Theme selector did not open');
    });
    
    await test('Theme selector has all 6 themes', async () => {
        const themeOptions = await page.$$eval('.theme-option', els => els.length);
        if (themeOptions !== 6) throw new Error(`Found ${themeOptions} themes, expected 6`);
    });
    
    await test('Theme selector closes', async () => {
        await page.click('#themeSelectorModal .data-manager-close');
        await page.waitForTimeout(500);
        
        const isActive = await page.$eval('#themeSelectorModal', el => el.classList.contains('active'));
        if (isActive) throw new Error('Theme selector still active');
    });
    
    // ---- TREE SWITCHING ----
    console.log('\n📋 Tree Switching Tests:');
    
    await test('Tree selector dropdown changes tree', async () => {
        const cardsBefore = await page.$$eval('.node-card', cards => cards.length);
        
        await page.selectOption('#treeSelector', 'kochi');
        await page.waitForTimeout(800);
        
        const cardsAfter = await page.$$eval('.node-card', cards => cards.length);
        // Cards should change (different tree = different count)
        // Just verify tree re-rendered with content
        if (cardsAfter < 3) throw new Error(`Only ${cardsAfter} cards after switching to Kochi`);
    });
    
    await test('Can switch back to default tree', async () => {
        await page.selectOption('#treeSelector', '80');
        await page.waitForTimeout(800);
        
        const cards = await page.$$eval('.node-card', c => c.length);
        if (cards < 3) throw new Error(`Only ${cards} cards after switching to 80`);
    });
    
    // ---- JAVASCRIPT ERRORS ----
    console.log('\n📋 JavaScript Error Tests:');
    
    await test('No uncaught JS errors on page load', async () => {
        const jsErrors = [];
        page.on('pageerror', err => {
            if (!err.message.includes('firebase') && !err.message.includes('Firebase') &&
                !err.message.includes('ERR_NAME') && !err.message.includes('fetch') &&
                !err.message.includes('net::')) {
                jsErrors.push(err.message);
            }
        });
        
        // Reload and check
        await page.goto(`file://${HTML_PATH}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        if (jsErrors.length > 0) {
            throw new Error(`JS errors found:\n    ${jsErrors.join('\n    ')}`);
        }
    });
    
    await test('familyData is populated in browser context', async () => {
        const count = await page.evaluate(() => {
            return typeof familyData !== 'undefined' ? familyData.length : 0;
        });
        if (count < 100) throw new Error(`familyData has only ${count} entries`);
    });
    
    await test('personMap is populated', async () => {
        const count = await page.evaluate(() => {
            return typeof personMap !== 'undefined' ? Object.keys(personMap).length : 0;
        });
        if (count < 100) throw new Error(`personMap has only ${count} entries`);
    });
    
    await test('No "undefined" or "null" text visible in tree', async () => {
        const treeText = await page.$eval('#treeContainer', el => el.textContent);
        // Check for literal "undefined" or "null" in visible text
        const undefinedCount = (treeText.match(/\bundefined\b/g) || []).length;
        const nullCount = (treeText.match(/\bnull\b/g) || []).length;
        if (undefinedCount > 0) throw new Error(`Found "undefined" ${undefinedCount} times in tree`);
        if (nullCount > 0) throw new Error(`Found "null" ${nullCount} times in tree`);
    });
    
    // ---- CLEANUP & SUMMARY ----
    await teardown();
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    if (errors.length > 0) {
        console.log('\n❌ Failures:');
        errors.forEach(e => console.log(`   • ${e.name}: ${e.error}`));
    }
    console.log('='.repeat(50) + '\n');
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal error:', err);
    teardown().then(() => process.exit(1));
});
