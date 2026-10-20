const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/preloader.js'), 'utf8');

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
        }
    };
}

function page({ withLoader = true, session = storage(), deniedGetter = false } = {}) {
    const dataset = {};
    const timers = new Map();
    const events = {};
    const loader = { hidden: false, classList: { add() {} } };
    let id = 0;
    vm.runInNewContext(source, {
        document: {
            documentElement: { dataset, removeAttribute() { delete dataset.preloading; } },
            getElementById: () => withLoader ? loader : null,
            addEventListener: (event, fn) => { events[event] = fn; }
        },
        window: {
            get sessionStorage() {
                if (deniedGetter) throw new Error('Storage unavailable');
                return session;
            },
            addEventListener: (event, fn) => { events[event] = fn; }
        },
        setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
        clearTimeout: key => timers.delete(key)
    });
    return { dataset, loader, events, timers, session, fire(delay) {
        for (const [key, timer] of [...timers]) if (timer.delay === delay) {
            timers.delete(key); timer.fn();
        }
    } };
}

test('a stalled DOM or deferred resource cannot keep the preloader visible beyond its deadline', () => {
    const p = page();
    assert.ok('preloading' in p.dataset);
    p.fire(2500);
    assert.ok(!('preloading' in p.dataset));
    assert.equal(p.loader.hidden, true);
    p.events.DOMContentLoaded(); p.fire(300);
    assert.equal(p.loader.hidden, true);
});

test('normal DOM readiness releases the loader after its fade, without waiting for images', () => {
    const p = page();
    p.events.DOMContentLoaded(); p.fire(300);
    assert.equal(p.loader.hidden, true);
    assert.ok(!('preloading' in p.dataset));
});

test('a restored page or missing loader never blocks content', () => {
    const p = page({ withLoader: false });
    p.events.pageshow({ persisted: true });
    assert.ok(!('preloading' in p.dataset));
});

test('the introduction appears once per tab session, including other pages and reloads', () => {
    const session = storage();
    const first = page({ session });
    assert.ok('preloading' in first.dataset);
    assert.equal(session.getItem('portfolio-preloader-seen'), 'true');
    first.events.DOMContentLoaded(); first.fire(300);
    for (let visit = 0; visit < 8; visit++) {
        const next = page({ session });
        assert.ok(!('preloading' in next.dataset));
        assert.equal(next.timers.size, 0, 'later visits must not schedule an artificial delay');
    }
    const newSession = page();
    assert.ok('preloading' in newSession.dataset, 'a fresh tab session may show the introduction');
});

test('blocked, full or inaccessible session storage omits the optional introduction', () => {
    for (const failure of ['denyReads', 'denyWrites', 'getter']) {
        const session = storage();
        session[failure] = true;
        const p = page({ session, deniedGetter: failure === 'getter' });
        assert.ok(!('preloading' in p.dataset), failure);
        assert.equal(p.timers.size, 0, failure);
    }
});

test('a stalled first arrival does not replay the introduction on the following navigation', () => {
    const session = storage(), first = page({ session });
    first.fire(2500);
    const next = page({ session });
    assert.ok(!('preloading' in next.dataset));
    assert.equal(next.timers.size, 0);
});
