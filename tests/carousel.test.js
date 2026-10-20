const test = require('node:test');
const assert = require('node:assert/strict');
const { initProjectCarousel, initProjectGallery } = require('../js/project-gallery.js');

function element(extra = {}) {
    const events = new Map(), attrs = {};
    const classes = new Set();
    return {
        hidden: false, isConnected: true, focusCount: 0, ...extra,
        setAttribute(name, value) { attrs[name] = String(value); },
        getAttribute(name) { return attrs[name] ?? null; },
        hasAttribute(name) { return name in attrs; },
        focus() { this.focusCount++; },
        classList: {
            add(name) { classes.add(name); },
            contains(name) { return classes.has(name); },
            toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }
        },
        addEventListener(type, callback) {
            if (!events.has(type)) events.set(type, []);
            events.get(type).push(callback);
        },
        emit(type, input = {}) {
            const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...input };
            for (const callback of events.get(type) || []) callback(event);
            return event;
        }
    };
}

function fixture({ reduced = false, supported = true } = {}) {
    const motion = element({ matches: reduced });
    const animations = [];
    const slides = ['Builder', 'Conteneurs', 'Prévisualisation'].map((label, index) => {
        const image = element();
        image.setAttribute('alt', label);
        image.animate = () => { const animation = { cancelled: false, cancel() { this.cancelled = true; } }; animations.push(animation); return animation; };
        const figureCaption = { textContent: 'Description ' + label };
        const link = element();
        const slide = element();
        link.setAttribute('href', 'assets/projects/evidence/shot-' + index + '.webp');
        link.querySelector = selector => selector === 'img' ? image : null;
        link.closest = selector => selector === 'figure' ? slide : null;
        slide.querySelector = selector => ({
            '[data-gallery-link]': link, 'img': image,
            '[data-gallery-caption]': figureCaption, 'figcaption': figureCaption
        })[selector] || null;
        return { slide, link, image };
    });
    const previous = element(), next = element(), count = element({ textContent: '' }), status = element({ textContent: '' });
    const root = element();
    root.querySelectorAll = selector => selector === '[data-carousel-slide]' ? slides.map(item => item.slide) : [];
    root.querySelector = selector => ({
        '[data-slide-prev]': previous, '[data-slide-next]': next,
        '[data-carousel-count]': count, '[data-carousel-status]': status
    })[selector] || null;
    const close = element(), modalPrevious = element(), modalNext = element();
    const modalImage = element(), modalCaption = element({ textContent: '' }), modalCount = element({ textContent: '' });
    const dialog = element({
        open: false,
        close() { this.open = false; this.emit('close'); },
        getBoundingClientRect() { return { left: 10, top: 10, right: 100, bottom: 100 }; }
    });
    if (supported) dialog.showModal = function () { this.open = true; };
    dialog.querySelector = selector => ({ '[data-gallery-prev]': modalPrevious, '[data-gallery-next]': modalNext })[selector];
    const body = element({ dataset: { projectId: 'project-tmpa' } });
    const document = {
        body,
        getElementById: id => ({
            'project-image-dialog': dialog, 'project-image-full': modalImage,
            'project-image-caption': modalCaption, 'project-image-count': modalCount
        })[id] || null,
        querySelector: selector => selector === '[data-gallery-close]' ? close : null,
        querySelectorAll: selector => ({
            '[data-project-carousel]': [root], '[data-gallery-link]': slides.map(item => item.link),
            '[data-project-return]': []
        })[selector] || []
    };
    const window = { location: { href: 'https://portfolio.test/project-tmpa.html?category=software' }, matchMedia: () => motion };
    return { root, previous, next, count, status, slides, animations, motion, dialog, close, modalNext,
        modalPrevious, modalImage, modalCaption, modalCount, body, document, window };
}

