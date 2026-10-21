const assert = require('node:assert/strict');
const { test } = require('node:test');
const { projectGalleryReturnHref, initProjectGallery } = require('../js/project-gallery.js');

function eventTarget(extra = {}) {
    const handlers = new Map();
    return {
        ...extra,
        addEventListener(type, callback) {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(callback);
        },
        emit(type, overrides = {}) {
            const event = {
                button: 0, defaultPrevented: false,
                preventDefault() { this.defaultPrevented = true; },
                ...overrides
            };
            for (const callback of handlers.get(type) || []) callback(event);
            return event;
        }
    };
}

function page({ supported = true, failOpen = false, category = 'data', alt = 'Vue du pipeline Pentaho', figureCaption = 'Chargement des faits', galleryCaption = null, lockedInitially = false } = {}) {
    const attributes = { src: 'initial.webp', alt: '' };
    const fullImage = { setAttribute(name, value) { attributes[name] = value; } };
    const caption = { textContent: '' };
    const closeButton = eventTarget({ focusCount: 0, focus() { this.focusCount++; } });
    const returnLink = { href: '', setAttribute(name, value) { this[name] = value; } };
    const link = eventTarget({
        isConnected: true, focusCount: 0,
        focus() { this.focusCount++; },
        getAttribute(name) { return name === 'href' ? 'assets/projects/evidence/pipeline.webp' : null; },
        hasAttribute() { return false; },
        querySelector(selector) { return selector === 'img' ? { getAttribute: () => alt } : null; },
        closest() {
            return {
                querySelector(selector) {
                    const text = selector === '[data-gallery-caption]' ? galleryCaption : figureCaption;
                    return text === null ? null : { textContent: text };
                }
            };
        }
    });
    const dialog = eventTarget({
        open: false,
        getBoundingClientRect() { return { left: 100, right: 800, top: 100, bottom: 600 }; },
        close() { this.open = false; this.emit('close'); }
    });
    if (supported) dialog.showModal = function () {
        if (failOpen) throw new Error('Dialog cannot open');
        this.open = true;
    };
    const classes = new Set(lockedInitially ? ['project-gallery-open'] : []);
    const body = {
        dataset: { projectId: 'project-etl' },
        classList: {
            contains(name) { return classes.has(name); },
            add(name) { classes.add(name); },
            toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
        }
    };
    const document = {
        body,
        querySelectorAll(selector) {
            if (selector === '[data-project-return]') return [returnLink];
            if (selector === '[data-gallery-link]') return [link];
            return [];
        },
        querySelector() { return closeButton; },
        getElementById(id) {
            return { 'project-image-dialog': dialog, 'project-image-full': fullImage, 'project-image-caption': caption }[id];
        }
    };
    initProjectGallery(document, { location: { href: `https://portfolio.test/project-etl.html?category=${category}` } });
    return { dialog, link, attributes, caption, closeButton, returnLink, body };
}

test('project return destination keeps only known categories and safe project anchors', () => {
    for (const category of ['software', 'data', 'cloud', 'ia', 'mobile']) {
        assert.equal(projectGalleryReturnHref(`https://portfolio.test/detail.html?category=${category}`, 'project-tmpa'),
            `projects.html?category=${category}#project-tmpa`);
    }
    assert.equal(projectGalleryReturnHref('https://portfolio.test/detail.html?category=all', 'project-etl'), 'projects.html#project-etl');
    assert.equal(projectGalleryReturnHref('https://portfolio.test/detail.html?category=unknown', 'project-etl'), 'projects.html#project-etl');
    assert.equal(projectGalleryReturnHref('invalid', 'project-etl'), 'projects.html#project-etl');
    assert.equal(projectGalleryReturnHref('https://portfolio.test/', 'project-etl?redirect=other'), null);
    assert.equal(projectGalleryReturnHref('https://portfolio.test/', ''), null);
});

test('filtered return links resolve inside the same local or hosted portfolio directory', () => {
    for (const [detail, expected] of [
        ['file:///C:/Users/Pro/My%20Portfolio/project-etl.html?category=data&from=featured#overview',
            'file:///C:/Users/Pro/My%20Portfolio/projects.html?category=data#project-etl'],
        ['https://portfolio.test/portfolio/project-etl.html?category=data&from=featured#overview',
            'https://portfolio.test/portfolio/projects.html?category=data#project-etl']
    ]) {
        const returnHref = projectGalleryReturnHref(detail, 'project-etl');
        assert.equal(new URL(returnHref, detail).href, expected);
    }
});

