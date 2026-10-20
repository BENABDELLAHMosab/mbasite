const CONTACT_EMAIL = 'mossabbenabdellah7@gmail.com';

// A mailto draft: no message is sent by this static site.
function buildContactMailto({ name, email, message }) {
    const cleanName = name.trim().replace(/[\r\n]+/g, ' ');
    const subject = `Contact depuis le portfolio - ${cleanName}`;
    const body = `Nom : ${cleanName}\r\nEmail : ${email.trim()}\r\n\r\n${message.trim()}`;
    return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
}

async function copyContactEmail({ navigator, fallbackInput }) {
    try {
        if (!navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        if (fallbackInput) fallbackInput.hidden = true;
        return 'copied';
    } catch {
        // Keep the address usable when clipboard permissions or browser support fail.
        if (fallbackInput) {
            fallbackInput.hidden = false;
            fallbackInput.value = CONTACT_EMAIL;
            fallbackInput.focus();
            fallbackInput.select();
            fallbackInput.setSelectionRange?.(0, CONTACT_EMAIL.length);
            return 'selected';
        }
        return 'manual';
    }
}

if (typeof document !== 'undefined') {
    const form = document.getElementById('contactForm');
    const formStatus = document.getElementById('contact-form-status');
    form?.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (formStatus) {
            formStatus.textContent = 'Votre brouillon est prêt. Si votre messagerie ne s’ouvre pas, vous pouvez copier mon adresse e-mail.';
        }
        window.location.href = buildContactMailto({
            name: form.elements.name.value,
            email: form.elements.email.value,
            message: form.elements.message.value
        });
    });

    const copyButton = document.getElementById('copy-email');
    const copyStatus = document.getElementById('email-copy-status');
    const fallbackInput = document.getElementById('email-copy-fallback');
    if (copyButton) {
        copyButton.hidden = false;
        copyButton.addEventListener('click', async () => {
            if (copyButton.getAttribute('aria-busy') === 'true') return;
            copyButton.setAttribute('aria-busy', 'true');
            if (copyStatus) copyStatus.textContent = '';
            const result = await copyContactEmail({ navigator: window.navigator, fallbackInput });
            copyButton.removeAttribute('aria-busy');
            copyButton.setAttribute('data-copy-state', result);
            if (copyStatus) copyStatus.textContent = result === 'copied' ? 'Adresse e-mail copiée.' :
                result === 'selected' ? 'Adresse sélectionnée : copiez-la avec Ctrl+C, ⌘C ou le menu de votre appareil.' :
                    'Vous pouvez copier l’adresse e-mail affichée ci-dessus.';
        });
    }
}

if (typeof module !== 'undefined') module.exports = { buildContactMailto, copyContactEmail };
