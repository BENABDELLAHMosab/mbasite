
document.addEventListener('DOMContentLoaded', () => {
    // Set current year dynamically
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }


    // Theme initialization and persistence are handled by js/theme.js in <head>.

    // 3. MOBILE MENU
    const burger = document.querySelector('.burger-menu');
    const mobileNav = document.querySelector('.mobile-nav-overlay');
    const navLinks = document.querySelectorAll('.mobile-nav-overlay .nav-link');

    if (burger && mobileNav) {
        const desktop = window.matchMedia('(min-width: 992px)');
        let scrollLock = null;
        const unlockScroll = () => {
            if (!scrollLock) return;
            const { x, y, top, left, scrollBehavior, priority } = scrollLock;
            scrollLock = null;
            document.body.classList.remove('mobile-menu-open');
            document.documentElement.classList.remove('mobile-menu-open');
            if (top) document.body.style.setProperty('--mobile-menu-top', top);
            else document.body.style.removeProperty('--mobile-menu-top');
            if (left) document.body.style.setProperty('--mobile-menu-left', left);
            else document.body.style.removeProperty('--mobile-menu-left');
            // CSS smooth scrolling must not animate restoration from the fixed body.
            document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
            window.scrollTo({ left: x, top: y, behavior: 'instant' });
            if (scrollBehavior) document.documentElement.style.setProperty('scroll-behavior', scrollBehavior, priority);
            else document.documentElement.style.removeProperty('scroll-behavior');
        };
        const setOpen = (open, restoreFocus = false) => {
            if (open && desktop.matches) return;
            if (open && !scrollLock) {
                scrollLock = {
                    x: window.scrollX, y: window.scrollY,
                    top: document.body.style.getPropertyValue('--mobile-menu-top'),
                    left: document.body.style.getPropertyValue('--mobile-menu-left'),
                    scrollBehavior: document.documentElement.style.getPropertyValue('scroll-behavior'),
                    priority: document.documentElement.style.getPropertyPriority('scroll-behavior')
                };
                document.body.style.setProperty('--mobile-menu-top', `${-scrollLock.y}px`);
                document.body.style.setProperty('--mobile-menu-left', `${-scrollLock.x}px`);
                document.body.classList.add('mobile-menu-open');
                document.documentElement.classList.add('mobile-menu-open');
            }
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            burger.classList.toggle('active', open);
            mobileNav.classList.toggle('active', open);
            mobileNav.inert = !open;
            mobileNav.setAttribute('aria-hidden', String(!open));
            if (!open) unlockScroll();
            if (open) navLinks[0]?.focus({ preventScroll: true });
            else if (restoreFocus) burger.focus({ preventScroll: true });
        };
        burger.setAttribute('aria-label', 'Ouvrir le menu');
        burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
        navLinks.forEach(link => {
            link.addEventListener('click', event => {
                // The current page remains open for the CV or a modified click.
                // Restore keyboard focus when the menu link becomes inert.
                const opensElsewhere = link.getAttribute('target')?.toLowerCase() === '_blank' ||
                    event.ctrlKey || event.metaKey || event.shiftKey;
                setOpen(false, Boolean(opensElsewhere));
            });
            link.addEventListener('auxclick', event => {
                if (event.button === 1) setOpen(false, true);
            });
        });
        document.addEventListener('keydown', event => {
            if (burger.getAttribute('aria-expanded') !== 'true') return;
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false, true);
            } else if (event.key === 'Tab') {
                const first = burger, last = navLinks[navLinks.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        desktop.addEventListener('change', () => { if (desktop.matches) setOpen(false); });
        window.addEventListener('pagehide', () => setOpen(false));
        window.addEventListener('pageshow', () => setOpen(false));
    }

    // Images use one guarded fallback, including an error that occurred before this script loaded.
    const fallbackImage = image => {
        if (!(image instanceof HTMLImageElement) || !image.dataset.fallbackSrc) return;
        const source = image.dataset.fallbackSrc;
        delete image.dataset.fallbackSrc;
        image.src = source;
    };
    document.addEventListener('error', event => fallbackImage(event.target), true);
    document.querySelectorAll('img[data-fallback-src]').forEach(image => {
        if (image.complete && image.naturalWidth === 0) fallbackImage(image);
    });

    // 4. NAVIGATION ACTIVE STATE (Multi-page Highlight)
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navigationPage = document.body.dataset?.navPage || currentPath;
    const navItems = document.querySelectorAll('.nav-link');

    navItems.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === navigationPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', linkPath === currentPath ? 'page' : 'location');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });

    // --- SCROLL PROGRESS (High Performance & Robust) ---
    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) {
        const path = progressWrap.querySelector('path');
        const pathLength = 307.919; // Radius 49px * 2 * PI

        // 1. Setup Initial State (Start Empty)
        if (path) {
            path.style.transition = 'none';
            path.style.strokeDasharray = `${pathLength}px ${pathLength}px`;
            path.style.strokeDashoffset = `${pathLength}px`;
            path.getBoundingClientRect(); // Force Reflow
            path.style.transition = 'stroke-dashoffset 10ms linear';
        }

        let ticking = false;

        const updateProgress = () => {
            // Get Scroll Top (Cross-browser)
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

            // Get Scroll Height & Client Height (Cross-browser)
            const scrollHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );

            const clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

            const scrollableHeight = scrollHeight - clientHeight;

            // Calculate Progress (0.0 to 1.0) with Clamp
            const progress = Math.max(0, Math.min(1, scrollableHeight > 0 ? scrollTop / scrollableHeight : 0));

            // Calculate Offset: Empty (pathLength) -> Full (0)
            const offset = pathLength - (pathLength * progress);

            if (path) {
                path.style.strokeDashoffset = `${offset}px`;
            }

            // Update Visibility (> 50px)
            if (scrollTop > 50) {
                progressWrap.classList.add('active-progress');
            } else {
                progressWrap.classList.remove('active-progress');
            }

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        };

        // Attach Listeners
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateProgress);

        progressWrap.addEventListener('click', (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        });

        progressWrap.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                progressWrap.click();
            }
        });

        // Initial Calculation
        updateProgress();
    }

    // --- SCROLL REVEAL (Intersection Observer & Progressive Enhancement) ---
    const hiddenElements = document.querySelectorAll('.hidden-scroll');

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            rootMargin: '100px 0px', // Déclenchement anticipé
            threshold: 0 // Seuil 0 pour garantir le déclenchement sur les très longues sections mobiles
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show-scroll');
                    observer.unobserve(entry.target); // Reveal once
                }
            });
        }, observerOptions);

        hiddenElements.forEach((el) => {
            // Optimisation : si l'élément est déjà dans le viewport au chargement, on ne le cache pas
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('show-scroll');
            } else {
                // On cache les éléments uniquement s'ils sont hors écran
                el.classList.add('js-hidden');
                observer.observe(el);
            }
        });

        // Mécanisme de secours (Fallback) : force l'affichage après 2 secondes
        // pour garantir l'accessibilité au cas où l'animation resterait bloquée
        setTimeout(() => {
            hiddenElements.forEach((el) => {
                if (!el.classList.contains('show-scroll')) {
                    el.classList.add('show-scroll');
                }
            });
        }, 2000);
    }

    // Contextual links let visitors continue at their own pace, without timed prompts.
});
