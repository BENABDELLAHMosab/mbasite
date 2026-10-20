// A mailto draft: no message is sent by this static site.
function buildContactMailto({ name, email, message }) {
    const cleanName = name.trim().replace(/[\r\n]+/g, ' ');
    const subject = `Contact depuis le portfolio - ${cleanName}`;
    const body = `Nom : ${cleanName}\r\nEmail : ${email.trim()}\r\n\r\n${message.trim()}`;
    return 'mailto:mossabbenabdellah7@gmail.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
}

if (typeof document !== 'undefined') {
    const form = document.getElementById('contactForm');
    form?.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        window.location.href = buildContactMailto({
            name: form.elements.name.value,
            email: form.elements.email.value,
            message: form.elements.message.value
        });
    });
}

if (typeof module !== 'undefined') module.exports = { buildContactMailto };