test('manual carousel keeps exactly one capture visible, wraps both ways and announces its matching description', () => {
    const f = fixture();
    initProjectCarousel(f.root, f.window);
    assert.deepEqual(f.slides.map(item => item.slide.hidden), [false, true, true]);
    assert.equal(f.count.textContent, '1 / 3');
    assert.equal(f.status.textContent, '', 'initial setup is silent');
    f.previous.emit('click');
    assert.deepEqual(f.slides.map(item => item.slide.hidden), [true, true, false]);
    assert.equal(f.count.textContent, '3 / 3');
    assert.match(f.status.textContent, /Description Prévisualisation/);
    f.next.emit('click');
    assert.equal(f.count.textContent, '1 / 3');
    assert.equal(f.next.focusCount, 0, 'changing a slide never forces keyboard focus');
});

test('carousel arrow keys preserve text-entry and modified shortcuts', () => {
    const f = fixture(); initProjectCarousel(f.root, f.window);
    assert.equal(f.root.emit('keydown', { key: 'ArrowRight' }).defaultPrevented, true);
    assert.equal(f.count.textContent, '2 / 3');
    for (const event of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { target: { tagName: 'INPUT' } }, { target: { isContentEditable: true } }]) {
        assert.equal(f.root.emit('keydown', { key: 'ArrowRight', ...event }).defaultPrevented, false);
        assert.equal(f.count.textContent, '2 / 3');
    }
});

test('rapid navigation cancels prior fades and reduced motion leaves all changes immediate', () => {
    const f = fixture(); initProjectCarousel(f.root, f.window);
    f.next.emit('click'); f.next.emit('click');
    assert.equal(f.animations[0].cancelled, true);
    f.motion.matches = true; f.motion.emit('change');
    assert.equal(f.animations[1].cancelled, true);
    f.next.emit('click');
    assert.equal(f.animations.length, 2);
    assert.equal(f.count.textContent, '1 / 3');
    const reduced = fixture({ reduced: true }); initProjectCarousel(reduced.root, reduced.window);
    reduced.next.emit('click');
    assert.equal(reduced.animations.length, 0);
});

test('enlarged image arrows synchronize the visible page capture, caption, counter and restored focus', () => {
    const f = fixture(); initProjectGallery(f.document, f.window);
    f.next.emit('click');
    f.slides[1].link.emit('click');
    assert.equal(f.dialog.open, true);
    assert.equal(f.modalCaption.textContent, 'Description Conteneurs');
    assert.equal(f.modalCount.textContent, '2 / 3');
    f.modalNext.emit('click');
    assert.equal(f.modalImage.getAttribute('src'), 'assets/projects/evidence/shot-2.webp');
    assert.equal(f.modalImage.getAttribute('alt'), 'Prévisualisation');
    assert.equal(f.modalCaption.textContent, 'Description Prévisualisation');
    assert.equal(f.count.textContent, '3 / 3');
    f.close.emit('click');
    assert.equal(f.slides[2].link.focusCount, 1, 'focus returns to the currently visible capture');
    assert.equal(f.slides[1].link.focusCount, 0, 'a now-hidden capture is not focused');
    assert.equal(f.body.classList.contains('project-gallery-open'), false);
});

test('carousel remains usable when modal dialogs are unsupported', () => {
    const f = fixture({ supported: false }); initProjectGallery(f.document, f.window);
    f.next.emit('click');
    assert.equal(f.count.textContent, '2 / 3');
    assert.equal(f.slides[1].link.emit('click').defaultPrevented, false);
});

test('enlarged view supports arrow keys and preserves modified keyboard shortcuts', () => {
    const f = fixture(); initProjectGallery(f.document, f.window);
    f.slides[0].link.emit('click');
    assert.equal(f.dialog.emit('keydown', { key: 'ArrowLeft' }).defaultPrevented, true);
    assert.equal(f.modalCount.textContent, '3 / 3');
    assert.equal(f.dialog.emit('keydown', { key: 'ArrowRight', ctrlKey: true }).defaultPrevented, false);
    assert.equal(f.modalCount.textContent, '3 / 3');
    f.dialog.close();
    assert.equal(f.slides[2].link.focusCount, 1);
});

