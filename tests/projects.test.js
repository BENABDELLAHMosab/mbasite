const test = require('node:test');
const assert = require('node:assert/strict');
const { projectCategoryFromUrl, initProjectFilters } = require('../js/projects.js');

function element({ category, filter, text = '', href, id = '' } = {}) {
    const listeners = new Map();
    const classes = new Set();
    return {
        dataset: { ...(category ? { category } : {}), ...(filter ? { filter } : {}) },
        id, hidden: false, style: {}, textContent: text, attributes: href ? { href } : {},
        classList: {
            toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
            contains: name => classes.has(name)
        },
        addEventListener(event, handler) { listeners.set(event, handler); },
        emit(event, data = {}) { listeners.get(event)?.(data); },
        setAttribute(name, value) { this.attributes[name] = value; },
        getAttribute(name) { return this.attributes[name] ?? null; },
        focus() { throw new Error('Filtering must preserve the native keyboard focus'); }
    };
}

function page({ href = 'https://portfolio.test/projects.html', reducedMotion = false, historyBlocked = false } = {}) {
    const buttons = [
        element({ filter: 'all', text: 'Tout' }),
        element({ filter: 'software', text: 'Software Engineering' }),
        element({ filter: 'data', text: 'Data/BI' }),
        element({ filter: 'cloud', text: 'Cloud & DevOps' })
    ];
    const ids = ['project-tmpa', 'project-etl', 'project-cloud', 'project-fullstack'];
    const cards = ['software', 'software data', 'cloud', 'software cloud'].map((category, index) => element({ category, id: ids[index] }));
    const caseLinks = ['project-tmpa.html', 'project-etl.html?from=featured#overview',
        'https://external.test/project-triz.html', 'contact.html'].map(href => element({ href }));
    const grid = element();
    const counter = { textContent: '', hidden: true };
    const animations = [];
    cards.forEach((card, index) => {
        card.getBoundingClientRect = () => {
            const visibleIndex = cards.filter(item => !item.hidden).indexOf(card);
            return { left: (visibleIndex % 2) * 300, top: Math.floor(visibleIndex / 2) * 350 };
        };
        card.animate = (frames, options) => {
            const animation = { card: index, frames, options, cancelled: false,
                finished: new Promise(() => {}), cancel() { this.cancelled = true; } };
            animations.push(animation);
            return animation;
        };
    });
    const window = element();
    window.location = { href };
    window.matchMedia = () => ({ matches: reducedMotion });
    const originalState = { keep: 'native-entry' };
    window.history = {
        state: originalState, scrollRestoration: 'auto', changes: [],
        replaceState(state, _title, url) {
            if (historyBlocked) throw new Error('History unavailable');
            assert.equal(state, originalState);
            this.changes.push(url);
            window.location.href = url;
        }
    };
    window.scrollTo = () => { throw new Error('Filtering must not override native scroll restoration'); };
    const document = {
        querySelectorAll: selector => selector === '.filter-btn' ? buttons : selector === '.project-card' ? cards : selector === '[data-case-link]' ? caseLinks : [],
        querySelector: selector => selector === '.projects-grid' ? grid : null,
        getElementById: id => id === 'project-filter-status' ? counter : null
    };
    initProjectFilters(document, window);
    return { window, buttons, cards, caseLinks, grid, counter, animations,
        click: filter => buttons.find(button => button.dataset.filter === filter).emit('click') };
}

test('a category deep link selects the related projects before any user interaction', () => {
    const view = page({ href: 'https://portfolio.test/projects.html?category=data#projects' });
    assert.deepEqual(view.cards.map(card => card.hidden), [true, false, true, true]);
    assert.equal(view.buttons[2].attributes['aria-pressed'], 'true');
    assert.equal(view.counter.textContent, '1 projet affiché — Data/BI');
    assert.equal(view.counter.hidden, false);
    assert.equal(view.grid.classList.contains('grid-center-1'), true);
    assert.equal(view.animations.length, 0, 'initial deep links must not wait for an entrance animation');
    assert.equal(view.window.history.changes.length, 0);
});

test('unknown or malformed categories leave all projects available', () => {
    const categories = ['all', 'software', 'data'];
    assert.equal(projectCategoryFromUrl('https://portfolio.test/projects.html?category=unknown', categories), 'all');
    assert.equal(projectCategoryFromUrl('broken', categories), 'all');
    const view = page({ href: 'https://portfolio.test/projects.html?category=%3Cscript%3E' });
    assert.ok(view.cards.every(card => !card.hidden));
    assert.equal(view.counter.textContent, '4 projets affichés');
});

