const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual common script and button handlers with a deterministic clock.
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');
const dismissKey = 'portfolio-tour-dismissed';
const routes = ['index', 'about', 'skills', 'services', 'projects', 'experience', 'contact'];

function storage(values = {}) {
    const entries = new Map(Object.entries(values));
    return {
        denyReads: false, denyWrites: false,
        getItem(key) {
            if (this.denyReads) throw new Error('Storage blocked');
            return entries.get(key) ?? null;
        },
        setItem(key, value) {
            if (this.denyWrites) throw new Error('Storage full');
            entries.set(key, String(value));
        },
        removeItem(key) { entries.delete(key); }
    };
}

function events() {
    const listeners = new Map();
    return {
        addEventListener(name, fn) {
            if (!listeners.has(name)) listeners.set(name, []);
            listeners.get(name).push(fn);
        },
        emit(name, value = {}) {
            for (const fn of listeners.get(name) || []) fn(value);
        }
    };
}

function classes() {
    const values = new Set();
    return { add: name => values.add(name), remove: name => values.delete(name), contains: name => values.has(name) };
}

function page({ route = 'index', local = storage(), session = storage(), deferFrames = false } = {}) {
    let now = 0, nextId = 0, prompt = null;
    const timers = new Map(), frames = [];
    const setTimeout = (fn, delay) => {
        timers.set(++nextId, { fn, at: now + delay });
        return nextId;
    };
    const body = {
        classList: classes(),
        style: { setProperty() {}, removeProperty() {} },
        insertAdjacentHTML(_position, html) {
            const buttons = Object.fromEntries(['.smart-close', '.btn-prompt-secondary', '.btn-prompt-primary'].map(selector => [selector, events()]));
            const element = {
                html, buttons, classList: classes(), style: {}, offsetHeight: 120,
                getBoundingClientRect: () => ({ height: 120 }),
                querySelector: selector => buttons[selector],
                remove() { if (prompt === element) prompt = null; }
            };
            prompt = element;
        }
    };
    const document = {
        ...events(), body, readyState: 'complete',
        getElementById: () => null,
        querySelector: selector => selector === '.smart-prompt' ? prompt : null,
        querySelectorAll: () => []
    };
    const window = { ...events(), location: { pathname: '/' + route + '.html', href: '' }, localStorage: local };
    vm.runInNewContext(source, {
        document, window, localStorage: local, sessionStorage: session,
        setTimeout, clearTimeout: id => timers.delete(id),
        requestAnimationFrame: fn => deferFrames ? frames.push(fn) : fn()
    });
    document.emit('DOMContentLoaded');
    return {
        local, session, body, window,
        prompt: () => prompt,
        advance(ms) {
            const end = now + ms;
            for (;;) {
                const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
                if (!next) break;
                const [id, timer] = next;
                now = timer.at; timers.delete(id); timer.fn();
            }
            now = end;
        },
        click(selector) {
            assert.ok(prompt, 'the suggestion must exist before clicking it');
            prompt.buttons[selector].emit('click');
        },
        storageEvent(key = dismissKey, storageArea = local, newValue = 'true') {
            window.emit('storage', { key, storageArea, newValue });
        },
        restore() { window.emit('pageshow', { persisted: true }); },
        flushFrames() { while (frames.length) frames.shift()(); }
    };
}

test('an eligible new visitor sees the usual suggestion once after ten seconds', () => {
    const p = page();
    p.advance(9999); assert.equal(p.prompt(), null);
    p.advance(1); assert.ok(p.prompt().html.includes('Découvrir le profil'));
    const first = p.prompt();
    p.advance(30000); assert.equal(p.prompt(), first);
    assert.equal(p.local.getItem(dismissKey), null);
    assert.equal(p.local.getItem('portfolio-tour-storage-check'), null);
});

for (const button of ['.smart-close', '.btn-prompt-secondary']) {
    test(`${button} suppresses the entire tour across all pages, reloads and later visits`, () => {
        const local = storage({ 'portfolio-theme': 'dark' }), session = storage();
        const p = page({ route: 'about', local, session });
        p.advance(10000); p.click(button); p.advance(400);
        assert.equal(p.prompt(), null);
        assert.equal(p.body.classList.contains('ux-toast-open'), false);
        assert.equal(local.getItem(dismissKey), 'true');
        assert.equal(local.getItem('portfolio-theme'), 'dark');
        for (const route of routes) {
            for (const visitSession of [session, storage()]) {
                const next = page({ route, local, session: visitSession });
                next.advance(30000);
                assert.equal(next.prompt(), null, route);
            }
        }
    });
}

