// Start the deadline before deferred scripts or images can delay DOMContentLoaded.
(() => {
    const root = document.documentElement;
    // Session storage spans the portfolio's pages and reloads in this tab.
    // If remembering the visit is unavailable, omit this optional introduction.
    try {
        if (window.sessionStorage.getItem('portfolio-preloader-seen') === 'true') return;
        window.sessionStorage.setItem('portfolio-preloader-seen', 'true');
    } catch {
        return;
    }
    root.dataset.preloading = '';
    let released = false;

    function release() {
        if (released) return;
        released = true;
        clearTimeout(deadline);
        root.removeAttribute('data-preloading');
        const loader = document.getElementById('preloader');
        if (loader) loader.hidden = true;
    }

    const deadline = setTimeout(release, 2500);
    document.addEventListener('DOMContentLoaded', () => {
        if (released) return;
        const loader = document.getElementById('preloader');
        if (loader) loader.classList.add('loaded');
        setTimeout(release, 300);
    }, { once: true });
    window.addEventListener('pageshow', event => {
        if (event.persisted) release();
    });
})();
