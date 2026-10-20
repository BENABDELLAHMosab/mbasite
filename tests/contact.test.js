const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContactMailto } = require('../js/contact.js');

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
