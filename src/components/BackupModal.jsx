import React, { useState, useRef } from 'react';
import { X, Download, Upload, Check, AlertCircle, Database, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportImportService } from '../services/exportImportService';
import { useLibrary } from '../context/LibraryContext';
import confetti from 'canvas-confetti';

// Simple toast notification function
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-[10000] px-6 py-3 rounded-lg shadow-lg text-white font-bold ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } animate-fade-in`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

export function BackupModal({ isOpen, onClose }) {
  const { level, devouredChapters, library } = useLibrary();
  const [activeTab, setActiveTab] = useState('export');
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Manejar exportación
  const handleExport = () => {
    try {
      setIsProcessing(true);
      const data = exportImportService.exportAllData();
      exportImportService.downloadBackup(data);
      
      showToast('¡Backup exportado exitosamente! 💾 ✨', 'success');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      showToast('Error al exportar: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setImportFile(file);
      
      const data = await exportImportService.readBackupFile(file);
      const validation = exportImportService.validateImportData(data);
      
      if (!validation.valid) {
        showToast(validation.error, 'error');
        setImportFile(null);
        setImportData(null);
        return;
      }
      
      setImportData(data);
      showToast('Archivo validado correctamente ✓', 'success');
    } catch (error) {
      showToast('Error al leer el archivo: ' + error.message, 'error');
      setImportFile(null);
      setImportData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar importación
  const handleImport = () => {
    if (!importData) return;

    try {
      setIsProcessing(true);
      
      exportImportService.importAllData(importData, importMode);
      
      showToast('¡Datos importados exitosamente! 🎉 ✨', 'success');
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showToast('Error al importar: ' + error.message, 'error');
      setIsProcessing(false);
    }
  };

  // Manejar drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/json') {
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    } else {
      showToast('Por favor, arrastra un archivo JSON válido', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal - Centrado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="text-potaxie-green" size={28} />
                <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">
                  Backup de Datos
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 px-4 font-bold text-sm md:text-base transition-colors ${
                  activeTab === 'export'
                    ? 'text-potaxie-green border-b-2 border-potaxie-green'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Download size={18} className="inline mr-2" />
                Exportar
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 px-4 font-bold text-sm md:text-base transition-colors ${
                  activeTab === 'import'
                    ? 'text-potaxie-green border-b-2 border-potaxie-green'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Upload size={18} className="inline mr-2" />
                Importar
              </button>
            </div>

            {/* Export Tab */}
            {activeTab === 'export' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Data Summary */}
                <div className="bg-gradient-to-br from-potaxie-green/10 to-potaxie-green/5 rounded-xl p-6 border border-potaxie-green/20">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                    📊 Resumen de tus datos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📚</span>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mangas en biblioteca</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{library?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🥑</span>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Capítulos devorados</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{devouredChapters}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">✨</span>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Nivel actual</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{level.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎨</span>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Personalización</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">Guardada</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">¿Qué se exportará?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Tu biblioteca completa y progreso de lectura</li>
                      <li>Capítulos devorados y logros</li>
                      <li>Tema personalizado y fondo de pantalla</li>
                      <li>Configuración de fuentes y preferencias</li>
                    </ul>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-potaxie-green to-green-600 text-white hover:from-potaxie-green/90 hover:to-green-600/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download size={24} />
                      Exportar Todos los Datos 💾
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Se descargará un archivo JSON con todos tus datos. Guárdalo en un lugar seguro.
                </p>
              </motion.div>
            )}

            {/* Import Tab */}
            {activeTab === 'import' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* File Upload */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-potaxie-green transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {importFile ? importFile.name : 'Arrastra tu archivo de backup aquí'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    o haz clic para seleccionar un archivo JSON
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Preview */}
                {importData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Preview Data */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Check className="text-green-500" size={20} />
                        Vista Previa del Backup
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Mangas</p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">
                            {importData.metadata?.totalMangas || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Capítulos</p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">
                            {importData.metadata?.totalChaptersRead || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Nivel</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {importData.metadata?.level || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Exportado</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">
                            {new Date(importData.exportDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Import Mode */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Modo de importación
                      </label>
                      <div className="space-y-2">
                        <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${importMode === 'replace' ? 'border-potaxie-green bg-potaxie-green/5' : 'border-gray-200 dark:border-gray-700'}`}>
                          <input
                            type="radio"
                            name="importMode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">Reemplazar todo</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Borra tus datos actuales y carga el backup completo
                            </p>
                          </div>
                        </label>
                        <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${importMode === 'merge' ? 'border-potaxie-green bg-potaxie-green/5' : 'border-gray-200 dark:border-gray-700'}`}>
                          <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">Fusionar</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Combina el backup con tus datos actuales (sin duplicados)
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Se creará un backup automático de tus datos actuales antes de importar.
                      </p>
                    </div>

                    {/* Import Button */}
                    <button
                      onClick={handleImport}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload size={24} />
                          Importar Datos 📂
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
