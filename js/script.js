
document.addEventListener('DOMContentLoaded', () => {
    // 1. PRELOADER (Robust Removal with Minimum Display Time)
    const preloader = document.getElementById('preloader');
    const minDisplayTime = 500; // Minimum time in ms to show loader
    const startTime = Date.now();

    const removePreloader = () => {
        if (preloader && preloader.style.display !== 'none') {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500); // Fade out duration matches CSS transition usually
            }, remainingTime);
        }
    };

    // Remove on window load (all assets loaded)
    window.addEventListener('load', removePreloader);

    // Fallback timeout (3 second safety - slightly longer to ensure min display)
    setTimeout(removePreloader, 3000);

    // Set current year dynamically
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }


    // 2. THEME SWITCHER (Auto-Detect + Manual Override)
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const systemSource = window.matchMedia('(prefers-color-scheme: dark)');

    function calculateSettingAsThemeString({ localStorageTheme, systemDarkMode }) {
        if (localStorageTheme !== null) {
            return localStorageTheme;
        }
        if (systemDarkMode) {
            return 'dark';
        }
        return 'light';
    }

    function updateThemeOnHtml({ theme }) {
        document.documentElement.setAttribute('data-theme', theme);
        if (toggleSwitch) {
            toggleSwitch.checked = (theme === 'dark');
        }

        // Update Favicon & Brand Logo
        const favicon = document.querySelector('link[rel="icon"]');
        const brandLogo = document.getElementById('brandLogo');

        if (theme === 'light') {
            // Light Mode -> Usage of Dark (Black) Logo
            // User specified: "mode claire ... logo soit noire (logo-mba-light.png)"
            if (favicon) favicon.href = 'assets/logo-mba-light.png';
            if (brandLogo) brandLogo.src = 'assets/logo-mba-light.png';
        } else {
            // Dark Mode -> Usage of Light (White) Logo
            // User specified: "mode sombe ... logo soit claire (logo-mba-dark.png)"
            if (favicon) favicon.href = 'assets/logo-mba-dark.png';
            if (brandLogo) brandLogo.src = 'assets/logo-mba-dark.png';
        }
    }

    // 1. Initial Load: Auto-Detect (No localStorage persistence preferred for "refresh = auto")
    // User requested: "si l user rafrichissait la page le mode auto s active"
    // So we primarily rely on systemSource on load.

    // Check system preference immediately
    let currentTheme = systemSource.matches ? 'dark' : 'light';
    updateThemeOnHtml({ theme: currentTheme });

    // 2. Manual Toggle
    function switchTheme(e) {
        if (e.target.checked) {
            updateThemeOnHtml({ theme: 'dark' });
        } else {
            updateThemeOnHtml({ theme: 'light' });
        }
    }

    // 3. System Change Listener (Live Update)
    systemSource.addEventListener('change', (e) => {
        // Only update if user hasn't manually overridden? 
        // User said: "si user a le mode sombre donc site sombre... si user changer le site doit changer immediatement"
        // But also "refresh = auto". 
        // We will update to match system if the user hasn't explicitly set a preference *in this session*?
        // Simpler: Just update to match system change, as it's "Auto Mode".
        const newTheme = e.matches ? 'dark' : 'light';
        updateThemeOnHtml({ theme: newTheme });
    });

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', switchTheme);
    }

    // 3. MOBILE MENU
    const burger = document.querySelector('.burger-menu');
    const mobileNav = document.querySelector('.mobile-nav-overlay');
    const navLinks = document.querySelectorAll('.mobile-nav-overlay .nav-link');

    if (burger && mobileNav) {
        burger.addEventListener('click', () => {
            const isExpanded = burger.getAttribute('aria-expanded') === 'true';
            burger.setAttribute('aria-expanded', !isExpanded);
            mobileNav.classList.toggle('active');
            burger.classList.toggle('active'); // Optional for burger animation if CSS supports it
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                burger.setAttribute('aria-expanded', 'false');
            });
        });
    }

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
            const progress = Math.max(0, Math.min(1, scrollTop / scrollableHeight));

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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Initial Calculation
        updateProgress();
    }

    // --- SCROLL REVEAL (Intersection Observer & Progressive Enhancement) ---
    const hiddenElements = document.querySelectorAll('.hidden-scroll');
    
    if ('IntersectionObserver' in window) {
        const observerOptions = {
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
            // On cache les éléments uniquement si le JS et l'Observer sont actifs
            el.classList.add('js-hidden');
            observer.observe(el);
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

    // 5. INITIALIZE 3D BACKGROUND (If present)
    if (typeof init === 'function') {
        // init() is defined in background.js
        try {
            init();
        } catch (e) {
            console.warn("Three.js background failed to init:", e);
        }
    }

    /*
    ========================================================================
       8. SMART PROMPT (UX TOAST) [DEBUG MODE]
    ========================================================================
    */
    class SmartPrompt {
        constructor() {
            this.timer = null;
            this.isShown = false; // Explicit init
            this.idleTime = 10000; // 10s
            this.currentPath = window.location.pathname.split('/').pop() || 'index.html';
            if (this.currentPath === '') this.currentPath = 'index.html';

            // Normalize path for clean keys
            this.routeKey = this.currentPath.replace('.html', '');
            if (this.routeKey === 'index') this.routeKey = 'home';

            console.log('[SmartPrompt] Init on route:', this.routeKey);

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
            if (!pageData) {
                console.log('[SmartPrompt] No data for this route.');
                return;
            }

            // Check Cooldown (24h)
            const dismissedAt = localStorage.getItem(`uxTourDismissed:${this.routeKey}`);
            if (dismissedAt) {
                const elapsed = Date.now() - parseInt(dismissedAt, 10);
                if (elapsed < 24 * 60 * 60 * 1000) {
                    console.log('[SmartPrompt] Cooldown active. Elapsed:', elapsed);
                    return; // Still in cooldown
                }
            }

            // Check Session Shown
            if (sessionStorage.getItem(`uxTourShown:${this.routeKey}`)) {
                console.log('[SmartPrompt] Already shown in this session.');
                return;
            }

            // Start Timer (Strict 10s after load)
            this.startTimer();
        }

        startTimer() {
            if (this.isShown) return;
            console.log(`[SmartPrompt] Timer started. prompting in ${this.idleTime}ms`);

            // no activity listeners, just one timeout
            this.timer = setTimeout(() => {
                console.log('[SmartPrompt] Timer fired!');
                this.show();
            }, this.idleTime);
        }

        show() {
            if (this.isShown) return;
            this.isShown = true;
            console.log('[SmartPrompt] Showing toast...');

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
            const btnClose = prompt.querySelector('.smart-close');
            const btnSecondary = prompt.querySelector('.btn-prompt-secondary');
            const btnPrimary = prompt.querySelector('.btn-prompt-primary');

            const removeOpenClass = () => {
                document.body.classList.remove('ux-toast-open');
                document.body.style.removeProperty('--ux-toast-height');
            };

            const dismiss = () => {
                console.log('[SmartPrompt] Dismissed');
                prompt.classList.add('hide');
                prompt.classList.remove('visible');
                removeOpenClass(); // Reset UI overlap logic
                localStorage.setItem(`uxTourDismissed:${this.routeKey}`, Date.now().toString());
                setTimeout(() => prompt.remove(), 400);
            };

            const navigate = () => {
                console.log('[SmartPrompt] Navigating to', data.nextUrl);
                removeOpenClass(); // Reset UI overlap logic
                sessionStorage.setItem(`uxTourShown:${this.routeKey}`, 'true');
                window.location.href = data.nextUrl;
            };

            btnClose.addEventListener('click', dismiss);
            btnSecondary.addEventListener('click', dismiss);
            btnPrimary.addEventListener('click', navigate);

            // Animate In (Force Layout Reflow)
            requestAnimationFrame(() => {
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

// DEBUG HELPER (Console only)
window.debugSmartPrompt = () => {
    Object.keys(localStorage).forEach(k => { if(k.startsWith('uxTour')) localStorage.removeItem(k); });
    Object.keys(sessionStorage).forEach(k => { if(k.startsWith('uxTour')) sessionStorage.removeItem(k); });
    console.log('[SmartPrompt] Storage cleared. Reload to test.');
};

