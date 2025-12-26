import React, { useState } from 'react';

export function IkigaiDebugger() {
  const [url, setUrl] = useState('https://viralikigai.eurofiyati.online/series/?generos[]=906409527934582787');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runDebug = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ikigai/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: true,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl max-w-md">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        🔍 Ikigai Debugger
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          URL a probar:
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
          placeholder="URL"
        />
      </div>

      <button
        onClick={runDebug}
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold disabled:opacity-50"
      >
        {loading ? '⏳ Ejecutando...' : '▶ Ejecutar Debug'}
      </button>

      {result && (
        <div className="mt-4 max-h-96 overflow-y-auto">
          {result.error ? (
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-200 text-sm">
              ❌ Error: {result.message || result.details}
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <div className="font-bold mb-2 text-gray-900 dark:text-white">📊 Información de la página:</div>
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <div>• Total enlaces: {result.pageInfo?.linkCount}</div>
                  <div>• Enlaces /series/: {result.pageInfo?.seriesLinkCount}</div>
                  <div>• Imágenes: {result.pageInfo?.imageCount}</div>
                  <div>• Tamaño HTML: {result.pageInfo?.htmlLength} bytes</div>
                  <div>• Tiene Qwik: {result.pageInfo?.hasQwikScript ? '✅' : '❌'}</div>
                </div>
              </div>

              {result.pageInfo?.allLinks && result.pageInfo.allLinks.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-xs">
                  <div className="font-bold mb-2 text-gray-900 dark:text-white">🔗 Primeros enlaces:</div>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300">
                    {result.pageInfo.allLinks.map((link, i) => (
                      <div key={i} className="truncate">
                        {i + 1}. {link.href}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded text-xs">
                  <div className="font-bold mb-2 text-gray-900 dark:text-white">⚠️ Errores JS:</div>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300">
                    {result.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              {result.screenshot && (
                <div className="mb-4">
                  <div className="font-bold mb-2 text-sm text-gray-900 dark:text-white">📸 Screenshot:</div>
                  <img
                    src={result.screenshot}
                    alt="Screenshot"
                    className="w-full border rounded"
                  />
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-bold text-sm text-gray-900 dark:text-white">
                  Ver JSON completo
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto text-gray-900 dark:text-white">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
