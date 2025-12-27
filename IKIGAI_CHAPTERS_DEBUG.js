// ============================================
// SCRIPT DE DEBUG PARA IKIGAI CHAPTERS - PÁGINA 1
// ============================================
// INSTRUCCIONES:
// 1. Abre: https://viralikigai.foodib.net/series/jinx-manhwa/?pagina=1
// 2. Copia y pega este script completo en la consola
// 3. Presiona Enter
// 4. Copia los resultados
// 5. Luego navega manualmente a ?pagina=2 y ejecuta el segundo script
// ============================================

(async function debugIkigaiChaptersPage1() {
  console.log('===== IKIGAI CHAPTERS DEBUG =====');
  console.log('URL actual:', window.location.href);
  console.log('');

  // ============================================
  // PASO 1: Detectar paginación
  // ============================================
  console.log('--- PASO 1: DETECTAR PAGINACIÓN ---');
  
  const paginationLinks = Array.from(document.querySelectorAll('a[href*="pagina="]'));
  console.log('Enlaces con "pagina=" encontrados:', paginationLinks.length);
  
  if (paginationLinks.length > 0) {
    const pageNumbers = [];
    paginationLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/pagina=(\d+)/);
      if (match && match[1]) {
        const pageNum = parseInt(match[1], 10);
        if (!isNaN(pageNum)) {
          pageNumbers.push(pageNum);
        }
      }
    });
    
    const maxPage = Math.max(...pageNumbers);
    console.log('Números de página encontrados:', pageNumbers);
    console.log('Total de páginas:', maxPage);
    console.log('');
  } else {
    console.log('⚠️ No se encontraron enlaces de paginación');
    console.log('');
  }

  // ============================================
  // PASO 2: Analizar capítulos en página actual
  // ============================================
  console.log('--- PASO 2: ANALIZAR CAPÍTULOS ---');
  
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
    console.log('⚠️ No se encontraron enlaces de capítulos');
  }
  console.log('');

  // ============================================
  // PASO 3: Extraer capítulos (simulando la función)
  // ============================================
  console.log('--- PASO 3: EXTRAER CAPÍTULOS ---');
  
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
  // PASO 4: Información de enlaces de paginación
  // ============================================
  console.log('--- PASO 4: ENLACES DE PAGINACIÓN ---');
  
  if (paginationLinks.length > 0) {
    console.log('Detalles de enlaces de paginación:');
    paginationLinks.slice(0, 5).forEach((link, i) => {
      console.log(`  ${i + 1}. href: ${link.getAttribute('href')}`);
      console.log(`     text: ${link.textContent.trim()}`);
      console.log(`     class: ${link.className}`);
    });
  }
  console.log('');

  // ============================================
  // PASO 5: Información del DOM
  // ============================================
  console.log('--- PASO 5: INFORMACIÓN DEL DOM ---');
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
  
  console.log('');
  console.log('===== FIN DEBUG PÁGINA 1 =====');
  console.log('');
  console.log('RESUMEN:');
  console.log(`- Capítulos en página actual: ${chapters.length}`);
  console.log(`- Enlaces totales: ${allLinks.length}`);
  console.log(`- Enlaces de capítulos: ${capituloLinks.length}`);
  console.log('');
  console.log('SIGUIENTE PASO:');
  console.log('1. Copia estos resultados');
  console.log('2. Navega manualmente a: ?pagina=2');
  console.log('3. Ejecuta el script IKIGAI_CHAPTERS_DEBUG_PAGE2.js');
  
  return {
    chapters,
    totalLinks: allLinks.length,
    chapterLinks: capituloLinks.length,
    url: window.location.href
  };
})();
