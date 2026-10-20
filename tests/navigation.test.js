const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/script.js'), 'utf8');

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

function element(attributes = {}) {
    const values = new Set(), styles = new Map(), attrs = new Map(Object.entries(attributes));
    return {
        ...events(), inert: false, focusCount: 0,
        classList: {
            add: value => values.add(value), remove: value => values.delete(value),
            contains: value => values.has(value),
            toggle(value, enabled) { if (enabled) values.add(value); else values.delete(value); }
        },
        style: {
            setProperty: (name, value, priority = '') => styles.set(name, { value, priority }),
            removeProperty: name => styles.delete(name),
            getPropertyValue: name => styles.get(name)?.value || '',
            getPropertyPriority: name => styles.get(name)?.priority || ''
        },
        setAttribute: (name, value) => attrs.set(name, String(value)),
        getAttribute: name => attrs.get(name) ?? null,
        removeAttribute: name => attrs.delete(name),
        focus() { this.focusCount++; }
    };
}

function page({ desktop = false, route = 'projects.html', navPage, x = 0, y = 730 } = {}) {
    const burger = element({ 'aria-expanded': 'false' }), overlay = element();
    const links = ['about.html', 'skills.html', 'services.html', 'projects.html', 'experience.html', 'contact.html',
        'document/CV_Mosab_BEN_ABDELLAH_PFE_2027.pdf'].map(href => element({ href }));
    links.at(-1).setAttribute('target', '_blank');
    const body = element(), root = element(), breakpoint = { ...events(), matches: desktop };
    body.dataset = { navPage };
    const scrollCalls = [];
    const document = {
        ...events(), body, documentElement: root, readyState: 'complete', activeElement: null,
        getElementById: () => null,
        querySelector: selector => ({ '.burger-menu': burger, '.mobile-nav-overlay': overlay })[selector] || null,
        querySelectorAll: selector => ['.mobile-nav-overlay .nav-link', '.nav-link'].includes(selector) ? links : []
    };
    const window = {
        ...events(), location: { pathname: '/' + route }, scrollX: x, scrollY: y,
        matchMedia: () => breakpoint,
        scrollTo(options) {
            scrollCalls.push(options);
            this.scrollX = options.left; this.scrollY = options.top;
        }
    };
    const store = { getItem: key => key === 'portfolio-tour-dismissed' ? 'true' : null };
    vm.runInNewContext(source, { document, window, localStorage: store, sessionStorage: store });
    document.emit('DOMContentLoaded');
    return { document, window, burger, overlay, links, body, root, breakpoint, scrollCalls };
}

