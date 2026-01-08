/**
 * API Route: Ikigai Load Series Progressive
 * Carga series en chunks para respetar límite de 10s de Vercel
 */

export default async function handler(req, res) {
  const startTime = Date.now();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chunk = 5, startPage = 1 } = req.query;

  try {
    console.log(`[Ikigai Progressive Load] Chunk: ${chunk}, StartPage: ${startPage}`);
    
    const pagesToLoad = [];
    for (let i = 0; i < parseInt(chunk); i++) {
      pagesToLoad.push(parseInt(startPage) + i);
    }

    const allResults = await Promise.allSettled(
      pagesToLoad.map(async (page) => {
        const apiUrl = `https://panel.ikigaimangas.com/api/swf/series?page=${page}&nsfw=true`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) {
            console.log(`[Ikigai Progressive Load] corsproxy falló para página ${page}, intentando thingproxy...`);
            const thingProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(apiUrl)}`;
            const fallbackResponse = await fetch(thingProxyUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (!fallbackResponse.ok) {
              throw new Error(`Error en página ${page}: ${response.status}`);
            }
            
            return fallbackResponse.json();
          }
          
          return response.json();
        } catch (error) {
          console.error(`[Ikigai Progressive Load] Error página ${page}:`, error.message);
          return null;
        }
      })
    );

    const series = allResults
      .filter(r => r.status === 'fulfilled' && r.value?.data)
      .flatMap(r => r.value.data);

    const loadedPages = allResults.filter(r => r.status === 'fulfilled' && r.value).length;
    const actualStartPage = parseInt(startPage);
    
    let totalSeries = null;
    const firstSuccessfulResult = allResults.find(
      r => r.status === 'fulfilled' && r.value?.total
    );

    if (firstSuccessfulResult) {
      totalSeries = firstSuccessfulResult.value.total;
      console.log(`[Ikigai Progressive Load] Total series desde API: ${totalSeries}`);
    }
    
    const totalPages = totalSeries ? Math.ceil(totalSeries / 15) : 338;
    const percent = totalSeries 
      ? ((actualStartPage - 1) * 15 + series.length) / totalSeries * 100
      : ((actualStartPage - 1 + loadedPages) / totalPages) * 100;

    const timeElapsed = Date.now() - startTime;
    const timePerPage = timeElapsed / loadedPages;
    const pagesRemaining = totalPages - (actualStartPage - 1) - loadedPages;
    const estimatedTimeRemaining = Math.ceil((pagesRemaining * timePerPage) / 1000);

    console.log(`[Ikigai Progressive Load] Series: ${series.length}, Total: ${totalSeries || 'N/A'}, Percent: ${percent.toFixed(1)}%, ETA: ${estimatedTimeRemaining}s`);

    return res.status(200).json({
      series,
      loaded: actualStartPage - 1 + loadedPages,
      nextPage: actualStartPage + loadedPages,
      isComplete: (actualStartPage - 1 + loadedPages) >= totalPages,
      percent,
      totalSeries,
      estimatedTimeRemaining
    });

  } catch (error) {
    console.error('[Ikigai Progressive Load] Error:', error);
    return res.status(500).json({
      error: 'Error en carga progresiva',
      details: error.message
    });
  }
}
