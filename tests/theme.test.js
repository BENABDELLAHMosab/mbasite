const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { fileURLToPath, pathToFileURL } = require('node:url');

const root = join(__dirname, '..');
const source = readFileSync(join(root, 'js/theme.js'), 'utf8');
const key = 'portfolio-theme';
const pages = ['index', 'about', 'skills', 'services', 'projects', 'experience', 'contact', 'project-tmpa', 'project-etl', 'project-triz', '404'];

function createStorage(value = null) {
    const values = new Map(value === null ? [] : [[key, value]]);
    return {
        getItem: (name) => values.get(name) ?? null,
        setItem: (name, value) => values.set(name, value),
        removeItem: (name) => values.delete(name),
        clear: () => values.clear()
    };
}

function createPage({ dark = false, storage = createStorage(), hasSwitch = true } = {}) {
    function eventTarget() {
        const listeners = new Map();
        return {
            addEventListener(name, callback) {
                if (!listeners.has(name)) listeners.set(name, []);
                listeners.get(name).push(callback);
            },
            emit(name, event = {}) {
                for (const listener of listeners.get(name) || []) listener(event);
            }
        };
    }

    const toggle = { ...eventTarget(), checked: false };
    const favicon = { setAttribute: (name, value) => { favicon[name] = value; } };
    const logo = { src: 'logo-selected-by-html.png', setAttribute: (name, value) => { logo[name] = value; } };
    const system = { ...eventTarget(), matches: dark };
    const timers = [];
    let domReady = false;
    const document = {
        ...eventTarget(),
        documentElement: { dataset: {}, style: {} },
        querySelector(selector) {
            if (!domReady) return null;
            return selector === 'link[rel="icon"]' ? favicon : (hasSwitch ? toggle : null);
        },
        getElementById: () => domReady && hasSwitch ? logo : null
    };
    const window = { ...eventTarget(), localStorage: storage, matchMedia: () => system, setTimeout: (callback) => timers.push(callback) };
    runInNewContext(source, { window, document });

    return {
        theme: () => document.documentElement.dataset.theme,
        colorScheme: () => document.documentElement.style.colorScheme,
        toggle, favicon, logo,
        ready() {
            domReady = true;
            document.emit('DOMContentLoaded');
        },
        choose(theme) {
            toggle.checked = theme === 'dark';
            toggle.emit('change', { target: toggle });
        },
        systemChange(dark) {
            system.matches = dark;
            system.emit('change', { matches: dark });
        },
        storageChange(changedKey = key, storageArea = storage, newValue = null) {
            window.emit('storage', { key: changedKey, storageArea, newValue });
        },
        restore(persisted = true, restoredChecked) {
            window.emit('pageshow', { persisted });
            if (restoredChecked !== undefined) toggle.checked = restoredChecked;
            while (timers.length) timers.shift()();
        }
    };
}

test('all portfolio pages, including project details, load the theme before every stylesheet', () => {
    for (const name of pages) {
        const html = readFileSync(join(root, `${name}.html`), 'utf8');
        const themeScript = /<script src="\/?js\/theme\.js"><\/script>/;
        assert.equal(html.split(themeScript).length - 1, 1, name);
        assert.ok(html.search(themeScript) < html.search(/<link\b[^>]*rel="stylesheet"/), name);
        assert.ok(html.search(themeScript) < html.indexOf('</head>'), name);
    }
});

test('source page scripts, styles, font preloads and favicons resolve to real files in a local preview', () => {
    for (const name of pages) {
        const pagePath = join(root, `${name}.html`);
        const html = readFileSync(pagePath, 'utf8');
        const pageUrl = pathToFileURL(pagePath);
        for (const tag of html.match(/<(?:script|link)\b[^>]*>/g) || []) {
            const source = tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];
            const isResource = tag.startsWith('<script') || /\brel="(?:stylesheet|preload|icon)"/.test(tag);
            if (!source || !isResource || /^(?:https?:)?\/\//.test(source)) continue;
            const resolved = fileURLToPath(new URL(source, pageUrl));
            assert.ok(resolved.startsWith(root), `${name}: ${source} escapes the portfolio directory`);
            assert.ok(existsSync(resolved), `${name}: ${source} is missing in a file preview`);
        }
    }
});

test('theme switching keeps the favicon inside the portfolio in a file preview', () => {
    const page = createPage();
    const pageUrl = pathToFileURL(join(root, 'index.html'));
    page.ready();
    for (const theme of ['dark', 'light']) {
        page.choose(theme);
        const iconPath = fileURLToPath(new URL(page.favicon.href, pageUrl));
        assert.equal(iconPath, join(root, 'assets', `logo-mba-${theme}.png`));
        assert.ok(existsSync(iconPath));
    }
});

