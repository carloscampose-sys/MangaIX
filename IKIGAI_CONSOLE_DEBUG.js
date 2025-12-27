// ============================================================
// SCRIPT DE DEBUG PARA IKIGAI - Ejecutar en la consola del navegador
// ============================================================
// 
// INSTRUCCIONES:
// 1. Abre https://viralikigai.foodib.net/series/ en tu navegador
// 2. Abre DevTools (F12) → pestaña Console
// 3. Copia y pega TODO este código
// 4. Presiona Enter
// 5. El script te guiará paso a paso
// 6. Al final, copia el resultado y compártelo
//
// ============================================================

(async function debugIkigaiSearch() {
  console.clear();
  console.log('%c🔍 IKIGAI SEARCH DEBUGGER 🔍', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #4CAF50;');
  console.log('');
  
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    steps: []
  };
  
  // ============================================================
  // PASO 1: Analizar todos los inputs de búsqueda
  // ============================================================
  console.log('%c📋 PASO 1: Analizando inputs de búsqueda...', 'font-size: 16px; font-weight: bold; color: #2196F3;');
  
  const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[type="text"], input[placeholder*="uscar"], input[placeholder*="ombre"]'));
  
  const inputsInfo = searchInputs.map((input, i) => {
    const parent = input.parentElement;
    const form = input.closest('form');
    const rect = input.getBoundingClientRect();
    
    return {
      index: i,
      type: input.type,
      placeholder: input.placeholder,
      name: input.name,
      id: input.id,
      className: input.className,
      value: input.value,
      isVisible: input.offsetParent !== null,
      position: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      parent: {
        tag: parent?.tagName,
        className: parent?.className,
        id: parent?.id
      },
      form: form ? {
        action: form.action,
        method: form.method,
        hasSubmitButton: form.querySelector('button[type="submit"]') !== null
      } : null
    };
  });
  
  console.table(inputsInfo);
  results.steps.push({
    step: 1,
    name: 'Inputs encontrados',
    data: inputsInfo
  });
  
  // ============================================================
  // PASO 2: Buscar botones de búsqueda
  // ============================================================
  console.log('');
  console.log('%c🔘 PASO 2: Buscando botones de búsqueda...', 'font-size: 16px; font-weight: bold; color: #2196F3;');
  
  const searchButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
    const text = el.textContent.toLowerCase();
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    const title = el.getAttribute('title')?.toLowerCase() || '';
    
    return text.includes('buscar') || 
           text.includes('search') ||
           ariaLabel.includes('buscar') ||
           ariaLabel.includes('search') ||
           title.includes('buscar') ||
           title.includes('search') ||
           el.querySelector('svg'); // Botones con iconos
  });
  
  const buttonsInfo = searchButtons.map((btn, i) => {
    const rect = btn.getBoundingClientRect();
    return {
      index: i,
      tag: btn.tagName,
      text: btn.textContent.trim().substring(0, 50),
      ariaLabel: btn.getAttribute('aria-label'),
      className: btn.className,
      id: btn.id,
      type: btn.type,
      isVisible: btn.offsetParent !== null,
      position: {
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      }
    };
  });
  
  console.table(buttonsInfo);
  results.steps.push({
    step: 2,
    name: 'Botones encontrados',
    data: buttonsInfo
  });
  
  // ============================================================
  // PASO 3: Buscar modales/drawers/panels
  // ============================================================
  console.log('');
  console.log('%c📦 PASO 3: Buscando modales/panels...', 'font-size: 16px; font-weight: bold; color: #2196F3;');
  
  const modals = Array.from(document.querySelectorAll('.modal, .drawer, .panel, [role="dialog"], [class*="search"]')).filter(el => {
    return el.querySelector('input');
  });
  
  const modalsInfo = modals.map((modal, i) => {
    const input = modal.querySelector('input');
    return {
      index: i,
      tag: modal.tagName,
      className: modal.className,
      id: modal.id,
      isVisible: modal.offsetParent !== null,
      hasInput: !!input,
      inputType: input?.type,
      inputPlaceholder: input?.placeholder
    };
  });
  
  console.table(modalsInfo);
  results.steps.push({
    step: 3,
    name: 'Modales/Panels encontrados',
    data: modalsInfo
  });
  
  // ============================================================
  // PASO 4: Interceptar eventos de red
  // ============================================================
  console.log('');
  console.log('%c🌐 PASO 4: Preparando interceptor de red...', 'font-size: 16px; font-weight: bold; color: #2196F3;');
  console.log('Ahora voy a interceptar las peticiones de red.');
  console.log('');
  console.log('%c⚠️ IMPORTANTE: Ahora busca "Amor Maldito" manualmente en el sitio', 'font-size: 14px; font-weight: bold; color: #FF9800; background: #FFF3E0; padding: 10px;');
  console.log('');
  
  const networkRequests = [];
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    networkRequests.push({
      type: 'fetch',
      method: options.method || 'GET',
      url: url.toString(),
      body: options.body,
      timestamp: new Date().toISOString()
    });
    
    console.log('%c→ FETCH:', 'color: #4CAF50; font-weight: bold;', options.method || 'GET', url);
    
    return originalFetch.apply(this, args);
  };
  
  // Interceptar XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method;
    this._url = url;
    return originalOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    networkRequests.push({
      type: 'xhr',
      method: this._method,
      url: this._url,
      body: body,
      timestamp: new Date().toISOString()
    });
    
    console.log('%c→ XHR:', 'color: #2196F3; font-weight: bold;', this._method, this._url);
    
    return originalSend.apply(this, arguments);
  };
  
  // Observar cambios en la URL
  let lastUrl = window.location.href;
  const urlChanges = [];
  
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      urlChanges.push({
        from: lastUrl,
        to: window.location.href,
        timestamp: new Date().toISOString()
      });
      console.log('%c→ URL CAMBIÓ:', 'color: #9C27B0; font-weight: bold;', window.location.href);
      lastUrl = window.location.href;
    }
  }, 100);
  
  // ============================================================
  // PASO 5: Esperar a que el usuario busque
  // ============================================================
  console.log('');
  console.log('%c⏳ Esperando 30 segundos...', 'font-size: 14px; color: #FF9800;');
  console.log('Durante este tiempo:');
  console.log('1. Busca "Amor Maldito" en el sitio');
  console.log('2. Observa qué pasa');
  console.log('3. Espera a que aparezcan los resultados');
  console.log('');
  
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // ============================================================
  // PASO 6: Mostrar resultados
  // ============================================================
  console.log('');
  console.log('%c✅ ANÁLISIS COMPLETADO', 'font-size: 20px; font-weight: bold; color: #4CAF50;');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #4CAF50;');
  console.log('');
  
  results.steps.push({
    step: 4,
    name: 'Peticiones de red capturadas',
    data: networkRequests
  });
  
  results.steps.push({
    step: 5,
    name: 'Cambios de URL',
    data: urlChanges
  });
  
  results.finalUrl = window.location.href;
  
  // Analizar resultados en la página
  const seriesLinks = Array.from(document.querySelectorAll('a[href*="/series/"]'));
  const seriesTitles = seriesLinks
    .map(link => {
      const titleEl = link.querySelector('h3, h2, h1, p');
      return titleEl?.textContent?.trim();
    })
    .filter(Boolean)
    .slice(0, 10);
  
  results.steps.push({
    step: 6,
    name: 'Primeros 10 títulos en la página',
    data: seriesTitles
  });
  
  console.log('%c📊 RESUMEN:', 'font-size: 16px; font-weight: bold; color: #2196F3;');
  console.log('');
  console.log('Inputs encontrados:', inputsInfo.length);
  console.log('Botones encontrados:', buttonsInfo.length);
  console.log('Modales/Panels encontrados:', modalsInfo.length);
  console.log('Peticiones de red:', networkRequests.length);
  console.log('Cambios de URL:', urlChanges.length);
  console.log('URL final:', window.location.href);
  console.log('');
  
  if (networkRequests.length > 0) {
    console.log('%c🌐 Peticiones de red capturadas:', 'font-weight: bold; color: #4CAF50;');
    console.table(networkRequests);
  } else {
    console.log('%c⚠️ No se capturaron peticiones de red', 'color: #FF9800; font-weight: bold;');
  }
  
  if (urlChanges.length > 0) {
    console.log('%c🔗 Cambios de URL:', 'font-weight: bold; color: #4CAF50;');
    console.table(urlChanges);
  } else {
    console.log('%c⚠️ La URL no cambió', 'color: #FF9800; font-weight: bold;');
  }
  
  console.log('');
  console.log('%c📋 Primeros 10 títulos encontrados:', 'font-weight: bold;');
  seriesTitles.forEach((title, i) => {
    const hasAmor = title.toLowerCase().includes('amor');
    const hasMaldito = title.toLowerCase().includes('maldito');
    const color = (hasAmor || hasMaldito) ? '#4CAF50' : '#999';
    console.log(`%c${i + 1}. ${title}`, `color: ${color};`);
  });
  
  console.log('');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #4CAF50;');
  console.log('%c📤 COPIA EL SIGUIENTE JSON Y COMPÁRTELO:', 'font-size: 16px; font-weight: bold; color: #FF5722; background: #FFEBEE; padding: 10px;');
  console.log('%c═══════════════════════════════════════════════════════', 'color: #4CAF50;');
  console.log('');
  
  const resultJson = JSON.stringify(results, null, 2);
  console.log(resultJson);
  
  console.log('');
  console.log('%c💡 TIP: Haz click derecho en el JSON de arriba → "Copy object" para copiarlo fácilmente', 'color: #2196F3; font-style: italic;');
  console.log('');
  
  // Intentar copiar al portapapeles
  try {
    await navigator.clipboard.writeText(resultJson);
    console.log('%c✅ JSON copiado al portapapeles automáticamente!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  } catch (e) {
    console.log('%c⚠️ No se pudo copiar automáticamente. Copia manualmente el JSON de arriba.', 'color: #FF9800;');
  }
  
  return results;
})();
