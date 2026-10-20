// A reversible reading rail with one-time entrances. Only loaded on journey pages.
(() => {
    const page = document.querySelector('.journey-page');
    if (!page) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timelines = Array.from(page.querySelectorAll('.timeline'), (element) => ({
        element,
        items: Array.from(element.querySelectorAll('.timeline-item')),
        positions: []
    }));
    const revealElements = page.querySelectorAll(
        'main .container > h2, main .container > h1.page-title, .about-text > h3, .about-text > p, .academic-heading, ' +
        '.highlight-item, .timeline-item, .objective-card'
    );
    let frame = null;

    function draw() {
        frame = null;
        const readingLine = window.scrollY + window.innerHeight * 0.58;

        for (const timeline of timelines) {
            const { element, items, positions } = timeline;
            if (!positions.length) continue;
            const start = positions[0];
            const length = Math.max(1, positions[positions.length - 1] - start);
            const progress = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (readingLine - start) / length));
            element.style.setProperty('--journey-progress', progress.toFixed(4));

            let current = -1;
            positions.forEach((position, index) => {
                if (readingLine >= position) current = index;
            });
            items.forEach((item, index) => {
                item.classList.toggle('is-reached', reducedMotion.matches || index <= current);
                item.classList.toggle('is-current', !reducedMotion.matches && index === current);
            });
        }
    }

    function scheduleDraw() {
        if (frame === null) frame = window.requestAnimationFrame(draw);
    }

    function measure() {
        // Cache layout on resize/font load; scroll frames only update transforms/classes.
        const measurements = timelines.map((timeline) => {
            const top = timeline.element.getBoundingClientRect().top + window.scrollY;
            const positions = timeline.items.map((item) => {
                const dot = window.getComputedStyle(item, '::before');
                return item.getBoundingClientRect().top + window.scrollY + parseFloat(dot.top) + parseFloat(dot.height) / 2;
            });
            return { timeline, top, positions };
        });
        for (const { timeline, top, positions } of measurements) {
            timeline.positions = positions;
            if (!positions.length) continue;
            timeline.element.style.setProperty('--rail-start', `${positions[0] - top}px`);
            timeline.element.style.setProperty('--rail-length', `${Math.max(0, positions[positions.length - 1] - positions[0])}px`);
            timeline.element.classList.add('is-tracked');
        }
        scheduleDraw();
    }

    let revealObserver;
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
        revealObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

        revealElements.forEach((element) => {
            // Restored scroll positions must not hide content already above the viewport.
            if (element.getBoundingClientRect().bottom <= 0) return;
            element.classList.add('journey-reveal');
            revealObserver.observe(element);
        });
        page.querySelectorAll('.highlight-item').forEach((element, index) => {
            element.style.setProperty('--reveal-delay', `${index * 60}ms`);
        });
    }

    reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) {
            revealObserver?.disconnect();
            revealElements.forEach((element) => element.classList.add('is-visible'));
        }
        measure();
    });
    window.addEventListener('scroll', () => {
        if (!reducedMotion.matches) scheduleDraw();
    }, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pageshow', measure);
    window.addEventListener('load', measure, { once: true });
    if ('ResizeObserver' in window) {
        new ResizeObserver(measure).observe(page.querySelector('main'));
    }
    if (document.fonts) document.fonts.ready.then(measure);
    measure();
})();