test('unsupported dialogs preserve image navigation and the filtered return link', () => {
    const state = page({ supported: false });
    assert.equal(state.returnLink.href, 'projects.html?category=data#project-etl');
    assert.equal(state.link.emit('click').defaultPrevented, false);
    assert.equal(state.attributes.src, 'initial.webp');
});

test('plain image activation opens an accessible dialog and close returns focus', () => {
    const state = page();
    const click = state.link.emit('click');
    assert.equal(click.defaultPrevented, true);
    assert.equal(state.dialog.open, true);
    assert.deepEqual(state.attributes, { src: 'assets/projects/evidence/pipeline.webp', alt: 'Vue du pipeline Pentaho' });
    assert.equal(state.caption.textContent, 'Chargement des faits');
    assert.equal(state.closeButton.focusCount, 1);
    state.closeButton.emit('click');
    assert.equal(state.dialog.open, false);
    assert.equal(state.link.focusCount, 1);
});

test('modified clicks and existing browser actions keep their native destination', () => {
    for (const overrides of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
        const state = page();
        const click = state.link.emit('click', overrides);
        assert.equal(click.defaultPrevented, !!overrides.defaultPrevented);
        assert.equal(state.dialog.open, false);
    }
});

test('failed modal opening falls back to the original image link', () => {
    const state = page({ failOpen: true });
    assert.equal(state.link.emit('click').defaultPrevented, false);
    assert.equal(state.dialog.open, false);
    assert.equal(state.closeButton.focusCount, 0);
    assert.equal(state.body.classList.contains('project-gallery-open'), false);
});

test('only a click outside the dialog bounds dismisses the backdrop', () => {
    const state = page();
    state.link.emit('click');
    state.dialog.emit('click', { target: state.dialog, clientX: 110, clientY: 110 });
    assert.equal(state.dialog.open, true, 'padding inside the dialog is not the backdrop');
    state.dialog.emit('click', { target: {}, clientX: 20, clientY: 20 });
    assert.equal(state.dialog.open, true, 'clicks on dialog children do not dismiss it');
    state.dialog.emit('click', { target: state.dialog, clientX: 20, clientY: 20 });
    assert.equal(state.dialog.open, false);
    assert.equal(state.link.focusCount, 1);
});

test('native close, including Escape, restores focus without overriding keyboard behavior', () => {
    const state = page();
    state.link.emit('click');
    state.dialog.close();
    assert.equal(state.link.focusCount, 1);
    state.dialog.emit('close');
    assert.equal(state.link.focusCount, 1, 'a second close event must not focus a stale link');
});

test('closing never focuses a detached image link', () => {
    const state = page();
    state.link.emit('click');
    state.link.isConnected = false;
    state.dialog.close();
    assert.equal(state.link.focusCount, 0);
});

test('caption can name a capture without alt text; missing descriptions keep the native link', () => {
    const state = page({ alt: '' });
    assert.equal(state.link.emit('click').defaultPrevented, true);
    assert.equal(state.attributes.alt, 'Chargement des faits');
    const unnamed = page({ alt: '', figureCaption: null });
    assert.equal(unnamed.link.emit('click').defaultPrevented, false);
    assert.equal(unnamed.dialog.open, false);
});

test('modal caption omits the separate instruction to enlarge the image', () => {
    const state = page({ galleryCaption: 'Vue du Builder', figureCaption: 'Vue du Builder Cliquer pour agrandir' });
    state.link.emit('click');
    assert.equal(state.caption.textContent, 'Vue du Builder');
    assert.equal(state.attributes.alt, 'Vue du pipeline Pentaho');
});

test('opening locks background scroll and closing restores its previous class state', () => {
    for (const lockedInitially of [false, true]) {
        const state = page({ lockedInitially });
        assert.equal(state.body.classList.contains('project-gallery-open'), lockedInitially);
        state.link.emit('click');
        assert.equal(state.body.classList.contains('project-gallery-open'), true);
        state.dialog.close();
        assert.equal(state.body.classList.contains('project-gallery-open'), lockedInitially);
        state.link.emit('click');
        state.dialog.close();
        assert.equal(state.body.classList.contains('project-gallery-open'), lockedInitially, 'repeated openings preserve the original state');
    }
});