for (const dark of [false, true]) {
    test(`system ${dark ? 'dark' : 'light'} applies before DOM ready without saving an override`, () => {
        const storage = createStorage();
        const page = createPage({ dark, storage });
        assert.equal(page.theme(), dark ? 'dark' : 'light');
        assert.equal(page.colorScheme(), page.theme());
        assert.equal(storage.getItem(key), null);
        page.ready();
        page.systemChange(!dark);
        assert.equal(page.theme(), dark ? 'light' : 'dark');
        assert.equal(page.toggle.checked, !dark);
        assert.equal(storage.getItem(key), null);
    });

    test(`manual ${dark ? 'light' : 'dark'} survives system changes and new page loads`, () => {
        const storage = createStorage();
        const choice = dark ? 'light' : 'dark';
        const page = createPage({ dark, storage });
        page.ready();
        page.choose(choice);
        assert.equal(storage.getItem(key), choice);
        page.systemChange(!dark);
        page.systemChange(dark);
        assert.equal(page.theme(), choice);
        assert.equal(page.colorScheme(), choice);
        assert.equal(page.favicon.href, `assets/logo-mba-${choice}.png`);
        assert.equal(page.logo.src, 'logo-selected-by-html.png');
        const nextPage = createPage({ dark, storage });
        assert.equal(nextPage.theme(), choice);
        nextPage.ready();
        assert.equal(nextPage.toggle.checked, choice === 'dark');
    });
}

test('invalid saved values fall back to the system', () => {
    for (const value of ['', 'system', 'DARK', 'undefined']) {
        const page = createPage({ dark: true, storage: createStorage(value) });
        assert.equal(page.theme(), 'dark');
        page.systemChange(false);
        assert.equal(page.theme(), 'light');
    }
});

test('existing tabs follow shared preferences and return to the system on removal or clear', () => {
    const storage = createStorage();
    const first = createPage({ storage });
    const second = createPage({ storage });
    first.ready();
    second.ready();
    first.choose('dark');
    second.storageChange();
    assert.equal(second.theme(), 'dark');
    assert.equal(second.toggle.checked, true);
    storage.removeItem(key);
    second.storageChange();
    assert.equal(second.theme(), 'light');
    second.systemChange(true);
    assert.equal(second.theme(), 'dark');
    second.choose('light');
    storage.clear();
    second.storageChange(null);
    assert.equal(second.theme(), 'dark');
});

test('storage events read the current value and ignore other storage areas and keys', () => {
    const storage = createStorage('light');
    const page = createPage({ storage });
    storage.setItem(key, 'dark');
    page.storageChange('other-key');
    assert.equal(page.theme(), 'light');
    page.storageChange(key, createStorage());
    assert.equal(page.theme(), 'light');
    page.storageChange(key, storage, 'light');
    assert.equal(page.theme(), 'dark');
});

test('restoring a cached page reconciles storage and the current system setting', () => {
    const storage = createStorage('dark');
    const page = createPage({ storage });
    page.ready();
    storage.setItem(key, 'light');
    page.restore();
    assert.equal(page.theme(), 'light');
    assert.equal(page.toggle.checked, false);
    storage.clear();
    page.systemChange(true);
    page.restore();
    assert.equal(page.theme(), 'dark');
});

test('blocked reads and writes keep manual changes working for the current page', () => {
    const denied = () => { throw new Error('Storage denied'); };
    const page = createPage({ storage: { getItem: denied, setItem: denied } });
    assert.equal(page.theme(), 'light');
    page.ready();
    page.choose('dark');
    page.systemChange(false);
    page.restore();
    assert.equal(page.theme(), 'dark');
    assert.equal(page.toggle.checked, true);
});

test('pageshow also reconciles a checkbox restored by ordinary history navigation', () => {
    const page = createPage({ storage: createStorage('dark') });
    page.ready();
    page.restore(false, false);
    assert.equal(page.toggle.checked, true);
});

test('a failed write is not replaced by an older readable preference on pageshow', () => {
    const storage = createStorage('light');
    storage.setItem = () => { throw new Error('Quota exceeded'); };
    const page = createPage({ storage });
    page.ready();
    page.choose('dark');
    page.restore();
    assert.equal(page.theme(), 'dark');
});

test('pages without a switch or brand logo still apply the theme and favicon', () => {
    const page = createPage({ storage: createStorage('dark'), hasSwitch: false });
    page.ready();
    page.restore();
    assert.equal(page.theme(), 'dark');
    assert.equal(page.favicon.href, 'assets/logo-mba-dark.png');
});

test('theme changes and history restoration never overwrite the logo URL selected by the HTML build', () => {
    const page = createPage();
    const initialLogo = page.logo.src;
    page.ready();
    for (const theme of ['dark', 'light', 'dark']) {
        page.choose(theme);
        page.restore();
        page.systemChange(theme !== 'dark');
        assert.equal(page.logo.src, initialLogo);
    }
});
