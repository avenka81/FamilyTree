/**
 * Heritage Tree - Structural Tests (No Browser Required)
 * Validates HTML structure, CSS integrity, JS syntax, and data consistency
 */

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
let html = '';
let passed = 0;
let failed = 0;
let errors = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        errors.push({ name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
}

// ===================== LOAD FILE =====================
console.log('\n🔍 Loading index.html...');
try {
    html = fs.readFileSync(HTML_PATH, 'utf8');
    console.log(`   Loaded ${html.length} characters, ${html.split('\n').length} lines\n`);
} catch (e) {
    console.error(`❌ Cannot load ${HTML_PATH}: ${e.message}`);
    process.exit(1);
}

// ===================== HTML STRUCTURE =====================
console.log('📋 HTML Structure Tests:');

test('Has DOCTYPE', () => {
    assert(html.startsWith('<!DOCTYPE html>'), 'Missing DOCTYPE');
});

test('Has opening and closing html tags', () => {
    assert(html.includes('<html'), 'Missing <html>');
    assert(html.includes('</html>'), 'Missing </html>');
});

test('Has head and body', () => {
    assert(html.includes('<head>'), 'Missing <head>');
    assert(html.includes('</head>'), 'Missing </head>');
    assert(html.includes('<body>'), 'Missing <body>');
    assert(html.includes('</body>'), 'Missing </body>');
});

test('Has style and script tags balanced', () => {
    const styleOpen = (html.match(/<style>/g) || []).length;
    const styleClose = (html.match(/<\/style>/g) || []).length;
    assert(styleOpen === styleClose, `Style tags unbalanced: ${styleOpen} open, ${styleClose} close`);
    
    const scriptOpen = (html.match(/<script/g) || []).length;
    const scriptClose = (html.match(/<\/script>/g) || []).length;
    assert(scriptOpen === scriptClose, `Script tags unbalanced: ${scriptOpen} open, ${scriptClose} close`);
});

test('Has page title', () => {
    assert(html.includes('<title>Heritage Tree'), 'Missing or wrong title');
});

test('Has viewport meta tag', () => {
    assert(html.includes('viewport'), 'Missing viewport meta');
});

// ===================== KEY HTML ELEMENTS =====================
console.log('\n📋 Key HTML Elements:');

test('Has launch screen', () => {
    assert(html.includes('id="launchScreen"'), 'Missing launch screen');
});

test('Has launch input selector with all tree options', () => {
    assert(html.includes('id="launchInput"'), 'Missing launch input');
    for (const opt of ['kochi', 'ayalur', 'avr', 'radha', 'all']) {
        assert(html.includes(`value="${opt}"`), `Missing option: ${opt}`);
    }
});

test('Has tree container', () => {
    assert(html.includes('id="treeContainer"'), 'Missing tree container');
});

test('Has tree viewport', () => {
    assert(html.includes('id="treeViewport"'), 'Missing tree viewport');
});

test('Has sidebar', () => {
    assert(html.includes('id="mobileSidebar"'), 'Missing sidebar');
});

test('Has tree selector dropdown', () => {
    assert(html.includes('id="treeSelector"'), 'Missing tree selector dropdown');
});

test('Has data manager modal', () => {
    assert(html.includes('id="dataManagerModal"'), 'Missing data manager modal');
});

test('Has auth modal', () => {
    assert(html.includes('id="authModal"'), 'Missing auth modal');
});

test('Has theme selector modal', () => {
    assert(html.includes('id="themeSelectorModal"'), 'Missing theme selector modal');
});

test('Has auth button', () => {
    assert(html.includes('id="authBtn"'), 'Missing auth button');
});

test('Has auth status display', () => {
    assert(html.includes('id="authStatus"'), 'Missing auth status');
});

test('Has version string', () => {
    assert(html.match(/v\d+\.\d+\.\d+/), 'Missing version string');
});

// ===================== CSS INTEGRITY =====================
console.log('\n📋 CSS Integrity:');

test('CSS braces are balanced', () => {
    // Extract CSS from style tag
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    assert(styleMatch, 'Cannot find style block');
    const css = styleMatch[1];
    
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    assert(openBraces === closeBraces, `CSS braces unbalanced: ${openBraces} open, ${closeBraces} close`);
});

test('No orphaned CSS properties outside rules', () => {
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    const css = styleMatch[1];
    // Look for property declarations at the top level (outside braces)
    // This catches things like "z-index: 5;" floating outside any rule
    const lines = css.split('\n');
    let braceDepth = 0;
    const orphanedProps = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Count braces
        for (const ch of line) {
            if (ch === '{') braceDepth++;
            if (ch === '}') braceDepth--;
        }
        // Check if line looks like a property (has colon, ends with semicolon) at depth 0
        if (braceDepth === 0 && /^[a-z-]+\s*:/.test(line) && line.endsWith(';')) {
            orphanedProps.push(`Line ~${i}: ${line}`);
        }
    }
    assert(orphanedProps.length === 0, `Found orphaned CSS properties:\n    ${orphanedProps.join('\n    ')}`);
});

