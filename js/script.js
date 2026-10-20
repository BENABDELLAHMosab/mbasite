
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
        const setOpen = (open, restoreFocus = false) => {
            burger.setAttribute('aria-expanded', String(open));
            burger.classList.toggle('active', open);
            mobileNav.classList.toggle('active', open);
            mobileNav.inert = !open;
            mobileNav.setAttribute('aria-hidden', String(!open));
            if (open) navLinks[0]?.focus({ preventScroll: true });
            else if (restoreFocus) burger.focus({ preventScroll: true });
        };
        burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
        navLinks.forEach(link => link.addEventListener('click', () => setOpen(false)));
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
    const navItems = document.querySelectorAll('.nav-link');

    navItems.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
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

    /*
    ========================================================================
       8. SMART PROMPT (UX TOAST)
    ========================================================================
    */
    class SmartPrompt {
        constructor() {
            this.timer = null;
            this.isShown = false; // Explicit init
            this.dismissed = false;
            this.dismissKey = 'portfolio-tour-dismissed';
            this.prompt = null;
            this.idleTime = 10000; // 10s
            this.currentPath = window.location.pathname.split('/').pop() || 'index.html';
            if (this.currentPath === '') this.currentPath = 'index.html';

            // Normalize path for clean keys
            this.routeKey = this.currentPath.replace('.html', '');
            if (this.routeKey === 'index') this.routeKey = 'home';

            // Route Mapping
            this.routes = {
                'home': {
                    nextUrl: 'about.html',
                    title: 'Découvrir le profil',
                    text: 'Souhaitez-vous consulter la section À propos ?',
                    cta: 'Aller à À propos'
                },
                'index': { // Alternate for home
                    nextUrl: 'about.html',
                    title: 'Découvrir le profil',
                    text: 'Souhaitez-vous consulter la section À propos ?',
                    cta: 'Aller à À propos'
                },
                'about': {
                    nextUrl: 'skills.html',
                    title: 'Aller plus loin',
                    text: 'Souhaitez-vous voir mes compétences ?',
                    cta: 'Voir Compétences'
                },
                'skills': {
                    nextUrl: 'services.html',
                    title: 'Continuer la visite',
                    text: 'Souhaitez-vous découvrir mes services ?',
                    cta: 'Voir Services'
                },
                'services': {
                    nextUrl: 'projects.html',
                    title: 'Explorer les réalisations',
                    text: 'Souhaitez-vous consulter mes projets ?',
                    cta: 'Voir Projets'
                },
                'projects': {
                    nextUrl: 'experience.html',
                    title: 'Parcours',
                    text: 'Souhaitez-vous voir mon expérience ?',
                    cta: 'Voir Expérience'
                },
                'experience': {
                    nextUrl: 'contact.html',
                    title: 'Prendre contact',
                    text: 'Souhaitez-vous accéder à la section Contact ?',
                    cta: 'Voir Contact'
                },
                'contact': {
                    nextUrl: 'index.html',
                    title: 'Merci de votre visite',
                    text: 'Souhaitez-vous revenir à l’accueil ?',
                    cta: 'Retour Accueil'
                }
            };
        }

        init() {
            const pageData = this.routes[this.routeKey];
            if (!pageData || this.isDismissed()) {
                return;
            }

            // If the browser cannot remember a dismissal, omit this optional UI.
            try {
                if (sessionStorage.getItem(`uxTourShown:${this.routeKey}`)) return;
                const probeKey = 'portfolio-tour-storage-check';
                localStorage.setItem(probeKey, '1');
                localStorage.removeItem(probeKey);
            } catch {
                return;
            }

            const syncDismissal = () => {
                if (this.isDismissed()) this.hidePrompt();
            };
            window.addEventListener('storage', event => {
                if (event.key !== null && event.key !== this.dismissKey && !event.key.startsWith('uxTourDismissed:')) return;
                try { if (event.storageArea !== localStorage) return; } catch { return; }
                syncDismissal();
            });
            window.addEventListener('pageshow', syncDismissal);

            this.startTimer();
        }

        isDismissed() {
            if (this.dismissed) return true;
            try {
                this.dismissed = localStorage.getItem(this.dismissKey) === 'true' ||
                    sessionStorage.getItem(this.dismissKey) === 'true';
                // Honor previous dismissals on any page, including the former 24h keys.
                if (!this.dismissed && Object.keys(this.routes).some(route => {
                    const saved = Number(localStorage.getItem(`uxTourDismissed:${route}`));
                    return Number.isFinite(saved) && saved > 0;
                })) this.rememberDismissal();
            } catch {
                this.dismissed = true;
            }
            return this.dismissed;
        }

        rememberDismissal() {
            this.dismissed = true;
            try {
                localStorage.setItem(this.dismissKey, 'true');
            } catch {
                // A full local store must not prevent closing or navigating this session.
                try { sessionStorage.setItem(this.dismissKey, 'true'); } catch { /* Keep the in-memory choice. */ }
            }
        }

        hidePrompt() {
            clearTimeout(this.timer);
            this.timer = null;
            const prompt = this.prompt;
            this.prompt = null;
            if (!prompt) return;
            prompt.classList.add('hide');
            prompt.classList.remove('visible');
            prompt.style.opacity = '0';
            document.body.classList.remove('ux-toast-open');
            document.body.style.removeProperty('--ux-toast-height');
            setTimeout(() => prompt.remove(), 400);
        }

        startTimer() {
            if (this.isShown || this.isDismissed()) return;

            // no activity listeners, just one timeout
            this.timer = setTimeout(() => {
                this.show();
            }, this.idleTime);
        }

        show() {
            // Recheck after the delay: another page/tab may have dismissed the tour.
            if (this.isShown || this.isDismissed()) return;
            this.isShown = true;

            const data = this.routes[this.routeKey];
            const html = `
                <div class="smart-prompt" role="dialog" aria-labelledby="promptTitle" style="display:block !important; opacity:0;">
                    <button class="smart-close" aria-label="Fermer">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div class="smart-content">
                        <h4 id="promptTitle">${data.title}</h4>
                        <p>${data.text}</p>
                    </div>
                    <div class="smart-actions">
                        <button class="btn-prompt-secondary">Plus tard</button>
                        <button class="btn-prompt-primary">${data.cta}</button>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);

            // Bind Events & Animate
            const prompt = document.querySelector('.smart-prompt');
            this.prompt = prompt;
            const btnClose = prompt.querySelector('.smart-close');
            const btnSecondary = prompt.querySelector('.btn-prompt-secondary');
            const btnPrimary = prompt.querySelector('.btn-prompt-primary');

            const removeOpenClass = () => {
                document.body.classList.remove('ux-toast-open');
                document.body.style.removeProperty('--ux-toast-height');
            };

            const dismiss = () => {
                this.rememberDismissal();
                this.hidePrompt();
            };

            const navigate = () => {
                removeOpenClass(); // Reset UI overlap logic
                try { sessionStorage.setItem(`uxTourShown:${this.routeKey}`, 'true'); } catch { /* Navigation still works. */ }
                window.location.href = data.nextUrl;
            };

            btnClose.addEventListener('click', dismiss);
            btnSecondary.addEventListener('click', dismiss);
            btnPrimary.addEventListener('click', navigate);

            // Animate In (Force Layout Reflow)
            requestAnimationFrame(() => {
                if (this.prompt !== prompt || this.isDismissed()) {
                    this.hidePrompt();
                    return;
                }
                prompt.offsetHeight; // force reflow
                prompt.style.opacity = '1'; // Force override inline
                prompt.classList.add('visible');

                // UX Overlap Fix: Measure height for ScrollTop button
                const height = prompt.getBoundingClientRect().height;
                document.body.style.setProperty('--ux-toast-height', `${height}px`);
                document.body.classList.add('ux-toast-open');
            });
        }
    }

    // Init Smart Prompt (Robust check)
    const initPrompt = () => {
        const smartPrompt = new SmartPrompt();
        smartPrompt.init();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPrompt);
    } else {
        initPrompt();
    }
});
