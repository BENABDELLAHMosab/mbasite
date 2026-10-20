function projectCategoryFromUrl(href, categories) {
    try {
        const category = new URL(href).searchParams.get('category');
        return categories.includes(category) ? category : 'all';
    } catch {
        return 'all';
    }
}

function initProjectFilters(document, window) {
    const buttons = [...document.querySelectorAll('.filter-btn')];
    const cards = [...document.querySelectorAll('.project-card')];
    const grid = document.querySelector('.projects-grid');
    if (!grid || !buttons.length) return;

    const categories = buttons.map(button => button.dataset.filter);
    const caseLinks = [...document.querySelectorAll('[data-case-link]')];
    const counter = document.getElementById('project-filter-status');
    const animations = new Set();
    const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let currentCategory = null;

    function applyCategory(category, { animate = false, updateUrl = false } = {}) {
        if (!categories.includes(category)) category = 'all';
        if (category === currentCategory) return;
        const canAnimate = animate && motionPreference && !motionPreference.matches;
        const before = new Map();
        if (canAnimate) cards.forEach(card => {
            if (!card.hidden && card.style.display !== 'none') before.set(card, card.getBoundingClientRect());
        });
        animations.forEach(animation => animation.cancel());
        animations.clear();

        let visibleCount = 0;
        buttons.forEach(button => {
            const selected = button.dataset.filter === category;
            button.classList.toggle('btn-primary', selected);
            button.classList.toggle('active', selected);
            button.classList.toggle('btn-outline', !selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        cards.forEach(card => {
            const visible = category === 'all' || (card.dataset.category || '').split(/\s+/).includes(category);
            card.hidden = !visible;
            card.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });
        grid.classList.toggle('grid-center-1', visibleCount === 1);
        grid.classList.toggle('grid-center-2', visibleCount === 2);
        currentCategory = category;

        // Explicit case-study return links should restore this validated category,
        // including a first arrival through a category deep link.
        caseLinks.forEach(link => {
            try {
                const pageUrl = new URL(window.location.href);
                const destination = new URL(link.getAttribute('href'), pageUrl);
                if (destination.origin !== pageUrl.origin || !/^\/project-[a-z0-9-]+\.html$/.test(destination.pathname)) return;
                if (category === 'all') destination.searchParams.delete('category');
                else destination.searchParams.set('category', category);
                link.setAttribute('href', destination.pathname + destination.search + destination.hash);
            } catch { /* Leave malformed or external links untouched. */ }
        });

        if (counter) {
            const label = buttons.find(button => button.dataset.filter === category)?.textContent.trim();
            counter.textContent = `${visibleCount} projet${visibleCount === 1 ? '' : 's'} affiché${visibleCount === 1 ? '' : 's'}` +
                (category === 'all' ? '' : ` — ${label}`);
            counter.hidden = false;
        }

        if (canAnimate) cards.forEach(card => {
            if (card.hidden || !card.animate) return;
            const previous = before.get(card);
            const next = card.getBoundingClientRect();
            const animation = card.animate([
                { transform: previous ? `translate(${previous.left - next.left}px, ${previous.top - next.top}px)` : 'translateY(8px)', opacity: previous ? 1 : 0.35 },
                { transform: 'translate(0px, 0px)', opacity: 1 }
            ], { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
            animations.add(animation);
            animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
        });

        if (updateUrl) {
            try {
                const url = new URL(window.location.href);
                if (category === 'all') url.searchParams.delete('category');
                else url.searchParams.set('category', category);
                let anchorId = '';
                try { anchorId = decodeURIComponent(url.hash.slice(1)); } catch { /* Preserve unknown fragments. */ }
                if (anchorId && cards.some(card => card.id === anchorId && card.hidden)) url.hash = '';
                // Keep native history state and unrelated anchors; do not retain a hidden target.
                window.history.replaceState(window.history.state, '', url.href);
            } catch { /* Filtering still works when History API access is restricted. */ }
        }
    }

    buttons.forEach(button => button.addEventListener('click', () => {
        applyCategory(button.dataset.filter, { animate: true, updateUrl: true });
    }));
    const restoreFromUrl = () => applyCategory(projectCategoryFromUrl(window.location.href, categories));
    window.addEventListener('popstate', restoreFromUrl);
    window.addEventListener('pageshow', restoreFromUrl);
    restoreFromUrl();
}

if (typeof document !== 'undefined') initProjectFilters(document, window);
if (typeof module !== 'undefined') module.exports = { projectCategoryFromUrl, initProjectFilters };