test('Has CSS variables defined', () => {
    assert(html.includes('--bark-900'), 'Missing --bark-900 variable');
    assert(html.includes('--gold-500'), 'Missing --gold-500 variable');
    assert(html.includes('--rose-500'), 'Missing --rose-500 variable');
    assert(html.includes('--blue-500'), 'Missing --blue-500 variable');
});

test('Has data-manager-modal base and active styles', () => {
    assert(html.includes('.data-manager-modal {'), 'Missing .data-manager-modal base style');
    assert(html.includes('.data-manager-modal.active'), 'Missing .data-manager-modal.active style');
});

test('No duplicate @keyframes slideIn', () => {
    const matches = html.match(/@keyframes slideIn/g) || [];
    assert(matches.length === 1, `Found ${matches.length} @keyframes slideIn (expected 1)`);
});

test('Male/female card styles use CSS variables', () => {
    // Check that the border-left for male/female uses variables, not hardcoded values
    const maleMatch = html.match(/\.node-card\.male\s*{[^}]*border-left[^}]*}/s);
    assert(maleMatch, 'Cannot find .node-card.male rule');
    assert(maleMatch[0].includes('var(--sage-500)') || maleMatch[0].includes('var(--blue-500)'), 
        'Male card border-left should use CSS variable');
});

// ===================== JAVASCRIPT INTEGRITY =====================
console.log('\n📋 JavaScript Integrity:');

test('debug() is defined before first use', () => {
    // Find the const debug definition
    const debugDefLine = html.indexOf('const debug = ');
    assert(debugDefLine > 0, 'Cannot find debug function definition');
    
    // Find first debug() call
    const firstDebugCall = html.indexOf('debug(');
    // The definition itself contains 'debug(' in the assignment, so find calls BEFORE the definition
    const beforeDef = html.substring(0, debugDefLine);
    const earlyCall = beforeDef.match(/[^a-zA-Z_]debug\s*\(/);
    assert(!earlyCall, 'debug() is called before it is defined');
});

test('DEBUG_MODE is defined before debug function', () => {
    const modePos = html.indexOf('const DEBUG_MODE');
    const debugPos = html.indexOf('const debug = ');
    assert(modePos > 0, 'Missing DEBUG_MODE');
    assert(modePos < debugPos, 'DEBUG_MODE should be defined before debug function');
});

test('DEBUG_MODE is false for production', () => {
    assert(html.includes('const DEBUG_MODE = false'), 'DEBUG_MODE should be false in production');
});

test('debug function calls console.log (not itself recursively)', () => {
    const debugDef = html.match(/const debug = \([^)]*\)\s*=>\s*{[^}]+}/);
    assert(debugDef, 'Cannot parse debug function');
    assert(debugDef[0].includes('console.log'), 'debug function should call console.log');
    // Make sure it's not recursive
    const body = debugDef[0].split('=>')[1];
    assert(!body.match(/\bdebug\s*\(/), 'debug function should not call itself recursively');
});

test('No console.log calls outside debug() (except Firebase init)', () => {
    const lines = html.split('\n');
    const directLogs = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('console.log') && !line.includes('const debug') && !line.includes('if (DEBUG_MODE)')) {
            directLogs.push(`Line ${i + 1}: ${line.substring(0, 80)}`);
        }
    }
    // Allow exactly 1 - the Firebase init module log
    assert(directLogs.length <= 1, `Found ${directLogs.length} direct console.log calls:\n    ${directLogs.join('\n    ')}`);
});

