const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/preloader.js'), 'utf8');

function page(withLoader = true) {
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
        window: { addEventListener: (event, fn) => { events[event] = fn; } },
        setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
        clearTimeout: key => timers.delete(key)
    });
    return { dataset, loader, events, fire(delay) {
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
    const p = page(false);
    p.events.pageshow({ persisted: true });
    assert.ok(!('preloading' in p.dataset));
});
