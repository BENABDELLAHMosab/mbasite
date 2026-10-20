const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Read the actual common script: a new or returning visitor must never be interrupted.
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const routes = ['index', 'about', 'skills', 'services', 'projects', 'experience', 'contact',
    'project-tmpa', 'project-etl', 'project-triz'];

function events() {
    const listeners = new Map();
    return {
        addEventListener(name, fn) {
            if (!listeners.has(name)) listeners.set(name, []);
            listeners.get(name).push(fn);
        },
        emit(name, value = {}) { for (const fn of listeners.get(name) || []) fn(value); }
    };
}

function page(route, initial, blocked) {
    const values = new Map(Object.entries(initial)), timers = new Map(), inserted = [];
    let nextId = 0;
    const storage = {
        getItem(key) { if (blocked) throw new Error('Storage unavailable'); return values.get(key) ?? null; },
        setItem(key, value) { if (blocked) throw new Error('Storage full'); values.set(key, String(value)); },
        removeItem(key) { if (blocked) throw new Error('Storage unavailable'); values.delete(key); }
    };
    const document = {
        ...events(), readyState: 'complete',
        body: { dataset: {}, insertAdjacentHTML: (_position, html) => inserted.push(html) },
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => []
    };
    const window = { ...events(), location: { pathname: '/' + route + '.html' }, localStorage: storage };
    vm.runInNewContext(source, {
        document, window, localStorage: storage, sessionStorage: storage,
        setTimeout(fn) { timers.set(++nextId, fn); return nextId; },
        clearTimeout(id) { timers.delete(id); }, requestAnimationFrame: fn => fn()
    });
    document.emit('DOMContentLoaded');
    // Drain delayed callbacks, then exercise history restoration and tab syncing.
    for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
    window.emit('pageshow', { persisted: true });
    window.emit('storage', { key: 'portfolio-tour-dismissed', storageArea: storage, newValue: 'true' });
    return { inserted, values, timers };
}

for (const scenario of [
    { name: 'a new visitor', initial: {} },
    { name: 'a visitor who dismissed all suggestions', initial: { 'portfolio-tour-dismissed': 'true' } },
    { name: 'a visitor with a legacy page dismissal', initial: { 'uxTourDismissed:about': '1234' } },
    { name: 'a visitor with blocked storage', initial: {}, blocked: true }
]) {
    test(scenario.name + ' sees no automatic navigation prompt on any portfolio page', () => {
        for (const route of routes) {
            const initial = { 'portfolio-theme': 'dark', ...scenario.initial };
            const p = page(route, initial, scenario.blocked);
            assert.deepEqual(p.inserted, [], route);
            assert.equal(p.timers.size, 0, route);
            assert.deepEqual(Object.fromEntries(p.values), initial, 'saved choices remain untouched on ' + route);
        }
    });
}
