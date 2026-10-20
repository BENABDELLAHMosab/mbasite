// Loaded synchronously before CSS so the first paint uses the resolved theme.
(() => {
    const storageKey = 'portfolio-theme';
    const systemSource = window.matchMedia('(prefers-color-scheme: dark)');
    let manualTheme = null;
    let hasUnsavedPreference = false;

    function readPreference() {
        try {
            const storedTheme = window.localStorage.getItem(storageKey);
            manualTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
            hasUnsavedPreference = false;
        } catch {
            // Keep the current in-memory choice when storage is unavailable.
        }
    }

    function applyTheme() {
        const theme = manualTheme || (systemSource.matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;

        const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
        if (toggleSwitch) toggleSwitch.checked = theme === 'dark';

        const logoPath = theme === 'light' ? '/assets/logo-mba-light.png' : '/assets/logo-mba-dark.png';
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.setAttribute('href', logoPath);
        // Keep the logo URL selected by the HTML/build. CSS already adapts its
        // colour in both themes, without replacing the image or fetching it again.
    }

    readPreference();
    applyTheme();

    document.addEventListener('DOMContentLoaded', () => {
        // Only the UI needs syncing now; the theme was resolved before CSS.
        applyTheme();
        const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
        if (toggleSwitch) {
            toggleSwitch.addEventListener('change', (event) => {
                manualTheme = event.target.checked ? 'dark' : 'light';
                applyTheme();
                try {
                    window.localStorage.setItem(storageKey, manualTheme);
                    hasUnsavedPreference = false;
                } catch {
                    hasUnsavedPreference = true;
                }
            });
        }
    });

    systemSource.addEventListener('change', () => {
        if (manualTheme === null) applyTheme();
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== storageKey && event.key !== null) return;
        try {
            if (event.storageArea !== window.localStorage) return;
        } catch {
            return;
        }
        // Read the latest value, including removals/clear, rather than a stale event.
        readPreference();
        applyTheme();
    });

    window.addEventListener('pageshow', () => {
        // A failed write must not erase the user's choice in this document.
        if (!hasUnsavedPreference) readPreference();
        applyTheme();
        // History navigation can restore the checkbox after pageshow has fired.
        window.setTimeout(applyTheme, 0);
    });
})();
