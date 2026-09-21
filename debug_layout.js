const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('file:///C:/Users/Pro/OneDrive/Desktop/mbasite/mbasite/index.html');
    
    async function getLayout(theme) {
        if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
        } else {
            await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
        }
        
        return await page.evaluate((theme) => {
            const wrapper = document.querySelector('.hero-cv-wrapper');
            const pills = document.querySelectorAll('.cv-pill');
            if (!wrapper || pills.length < 2) return null;
            
            const wRect = wrapper.getBoundingClientRect();
            const wStyle = window.getComputedStyle(wrapper);
            
            const p1 = pills[0].getBoundingClientRect();
            const p1Style = window.getComputedStyle(pills[0]);
            
            const p2 = pills[1].getBoundingClientRect();
            const p2Style = window.getComputedStyle(pills[1]);
            
            return {
                theme,
                wrapper: {
                    width: wRect.width,
                    display: wStyle.display,
                    flexDirection: wStyle.flexDirection,
                    flexWrap: wStyle.flexWrap
                },
                pill1: {
                    width: p1.width,
                    display: p1Style.display,
                    top: p1.top,
                    left: p1.left,
                    padding: p1Style.padding
                },
                pill2: {
                    width: p2.width,
                    display: p2Style.display,
                    top: p2.top,
                    left: p2.left,
                    padding: p2Style.padding
                }
            };
        }, theme);
    }
    
    // Desktop layout
    await page.setViewport({width: 1200, height: 800});
    const lightDesktop = await getLayout('light');
    const darkDesktop = await getLayout('dark');
    
    console.log(JSON.stringify({ lightDesktop, darkDesktop }, null, 2));
    
    await browser.close();
})();