test('filter changes retain unrelated query parameters, anchors and native history state', () => {
    const view = page({ href: 'https://portfolio.test/projects.html?from=skills#projects' });
    view.click('cloud');
    let url = new URL(view.window.location.href);
    assert.equal(url.searchParams.get('category'), 'cloud');
    assert.equal(url.searchParams.get('from'), 'skills');
    assert.equal(url.hash, '#projects');
    assert.equal(view.grid.classList.contains('grid-center-2'), true);
    assert.equal(view.counter.textContent, '2 projets affichés — Cloud & DevOps');
    view.click('all');
    url = new URL(view.window.location.href);
    assert.equal(url.searchParams.has('category'), false);
    assert.ok(view.cards.every(card => !card.hidden));
    assert.equal(view.window.history.scrollRestoration, 'auto');
});

test('quick successive filters cancel earlier animations; reduced motion skips them', () => {
    const view = page();
    view.click('cloud');
    const firstAnimations = [...view.animations];
    assert.equal(firstAnimations.length, 2);
    assert.ok(firstAnimations.every(animation => animation.options.duration >= 150 && animation.options.duration <= 220));
    view.click('data');
    assert.ok(firstAnimations.every(animation => animation.cancelled));
    assert.deepEqual(view.cards.map(card => card.hidden), [true, false, true, true]);
    const reduced = page({ reducedMotion: true });
    reduced.click('data');
    assert.equal(reduced.animations.length, 0);
    assert.equal(reduced.counter.textContent, '1 projet affiché — Data/BI');
});

test('returning through history restores the URL category without animation or scroll manipulation', () => {
    const view = page();
    view.click('cloud');
    const animationCount = view.animations.length;
    view.window.location.href = 'https://portfolio.test/projects.html?category=data#projects';
    view.window.emit('popstate');
    assert.deepEqual(view.cards.map(card => card.hidden), [true, false, true, true]);
    assert.equal(view.animations.length, animationCount);
    view.window.emit('pageshow', { persisted: true });
    assert.equal(view.counter.textContent, '1 projet affiché — Data/BI');
    assert.equal(view.window.history.changes.length, 1);
});

test('history restrictions do not break filter interactions or result counts', () => {
    const view = page({ historyBlocked: true });
    assert.doesNotThrow(() => view.click('data'));
    assert.equal(view.counter.textContent, '1 projet affiché — Data/BI');
    assert.equal(view.buttons[2].attributes['aria-pressed'], 'true');
});

test('case-study links carry the current validated category from initial deep links and later filter changes', () => {
    const view = page({ href: 'https://portfolio.test/projects.html?category=data#project-etl' });
    assert.equal(view.caseLinks[0].getAttribute('href'), '/project-tmpa.html?category=data');
    assert.equal(view.caseLinks[1].getAttribute('href'), '/project-etl.html?from=featured&category=data#overview');
    view.click('cloud');
    assert.equal(view.caseLinks[0].getAttribute('href'), '/project-tmpa.html?category=cloud');
    view.click('all');
    assert.equal(view.caseLinks[0].getAttribute('href'), '/project-tmpa.html');
    assert.equal(view.caseLinks[1].getAttribute('href'), '/project-etl.html?from=featured#overview');
    assert.equal(view.caseLinks[2].getAttribute('href'), 'https://external.test/project-triz.html');
    assert.equal(view.caseLinks[3].getAttribute('href'), 'contact.html');
    const unknown = page({ href: 'https://portfolio.test/projects.html?category=unknown' });
    assert.equal(unknown.caseLinks[0].getAttribute('href'), '/project-tmpa.html');
});

test('filtering drops only an anchor whose project becomes hidden, keeping visible and unrelated targets', () => {
    const view = page({ href: 'https://portfolio.test/projects.html?category=data#project-etl' });
    view.click('software');
    assert.equal(new URL(view.window.location.href).hash, '#project-etl', 'the target still belongs to Software');
    view.click('cloud');
    assert.equal(new URL(view.window.location.href).hash, '', 'a hidden project cannot remain the reload target');
    assert.equal(new URL(view.window.location.href).searchParams.get('category'), 'cloud');
    for (const fragment of ['#projects', '#unknown', '#bad%ZZ']) {
        const other = page({ href: 'https://portfolio.test/projects.html' + fragment });
        other.click('data');
        assert.equal(new URL(other.window.location.href).hash, fragment);
        assert.equal(new URL(other.window.location.href).searchParams.get('category'), 'data');
    }
});
