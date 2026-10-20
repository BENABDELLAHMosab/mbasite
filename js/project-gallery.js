function projectGalleryReturnHref(href, projectId) {
    if (!/^project-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectId || '')) return null;
    const categories = ['all', 'software', 'data', 'cloud', 'ia', 'mobile'];
    let category = 'all';
    try {
        const candidate = new URL(href).searchParams.get('category');
        if (categories.includes(candidate)) category = candidate;
    } catch { /* Keep a usable return destination. */ }
    return 'projects.html' + (category === 'all' ? '' : '?category=' + category) + '#' + projectId;
}

function projectGalleryShot(link) {
    if (!link) return null;
    const image = link.querySelector('img');
    const figure = link.closest('figure');
    const caption = figure?.querySelector('[data-gallery-caption]')?.textContent.trim() ||
        figure?.querySelector('figcaption')?.textContent.trim();
    const alt = image?.getAttribute('alt')?.trim();
    const href = link.getAttribute('href');
    return href && (caption || alt) ? { href, caption: caption || alt, alt: alt || caption } : null;
}

function initProjectCarousel(root, window) {
    const slides = [...root.querySelectorAll('[data-carousel-slide]')];
    const links = slides.map(slide => slide.querySelector('[data-gallery-link]'));
    const previous = root.querySelector('[data-slide-prev]');
    const next = root.querySelector('[data-slide-next]');
    const count = root.querySelector('[data-carousel-count]');
    const status = root.querySelector('[data-carousel-status]');
    if (!slides.length || links.some(link => !projectGalleryShot(link))) return null;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let index = 0, animation;
    function select(requested, { animate = true, announce = true } = {}) {
        index = ((requested % slides.length) + slides.length) % slides.length;
        animation?.cancel();
        slides.forEach((slide, i) => {
            slide.hidden = i !== index;
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'diapositive');
            slide.setAttribute('aria-label', (i + 1) + ' sur ' + slides.length);
        });
        if (count) count.textContent = (index + 1) + ' / ' + slides.length;
        if (announce && status) status.textContent = 'Capture ' + (index + 1) + ' sur ' +
            slides.length + '. ' + projectGalleryShot(links[index]).caption;
        const image = slides[index].querySelector('img');
        if (animate && motion && !motion.matches && image?.animate) {
            animation = image.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
        }
    }
    previous?.addEventListener('click', () => select(index - 1));
    next?.addEventListener('click', () => select(index + 1));
    root.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.target?.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        select(index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    motion?.addEventListener?.('change', () => { if (motion.matches) animation?.cancel(); });
    select(0, { animate: false, announce: false });
    if (previous) previous.hidden = slides.length < 2;
    if (next) next.hidden = slides.length < 2;
    if (count) count.hidden = false;
    root.classList.add('is-enhanced');
    return { root, links, select, get index() { return index; } };
}

function initProjectGallery(document, window) {
    const returnHref = projectGalleryReturnHref(window.location.href, document.body?.dataset.projectId);
    if (returnHref) document.querySelectorAll('[data-project-return]').forEach(link => link.setAttribute('href', returnHref));
    const carousels = [...document.querySelectorAll('[data-project-carousel]')]
        .map(root => initProjectCarousel(root, window)).filter(Boolean);
    const dialog = document.getElementById('project-image-dialog');
    const fullImage = document.getElementById('project-image-full');
    const caption = document.getElementById('project-image-caption');
    const count = document.getElementById('project-image-count');
    const closeButton = document.querySelector('[data-gallery-close]');
    if (!dialog || !fullImage || !caption || !closeButton ||
        typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') return;
    const previous = dialog.querySelector?.('[data-gallery-prev]');
    const next = dialog.querySelector?.('[data-gallery-next]');
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let originatingLink = null, originalScrollLock, activeGroup, currentIndex = 0, animation;

    function groupFor(link) {
        const carousel = carousels.find(item => item.links.includes(link));
        if (carousel) return { links: carousel.links, carousel };
        const root = link.closest('[data-gallery-group]');
        const links = root?.querySelectorAll?.('[data-gallery-link]');
        return { links: links ? [...links].filter(projectGalleryShot) : [link] };
    }
    function render(requested, animate = true) {
        if (!activeGroup?.links.length) return;
        currentIndex = ((requested % activeGroup.links.length) + activeGroup.links.length) % activeGroup.links.length;
        const shot = projectGalleryShot(activeGroup.links[currentIndex]);
        if (!shot) return;
        animation?.cancel();
        fullImage.setAttribute('src', shot.href);
        fullImage.setAttribute('alt', shot.alt);
        caption.textContent = shot.caption;
        if (count) count.textContent = (currentIndex + 1) + ' / ' + activeGroup.links.length;
        if (previous) previous.hidden = activeGroup.links.length < 2;
        if (next) next.hidden = activeGroup.links.length < 2;
        activeGroup.carousel?.select(currentIndex, { animate: false, announce: false });
        if (animate && motion && !motion.matches && fullImage.animate) {
            animation = fullImage.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
        }
    }
    document.querySelectorAll('[data-gallery-link]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey ||
                event.shiftKey || event.altKey || link.hasAttribute('download') || !projectGalleryShot(link)) return;
            activeGroup = groupFor(link);
            render(activeGroup.links.indexOf(link), false);
            try { dialog.showModal(); }
            catch { activeGroup = null; return; }
            if (originalScrollLock === undefined) originalScrollLock = document.body.classList.contains('project-gallery-open');
            document.body.classList.add('project-gallery-open');
            originatingLink = link;
            event.preventDefault();
            closeButton.focus({ preventScroll: true });
        });
    });
    previous?.addEventListener('click', () => render(currentIndex - 1));
    next?.addEventListener('click', () => render(currentIndex + 1));
    dialog.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey ||
            (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        render(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
    closeButton.addEventListener('click', () => { if (dialog.open) dialog.close(); });
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
        animation?.cancel();
        if (originalScrollLock !== undefined) {
            document.body.classList.toggle('project-gallery-open', originalScrollLock);
            originalScrollLock = undefined;
        }
        const link = activeGroup?.carousel ? activeGroup.links[currentIndex] : originatingLink;
        activeGroup = null;
        originatingLink = null;
        if (link?.isConnected) link.focus({ preventScroll: true });
    });
}

if (typeof document !== 'undefined') initProjectGallery(document, window);
if (typeof module !== 'undefined') module.exports = { projectGalleryReturnHref, projectGalleryShot, initProjectCarousel, initProjectGallery };