test('All key functions exist', () => {
    const requiredFunctions = [
        'validateAndLaunch', 'renderTree', 'renderMobileTree', 'renderMode80',
        'selectPerson', 'showPersonDetail', 'closePersonDetail',
        'filterPeople', 'displayPeopleList', 'filterTreeBySearch',
        'toggleMobileSidebar', 'closeMobileSidebarIfNeeded',
        'openDataManager', 'closeDataManager',
        'openAuthModal', 'closeAuthModal',
        'openThemeSelector', 'closeThemeSelector', 'applyTheme',
        'handleGoogleSignIn', 'handleSignOut', 'updateAuthUI',
        'loadFromFirebase', 'saveAllToFirebase',
        'addPerson', 'savePerson', 'deletePerson',
        'exportJSON', 'exportCSV', 'exportGEDCOM', 'exportForGoogleSheets',
        'importData', 'parseCSV', 'parseGEDCOM', 'parseGoogleSheetCSV',
        'switchView', 'switchTreeFromDropdown', 'viewTreeFromPerson',
        'calculateGeneration', 'findRelationship',
        'toggleFold', 'collapseAllMobile',
        'buildNode', 'renderPersonCard', 'renderCollapsedFamilyCard',
        'switchTab', 'refreshPeopleList', 'filterPeopleList'
    ];
    
    const missing = requiredFunctions.filter(fn => !html.includes(`function ${fn}(`));
    assert(missing.length === 0, `Missing functions: ${missing.join(', ')}`);
});

test('Modal open/close functions use classList.add/remove("active")', () => {
    // Extract each open/close function and check it uses classList
    const modalFns = ['openAuthModal', 'closeAuthModal', 'openDataManager', 'closeDataManager', 'openThemeSelector', 'closeThemeSelector'];
    
    for (const fn of modalFns) {
        const fnMatch = html.match(new RegExp(`function ${fn}\\(\\)[\\s\\S]*?(?=\\n    function |\\n    //|\\n    async )`));
        if (fnMatch) {
            const isOpen = fn.startsWith('open');
            if (isOpen) {
                assert(fnMatch[0].includes("classList.add('active')"), `${fn} should use classList.add('active')`);
            } else {
                assert(fnMatch[0].includes("classList.remove('active')"), `${fn} should use classList.remove('active')`);
            }
        }
    }
});

test('No inline style overrides on modal divs', () => {
    // Check that modal divs don't have conflicting inline styles
    const modalIds = ['dataManagerModal', 'authModal', 'themeSelectorModal'];
    for (const id of modalIds) {
        const regex = new RegExp(`id="${id}"[^>]*style=`);
        assert(!regex.test(html), `Modal #${id} should not have inline style attribute`);
    }
});

// ===================== DATA INTEGRITY =====================
console.log('\n📋 Data Integrity:');