test('accepting the suggestion navigates normally without disabling the tour', () => {
    const local = storage(), session = storage();
    const p = page({ route: 'about', local, session });
    p.advance(10000); p.click('.btn-prompt-primary');
    assert.equal(p.window.location.href, 'skills.html');
    assert.equal(session.getItem('uxTourShown:about'), 'true');
    assert.equal(local.getItem(dismissKey), null);
    const back = page({ route: 'about', local, session });
    back.advance(10000); assert.equal(back.prompt(), null);
    const next = page({ route: 'skills', local, session });
    next.advance(10000); assert.ok(next.prompt());
});

test('a previous dismissal on any page becomes a global choice, without the former 24-hour expiry', () => {
    for (const route of ['home', 'about', 'skills', 'services', 'projects', 'experience', 'contact']) {
        const local = storage({ [`uxTourDismissed:${route}`]: String(Date.now() - 7 * 86400000) });
        const p = page({ route: 'contact', local });
        p.advance(30000);
        assert.equal(p.prompt(), null, route);
        assert.equal(local.getItem(dismissKey), 'true', route);
    }
    const invalid = page({ local: storage({ 'uxTourDismissed:about': 'invalid' }) });
    invalid.advance(10000); assert.ok(invalid.prompt());
});

test('dismissing in another tab hides visible prompts and cancels pending prompts', () => {
    const local = storage();
    const origin = page({ local }), visible = page({ route: 'about', local }), pending = page({ route: 'contact', local });
    origin.advance(10000); visible.advance(10000); pending.advance(5000);
    origin.click('.smart-close');
    visible.storageEvent(); pending.storageEvent();
    visible.advance(30000); pending.advance(30000);
    assert.equal(visible.prompt(), null); assert.equal(pending.prompt(), null);
    assert.equal(visible.body.classList.contains('ux-toast-open'), false);
});

test('the delayed callback rechecks the shared choice even if a storage event was missed', () => {
    const local = storage(), pending = page({ local });
    pending.advance(5000); local.setItem(dismissKey, 'true');
    pending.advance(30000); assert.equal(pending.prompt(), null);
});

test('returning through browser history honors dismissal from another page', () => {
    const local = storage(), p = page({ local });
    p.advance(10000); assert.ok(p.prompt());
    local.setItem(dismissKey, 'true'); p.restore(); p.advance(400);
    assert.equal(p.prompt(), null);
});

test('a queued entrance cannot reopen a prompt dismissed before its animation frame', () => {
    const p = page({ deferFrames: true });
    p.advance(10000); p.click('.btn-prompt-secondary');
    p.flushFrames(); p.advance(400);
    assert.equal(p.prompt(), null);
    assert.equal(p.body.classList.contains('ux-toast-open'), false);
});

test('blocked or full storage disables the optional prompt instead of showing it on every page', () => {
    for (const failure of ['denyReads', 'denyWrites']) {
        const local = storage(); local[failure] = true;
        const p = page({ local }); p.advance(30000);
        assert.equal(p.prompt(), null, failure);
    }
});

test('storage filling up after display still allows closing, with a session fallback', () => {
    const local = storage(), session = storage(), p = page({ local, session });
    p.advance(10000); local.denyWrites = true;
    p.click('.smart-close'); p.advance(400);
    assert.equal(p.prompt(), null);
    assert.equal(session.getItem(dismissKey), 'true');
    const next = page({ route: 'contact', local, session });
    next.advance(30000); assert.equal(next.prompt(), null);
});

test('unrelated, session-storage and stale events do not dismiss a visitor’s active suggestion', () => {
    const p = page(); p.advance(10000);
    p.storageEvent('portfolio-theme');
    p.storageEvent(dismissKey, p.session);
    p.storageEvent(); // Claimed true, but the actual current localStorage value is absent.
    p.advance(400); assert.ok(p.prompt());
});
