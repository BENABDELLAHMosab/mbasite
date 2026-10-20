// Start the deadline before deferred scripts or images can delay DOMContentLoaded.
(() => {
    const root = document.documentElement;
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
        const loader = document.getElementById('preloader');
        if (loader) loader.classList.add('loaded');
        setTimeout(release, 300);
    }, { once: true });
    window.addEventListener('pageshow', event => {
        if (event.persisted) release();
    });
})();
