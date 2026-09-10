const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const routes = ['/', '/auth', '/support', '/privacy', '/terms'];
  const baseUrl = 'http://localhost:8080';

  for (const route of routes) {
    try {
      await page.goto(baseUrl + route, { waitUntil: 'networkidle' });
      // Wait a bit for layout to settle
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`Route: ${route} | Overflow: ${overflow} | ScrollWidth: ${scrollWidth} | ClientWidth: ${clientWidth}`);
      
      if (overflow) {
          const elements = await page.evaluate(() => {
              const clientWidth = document.documentElement.clientWidth;
              return Array.from(document.querySelectorAll('*'))
                  .filter(el => {
                      const rect = el.getBoundingClientRect();
                      return rect.right > clientWidth || rect.left < 0;
                  })
                  .map(el => ({
                      tagName: el.tagName,
                      className: el.className,
                      offsetWidth: el.offsetWidth,
                      right: el.getBoundingClientRect().right
                  }));
          });
          console.log('Overflowing elements:', JSON.stringify(elements.slice(0, 5), null, 2));
      }
    } catch (e) {
      console.error(`Failed to check ${route}: ${e.message}`);
    }
  }

  await browser.close();
})();
