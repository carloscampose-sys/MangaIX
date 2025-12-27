// ============================================
// SCRIPT DE DEBUG PARA IKIGAI CHAPTERS - PÁGINA 2
// ============================================
// INSTRUCCIONES:
// 1. Navega manualmente a: https://viralikigai.foodib.net/series/jinx-manhwa/?pagina=2
// 2. Espera a que cargue completamente (3-5 segundos)
// 3. Copia y pega este script completo en la consola
// 4. Presiona Enter
// 5. Copia los resultados y compáralos con los de página 1
// ============================================

(async function debugIkigaiChaptersPage2() {
  console.log('===== IKIGAI CHAPTERS DEBUG - PÁGINA 2 =====');
  console.log('URL actual:', window.location.href);
  console.log('');

  // Verificar que estamos en página 2
  if (!window.location.href.includes('pagina=2')) {
    console.error('⚠️ ERROR: No estás en la página 2');
    console.error('Por favor navega a: ?pagina=2');
    return;
  }

  // ============================================
  // PASO 1: Analizar capítulos en página 2
  // ============================================
  console.log('--- PASO 1: ANALIZAR CAPÍTULOS EN PÁGINA 2 ---');
  
  const allLinks = document.querySelectorAll('a');
  console.log('Total de enlaces en la página:', allLinks.length);
  
  const capituloLinks = document.querySelectorAll('a[href*="/capitulo/"]');
  console.log('Enlaces con "/capitulo/":', capituloLinks.length);
  
  if (capituloLinks.length > 0) {
    console.log('');
    console.log('Muestra de enlaces de capítulos:');
    Array.from(capituloLinks).slice(0, 5).forEach((link, i) => {
      console.log(`  ${i + 1}. href: ${link.getAttribute('href')}`);
      console.log(`     text: ${link.textContent.trim().substring(0, 50)}`);
    });
  } else {
    console.log('❌ No se encontraron enlaces de capítulos');
    console.log('');
    console.log('Buscando otros patrones de enlaces:');
    
    // Buscar otros patrones
    const patterns = [
      { name: 'leer', selector: 'a[href*="/leer/"]' },
      { name: 'read', selector: 'a[href*="/read/"]' },
      { name: 'chapter', selector: 'a[href*="/chapter/"]' },
      { name: 'cap', selector: 'a[href*="/cap"]' }
    ];
    
    patterns.forEach(({ name, selector }) => {
      const links = document.querySelectorAll(selector);
      if (links.length > 0) {
        console.log(`  ✓ Encontrados ${links.length} enlaces con patrón "${name}"`);
        console.log(`    Ejemplo: ${links[0].getAttribute('href')}`);
      }
    });
  }
  console.log('');

  // ============================================
  // PASO 2: Extraer capítulos
  // ============================================
  console.log('--- PASO 2: EXTRAER CAPÍTULOS ---');
  
  const chapters = [];
  capituloLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    let chapter = '';
    const text = link.textContent || '';
    
    // Estrategia 1: Extraer del texto
    const textPatterns = [
      /cap[íi]tulo\s*(\d+\.?\d*)/i,
      /chapter\s*(\d+\.?\d*)/i,
      /cap\s*\.*\s*(\d+\.?\d*)/i,
      /#\s*(\d+\.?\d*)/,
      /^\s*(\d+\.?\d*)\s*$/
    ];
    
    for (const pattern of textPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        chapter = match[1];
        break;
      }
    }
    
    // Estrategia 2: Extraer cualquier número del texto
    if (!chapter) {
      const textMatch = text.match(/(\d+\.?\d*)/);
      if (textMatch && textMatch[1]) {
        chapter = textMatch[1];
      }
    }
    
    // Estrategia 3: Extraer del URL
    if (!chapter) {
      const urlPatterns = [
        /-(\d+\.?\d*)\/?$/,
        /-(\d+\.?\d*)-/,
        /cap(?:itulo)?-(\d+\.?\d*)/i,
        /chapter-(\d+\.?\d*)/i,
        /\/(\d+\.?\d*)\/?$/
      ];
      
      for (const pattern of urlPatterns) {
        const match = href.match(pattern);
        if (match && match[1]) {
          chapter = match[1];
          break;
        }
      }
    }
    
    if (!chapter) return;
    
    const chapterNum = parseFloat(chapter);
    if (isNaN(chapterNum) || chapterNum < 0 || chapterNum > 9999) {
      return;
    }
    
    const title = text.trim() || `Capítulo ${chapter}`;
    
    chapters.push({
      chapter,
      title: title.substring(0, 200),
      url: href.startsWith('http') ? href : `https://viralikigai.foodib.net${href}`
    });
  });
  
  console.log('Capítulos extraídos:', chapters.length);
  
  if (chapters.length > 0) {
    console.log('');
    console.log('Primeros 5 capítulos:');
    chapters.slice(0, 5).forEach(ch => {
      console.log(`  Cap ${ch.chapter}: ${ch.title.substring(0, 40)}`);
    });
    
    console.log('');
    console.log('Últimos 5 capítulos:');
    chapters.slice(-5).forEach(ch => {
      console.log(`  Cap ${ch.chapter}: ${ch.title.substring(0, 40)}`);
    });
  }
  console.log('');

  // ============================================
  // PASO 3: Comparar con estructura de página 1
  // ============================================
  console.log('--- PASO 3: ANÁLISIS DEL DOM ---');
  console.log('Body length:', document.body.innerText.length);
  console.log('Title:', document.title);
  
  // Buscar contenedores de capítulos
  const possibleContainers = [
    '.chapters-list',
    '[class*="chapter"]',
    '[class*="capitulo"]',
    '[class*="episode"]',
    '[id*="chapter"]',
    '[id*="capitulo"]'
  ];
  
  console.log('');
  console.log('Contenedores posibles:');
  possibleContainers.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`  ${selector}: ${elements.length} elementos`);
    }
  });
  
  // ============================================
  // PASO 4: Verificar si el contenido es diferente
  // ============================================
  console.log('');
  console.log('--- PASO 4: VERIFICACIÓN DE CONTENIDO ---');
  
  // Buscar indicadores de que estamos en página 2
  const bodyText = document.body.innerText;
  const hasPage2Indicator = bodyText.includes('Página 2') || 
                            bodyText.includes('Page 2') ||
                            window.location.href.includes('pagina=2');
  
  console.log('Indicador de página 2:', hasPage2Indicator ? '✓ SÍ' : '✗ NO');
  
  // Verificar si hay elementos de paginación activos
  const activePaginationElements = document.querySelectorAll('[class*="active"], [class*="current"]');
  console.log('Elementos de paginación activos:', activePaginationElements.length);
  
  if (activePaginationElements.length > 0) {
    console.log('Muestra:');
    Array.from(activePaginationElements).slice(0, 3).forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName} - ${el.textContent.trim().substring(0, 30)}`);
    });
  }
  
  console.log('');
  console.log('===== FIN DEBUG PÁGINA 2 =====');
  console.log('');
  console.log('RESUMEN:');
  console.log(`- URL: ${window.location.href}`);
  console.log(`- Capítulos encontrados: ${chapters.length}`);
  console.log(`- Enlaces totales: ${allLinks.length}`);
  console.log(`- Enlaces de capítulos: ${capituloLinks.length}`);
  console.log('');
  console.log('COMPARACIÓN:');
  console.log('Compara estos números con los de página 1');
  console.log('Si página 2 tiene 0 capítulos pero página 1 tenía capítulos,');
  console.log('entonces el problema es que el contenido no está cargando.');
  
  return {
    chapters,
    totalLinks: allLinks.length,
    chapterLinks: capituloLinks.length,
    url: window.location.href
  };
})();
