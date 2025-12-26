import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

// Configurar plugin stealth para evitar detección de bots
puppeteer.use(StealthPlugin());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const testUrl = url || 'https://viralikigai.eurofiyati.online/series/';

  let browser = null;

  try {
    console.log('[Ikigai Debug] Iniciando diagnóstico...');
    console.log('[Ikigai Debug] URL a probar:', testUrl);

    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Logging de requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        type: request.resourceType()
      });
    });

    // Logging de respuestas
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType()
      });
    });

    // Logging de errores
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    // Navegar
    console.log('[Ikigai Debug] Navegando...');
    await page.goto(testUrl, {
      waitUntil: 'networkidle0',
      timeout: 20000
    });

    console.log('[Ikigai Debug] Página cargada, esperando...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Obtener información de la página
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        htmlLength: document.documentElement.outerHTML.length,
        bodyText: document.body.innerText.substring(0, 500),
        linkCount: document.querySelectorAll('a').length,
        seriesLinkCount: document.querySelectorAll('a[href*="/series/"]').length,
        imageCount: document.querySelectorAll('img').length,
        hasQwikScript: !!document.querySelector('script[src*="qwik"]'),
        allLinks: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
          href: a.href,
          text: a.textContent.trim().substring(0, 50)
        }))
      };
    });

    // Tomar screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: false
    });

    // Obtener HTML
    const html = await page.content();

    await browser.close();

    return res.status(200).json({
      success: true,
      pageInfo,
      requests: requests.slice(0, 20),
      responses: responses.slice(0, 20),
      errors,
      screenshot: `data:image/png;base64,${screenshot}`,
      htmlSample: html.substring(0, 2000)
    });

  } catch (error) {
    console.error('[Ikigai Debug] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }

    return res.status(500).json({
      error: 'Error en diagnóstico',
      details: error.message,
      stack: error.stack
    });
  }
}
