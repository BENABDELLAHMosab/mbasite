// One-time entrances on Home and Contact, after the existing preloader has cleared.
(() => {
    const elements = document.querySelectorAll('[data-enter]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!elements.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    let started = false;
    let preloaderObserver;
    let revealObserver;

    function revealAll() {
        preloaderObserver?.disconnect();
        revealObserver?.disconnect();
        elements.forEach(element => element.classList.add('is-entered'));
    }

    function start() {
        if (started) return;
        started = true;
        preloaderObserver?.disconnect();
        if (reducedMotion.matches) return;

        revealObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add('is-entered');
                revealObserver.unobserve(entry.target);
            }
        }, {threshold: 0, rootMargin: '0px 0px -24px 0px'});

        elements.forEach(element => {
            if (element.getBoundingClientRect().bottom <= 0) return;
            const delay = Number(element.dataset.enterDelay) || 0;
            element.style.setProperty('--enter-delay', `${Math.max(0, Math.min(delay, 450))}ms`);
            element.classList.add('entry-ready');
            revealObserver.observe(element);
        });
    }

    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) revealAll();
    });

    document.addEventListener('focusin', event => {
        const element = event.target.closest('[data-enter]');
        if (!element) return;
        element.classList.add('is-entered');
        revealObserver?.unobserve(element);
    });

    const preloader = document.getElementById('preloader');
    if (preloader && window.getComputedStyle(preloader).display !== 'none') {
        preloaderObserver = new MutationObserver(() => {
            if (preloader.hidden || window.getComputedStyle(preloader).display === 'none') start();
        });
        preloaderObserver.observe(preloader, {attributes: true, attributeFilter: ['style', 'class', 'hidden']});
    } else {
        start();
    }
})();
