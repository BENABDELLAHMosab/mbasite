const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildContactMailto, copyContactEmail } = require('../js/contact.js');

test('contact draft includes the reply address, name and complete message', () => {
    const url = new URL(buildContactMailto({
        name: '  Zoé Dupont  ', email: ' zoe@example.com ', message: ' Bonjour Mosab,\nUn stage à Paris ? '
    }));
    assert.equal(url.protocol, 'mailto:');
    assert.equal(url.pathname, 'mossabbenabdellah7@gmail.com');
    assert.equal(url.searchParams.get('subject'), 'Contact depuis le portfolio - Zoé Dupont');
    assert.equal(url.searchParams.get('body'), 'Nom : Zoé Dupont\r\nEmail : zoe@example.com\r\n\r\nBonjour Mosab,\nUn stage à Paris ?');
});

test('mail parameters cannot be injected through user text', () => {
    const url = new URL(buildContactMailto({
        name: 'A\r\nB &bcc=other@example.com', email: 'me@example.com', message: 'Question &subject=autre # + é %'
    }));
    assert.equal(url.searchParams.size, 2);
    assert.equal(url.searchParams.has('bcc'), false);
    assert.equal(url.searchParams.get('subject'), 'Contact depuis le portfolio - A B &bcc=other@example.com');
    assert.ok(url.searchParams.get('body').endsWith('Question &subject=autre # + é %'));
});

function fallbackInput() {
    return {
        hidden: true, value: '', focused: false, selected: false, selection: null,
        focus() { this.focused = true; },
        select() { this.selected = true; },
        setSelectionRange(start, end) { this.selection = [start, end]; }
    };
}

test('copy confirms success only after the Clipboard API accepts the address', async () => {
    const input = fallbackInput();
    input.hidden = false;
    let written = null;
    let resolveCopy;
    const copying = copyContactEmail({
        navigator: { clipboard: { writeText: value => { written = value; return new Promise(resolve => { resolveCopy = resolve; }); } } },
        fallbackInput: input
    });
    assert.equal(written, 'mossabbenabdellah7@gmail.com');
    assert.equal(input.hidden, false);
    resolveCopy();
    assert.equal(await copying, 'copied');
    assert.equal(input.hidden, true);
    assert.equal(input.focused, false, 'a successful copy must keep the current keyboard focus');
});

for (const [label, navigator] of [
    ['unavailable', {}],
    ['permission denied', { clipboard: { writeText: async () => { throw new Error('NotAllowedError'); } } }],
    ['blocked property', { get clipboard() { throw new Error('SecurityError'); } }]
]) {
    test(`clipboard ${label}: exposes and selects an address for manual copying`, async () => {
        const input = fallbackInput();
        assert.equal(await copyContactEmail({ navigator, fallbackInput: input }), 'selected');
        assert.equal(input.hidden, false);
        assert.equal(input.value, 'mossabbenabdellah7@gmail.com');
        assert.equal(input.focused, true);
        assert.equal(input.selected, true);
        assert.deepEqual(input.selection, [0, input.value.length]);
    });
}

test('a valid form prepares a mailto draft, reports the fallback, and retains the user text', () => {
    const status = { textContent: '' };
    let onSubmit;
    const form = {
        elements: { name: { value: 'Zoé' }, email: { value: 'zoe@example.com' }, message: { value: 'Mon message' } },
        reportValidity: () => true,
        addEventListener: (event, handler) => { if (event === 'submit') onSubmit = handler; }
    };
    const window = { location: { href: '' } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/contact.js'), 'utf8'), {
        window,
        document: { getElementById: id => id === 'contactForm' ? form : id === 'contact-form-status' ? status : null }
    });
    let prevented = false;
    onSubmit({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(new URL(window.location.href).protocol, 'mailto:');
    assert.match(status.textContent, /brouillon/);
    assert.match(status.textContent, /copier/);
    assert.doesNotMatch(status.textContent, /envoyé/);
    assert.equal(form.elements.message.value, 'Mon message');
    form.reportValidity = () => false;
    window.location.href = 'untouched';
    onSubmit({ preventDefault() {} });
    assert.equal(window.location.href, 'untouched', 'invalid fields must not launch a draft');
});