test('mobile navigation locks the background and restores the exact reading position without smooth scrolling', () => {
    const p = page({ x: 4, y: 730 });
    p.root.style.setProperty('scroll-behavior', 'smooth', 'important');
    p.body.style.setProperty('--mobile-menu-top', 'existing');
    p.burger.emit('click');
    assert.equal(p.burger.getAttribute('aria-label'), 'Fermer le menu');
    assert.equal(p.burger.getAttribute('aria-expanded'), 'true');
    assert.equal(p.body.classList.contains('mobile-menu-open'), true);
    assert.equal(p.root.classList.contains('mobile-menu-open'), true);
    assert.equal(p.body.style.getPropertyValue('--mobile-menu-top'), '-730px');
    assert.equal(p.body.style.getPropertyValue('--mobile-menu-left'), '-4px');
    assert.equal(p.overlay.inert, false);
    assert.equal(p.links[0].focusCount, 1);
    // Fixed positioning can set the document's visible scroll offset to zero.
    p.window.scrollX = 0; p.window.scrollY = 0;
    let prevented = false;
    p.document.emit('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(p.burger.getAttribute('aria-label'), 'Ouvrir le menu');
    assert.equal(p.overlay.inert, true);
    assert.equal(p.body.classList.contains('mobile-menu-open'), false);
    assert.equal(p.root.classList.contains('mobile-menu-open'), false);
    assert.equal(p.burger.focusCount, 1);
    assert.equal(p.window.scrollX, 4); assert.equal(p.window.scrollY, 730);
    assert.equal(p.scrollCalls[0].behavior, 'instant');
    assert.equal(p.body.style.getPropertyValue('--mobile-menu-top'), 'existing');
    assert.equal(p.body.style.getPropertyValue('--mobile-menu-left'), '');
    assert.equal(p.root.style.getPropertyValue('scroll-behavior'), 'smooth');
    assert.equal(p.root.style.getPropertyPriority('scroll-behavior'), 'important');
});

test('following a link, resizing to desktop and returning from history always release the scroll lock', () => {
    for (const reason of ['link', 'desktop', 'history', 'pagehide']) {
        const p = page();
        p.burger.emit('click');
        if (reason === 'link') p.links[3].emit('click');
        if (reason === 'desktop') { p.breakpoint.matches = true; p.breakpoint.emit('change'); }
        if (reason === 'history') p.window.emit('pageshow', { persisted: true });
        if (reason === 'pagehide') p.window.emit('pagehide');
        assert.equal(p.burger.getAttribute('aria-expanded'), 'false', reason);
        assert.equal(p.body.classList.contains('mobile-menu-open'), false, reason);
        assert.equal(p.overlay.inert, true, reason);
        assert.equal(p.window.scrollY, 730, reason);
        assert.equal(p.scrollCalls.length, 1, reason);
    }
});

test('desktop cannot open the mobile overlay and keyboard focus stays inside the open navigation', () => {
    const desktop = page({ desktop: true });
    desktop.burger.emit('click');
    assert.equal(desktop.burger.getAttribute('aria-expanded'), 'false');
    assert.equal(desktop.scrollCalls.length, 0);
    const mobile = page(); mobile.burger.emit('click');
    mobile.document.activeElement = mobile.links.at(-1);
    mobile.document.emit('keydown', { key: 'Tab', shiftKey: false, preventDefault() {} });
    assert.equal(mobile.burger.focusCount, 1);
    mobile.document.activeElement = mobile.burger;
    mobile.document.emit('keydown', { key: 'Tab', shiftKey: true, preventDefault() {} });
    assert.equal(mobile.links.at(-1).focusCount, 1);
});

test('the current route is marked semantically for assistive technology', () => {
    const p = page();
    assert.equal(p.links[3].getAttribute('aria-current'), 'page');
    assert.equal(p.links[3].classList.contains('active'), true);
    for (const link of p.links.filter((_link, index) => index !== 3)) {
        assert.equal(link.getAttribute('aria-current'), null);
        assert.equal(link.classList.contains('active'), false);
    }
});

test('a project detail marks its parent section as the current location, rather than the same page', () => {
    const p = page({ route: 'project-tmpa.html', navPage: 'projects.html' });
    assert.equal(p.links[3].getAttribute('aria-current'), 'location');
    assert.equal(p.links[3].classList.contains('active'), true);
    assert.equal(p.links[0].getAttribute('aria-current'), null);
});

test('opening the seventh mobile link (CV) restores focus and releases the page scroll lock', () => {
    const p = page({ y: 920 });
    p.burger.emit('click');
    const cv = p.links.at(-1);
    p.document.activeElement = cv;
    p.window.scrollY = 0;
    cv.emit('click');
    assert.equal(p.burger.focusCount, 1);
    assert.equal(p.overlay.inert, true);
    assert.equal(p.burger.getAttribute('aria-expanded'), 'false');
    assert.equal(p.body.classList.contains('mobile-menu-open'), false);
    assert.equal(p.window.scrollY, 920);
});

test('modified and middle clicks keep native link behavior and restore focus in the page left open', () => {
    for (const event of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
        const p = page();
        p.burger.emit('click');
        p.document.activeElement = p.links[0];
        p.links[0].emit(event.button === 1 ? 'auxclick' : 'click', {
            ...event, preventDefault() { throw new Error('Native new-context navigation must remain available'); }
        });
        assert.equal(p.burger.focusCount, 1, JSON.stringify(event));
        assert.equal(p.overlay.inert, true);
        assert.equal(p.window.scrollY, 730);
    }
    const ordinary = page();
    ordinary.burger.emit('click');
    ordinary.links[0].emit('click');
    assert.equal(ordinary.burger.focusCount, 0, 'ordinary navigation need not move focus in the page being replaced');
});