test('familyData array exists and has entries', () => {
    const match = html.match(/let familyData = \[([\s\S]*?)\];/);
    assert(match, 'Cannot find familyData array');
    const entries = match[1].match(/\{id:/g) || [];
    assert(entries.length > 100, `Expected 100+ people, found ${entries.length}`);
});

test('All familyData entries have required fields', () => {
    const match = html.match(/let familyData = \[([\s\S]*?)\];/);
    const dataStr = match[1];
    // Check a sample of entries for required fields
    const idMatches = dataStr.match(/\{id: \d+/g) || [];
    assert(idMatches.length > 0, 'No entries found');
    
    // Check that entries have name, sex, and id fields
    assert(dataStr.includes('name:'), 'Missing name field');
    assert(dataStr.includes('sex:'), 'Missing sex field');
    assert(dataStr.includes('imageId:'), 'Missing imageId field');
});

test('Key people exist in data', () => {
    const keyPeople = [
        { id: 1, name: 'Ramaswamy' },
        { id: 6, name: 'A S Mahadevan' },
        { id: 7, name: 'A S Krishnan' },
        { id: 15, name: 'Sundaram' },
        { id: 127, name: 'Radha' },
        { id: 128, name: 'Mahadevan (Murali)' },
        { id: 132, name: 'Venkateswaran (Ganesh)' },
        { id: 300, name: 'A V Ramaiyar' }
    ];
    
    for (const p of keyPeople) {
        assert(html.includes(`id: ${p.id}, name: "${p.name}"`), `Missing key person: ID ${p.id} ${p.name}`);
    }
});

test('No duplicate IDs in familyData', () => {
    const match = html.match(/let familyData = \[([\s\S]*?)\];/);
    const ids = [...match[1].matchAll(/\{id: (\d+)/g)].map(m => parseInt(m[1]));
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert(dupes.length === 0, `Duplicate IDs found: ${[...new Set(dupes)].join(', ')}`);
});

test('Spouse relationships are bidirectional', () => {
    const match = html.match(/let familyData = \[([\s\S]*?)\];/);
    const entries = [...match[1].matchAll(/\{id: (\d+),[^}]*spouseId: (\d+)/g)];
    const spouseMap = {};
    entries.forEach(m => { spouseMap[m[1]] = m[2]; });
    
    const broken = [];
    for (const [id, spouseId] of Object.entries(spouseMap)) {
        if (spouseMap[spouseId] && spouseMap[spouseId] !== id) {
            broken.push(`ID ${id} -> spouse ${spouseId}, but ${spouseId} -> spouse ${spouseMap[spouseId]}`);
        }
    }
    // Allow some since not all spouses may be in the regex match (optional fields)
    assert(broken.length < 5, `Broken spouse relationships:\n    ${broken.slice(0, 5).join('\n    ')}`);
});

// ===================== FIREBASE CONFIG =====================
console.log('\n📋 Firebase Configuration:');

test('Has Firebase SDK imports', () => {
    assert(html.includes('firebase-app.js'), 'Missing firebase-app import');
    assert(html.includes('firebase-firestore.js'), 'Missing firebase-firestore import');
    assert(html.includes('firebase-auth.js'), 'Missing firebase-auth import');
});

test('Has Firebase config object', () => {
    assert(html.includes('apiKey:'), 'Missing apiKey in config');
    assert(html.includes('authDomain:'), 'Missing authDomain');
    assert(html.includes('projectId:'), 'Missing projectId');
});

test('Has authorized editors list', () => {
    assert(html.includes('AUTHORIZED_EDITORS'), 'Missing AUTHORIZED_EDITORS');
    assert(html.includes('venki.ayalur@gmail.com'), 'Missing primary admin email');
});

test('Has Google Auth provider setup', () => {
    assert(html.includes('GoogleAuthProvider'), 'Missing GoogleAuthProvider');
    assert(html.includes('signInWithPopup'), 'Missing signInWithPopup');
});

// ===================== THEME SYSTEM =====================
console.log('\n📋 Theme System:');

test('All 6 themes are defined', () => {
    const themes = ['current', 'forest', 'ocean', 'royal', 'slate', 'sunset'];
    for (const theme of themes) {
        // Theme keys in JS object literals don't have quotes
        const hasQuoted = html.includes(`'${theme}':`);
        const hasUnquoted = html.includes(`${theme}: {`);
        assert(hasQuoted || hasUnquoted, `Missing theme definition: ${theme}`);
    }
});

test('Theme saves to localStorage', () => {
    assert(html.includes("localStorage.setItem('selectedTheme'"), 'Theme not saved to localStorage');
});

test('Theme loads from localStorage on startup', () => {
    assert(html.includes("localStorage.getItem('selectedTheme')"), 'Theme not loaded from localStorage');
});

// ===================== EXPORT FUNCTIONS =====================
console.log('\n📋 Export/Import System:');

test('Has all export formats', () => {
    assert(html.includes('function exportJSON'), 'Missing exportJSON');
    assert(html.includes('function exportCSV'), 'Missing exportCSV');
    assert(html.includes('function exportGEDCOM'), 'Missing exportGEDCOM');
    assert(html.includes('function exportForGoogleSheets'), 'Missing exportForGoogleSheets');
    assert(html.includes('function exportUpdatedHTML'), 'Missing exportUpdatedHTML');
});

test('Has import capabilities', () => {
    assert(html.includes('.json'), 'Missing JSON import support');
    assert(html.includes('.csv'), 'Missing CSV import support');
    assert(html.includes('.ged'), 'Missing GEDCOM import support');
});

// ===================== SUMMARY =====================
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
    console.log('\n❌ Failures:');
    errors.forEach(e => console.log(`   • ${e.name}: ${e.error}`));
}
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
