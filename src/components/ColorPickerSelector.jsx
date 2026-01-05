import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const ColorPickerSelector = ({ 
  color, 
  onChange, 
  label, 
  presets = [], 
  showPresets = true,
  modalRef: externalModalRef
}) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(100);
  const [copied, setCopied] = useState(false);

  const saturationRef = useRef(null);
  const hueRef = useRef(null);
  const internalModalRef = useRef(null);
  const modalRef = externalModalRef || internalModalRef;
  const isUpdatingFromProp = useRef(false);

  const hslToHex = useCallback((h, s, l) => {
    const lPercent = l / 100;
    const a = s * Math.min(lPercent, 1 - lPercent) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = lPercent - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }, []);

  const hexToHsl = useCallback((hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }, []);

  const hexColor = hslToHex(hue, saturation, lightness);

  useEffect(() => {
    isUpdatingFromProp.current = true;
    const hsl = hexToHsl(color || '#ffffff');
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    setTimeout(() => {
      isUpdatingFromProp.current = false;
    }, 0);
  }, [color, hexToHsl]);

  const handlePresetClick = (presetColor) => {
    const hsl = hexToHsl(presetColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    onChange(presetColor);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hexColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaturationMouseDown = (e) => {
    setIsDraggingSaturation(true);
    updateSaturationFromMouse(e);
  };

  const handleSaturationTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSaturation(true);
    updateSaturationFromTouch(e);
  };

  const handleHueMouseDown = (e) => {
    setIsDraggingHue(true);
    updateHueFromMouse(e);
  };

  const handleHueTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingHue(true);
    updateHueFromTouch(e);
  };

  const [isDraggingSaturation, setIsDraggingSaturation] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  const updateSaturationFromMouse = useCallback((e) => {
    if (!saturationRef.current || isUpdatingFromProp.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;

    setSaturation(newSaturation);
    setLightness(newLightness);

    const newHexColor = hslToHex(hue, newSaturation, newLightness);
    onChange(newHexColor);
  }, [hue, hslToHex, onChange]);

  const updateSaturationFromTouch = useCallback((e) => {
    if (!saturationRef.current || !e.touches[0] || isUpdatingFromProp.current) return;
    e.preventDefault();
    const rect = saturationRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));

    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - (y / rect.height) * 100;

    setSaturation(newSaturation);
    setLightness(newLightness);

    const newHexColor = hslToHex(hue, newSaturation, newLightness);
    onChange(newHexColor);
  }, [hue, hslToHex, onChange]);

  const updateHueFromMouse = useCallback((e) => {
    if (!hueRef.current || isUpdatingFromProp.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);

    const newHexColor = hslToHex(newHue, saturation, lightness);
    onChange(newHexColor);
  }, [saturation, lightness, hslToHex, onChange]);

  const updateHueFromTouch = useCallback((e) => {
    if (!hueRef.current || !e.touches[0] || isUpdatingFromProp.current) return;
    e.preventDefault();
    const rect = hueRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    setHue(newHue);

    const newHexColor = hslToHex(newHue, saturation, lightness);
    onChange(newHexColor);
  }, [saturation, lightness, hslToHex, onChange]);

  useEffect(() => {
    if (isDraggingSaturation) {
      const handleMove = (e) => {
        updateSaturationFromMouse(e);
      };
      const handleTouchMove = (e) => {
        updateSaturationFromTouch(e);
      };
      const handleEnd = () => setIsDraggingSaturation(false);

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDraggingSaturation, updateSaturationFromMouse, updateSaturationFromTouch]);

  useEffect(() => {
    if (isDraggingHue) {
      const handleMove = (e) => {
        updateHueFromMouse(e);
      };
      const handleTouchMove = (e) => {
        updateHueFromTouch(e);
      };
      const handleEnd = () => setIsDraggingHue(false);

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDraggingHue, updateHueFromMouse, updateHueFromTouch]);

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-600">
          {label}
        </label>
      )}

      <div
        ref={saturationRef}
        onMouseDown={handleSaturationMouseDown}
        onTouchStart={handleSaturationTouchStart}
        className="relative w-full h-36 sm:h-40 rounded-xl mb-3 shadow-lg"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
          userSelect: 'none',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      >
        <motion.div
          className="absolute w-5 h-5 border-4 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
          }}
        />
      </div>

      <div
        ref={hueRef}
        onMouseDown={handleHueMouseDown}
        onTouchStart={handleHueTouchStart}
        className="relative w-full h-7 rounded-lg mb-3 shadow-lg"
        style={{
          background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          cursor: 'pointer',
          touchAction: 'none'
        }}
      >
        <motion.div
          className="absolute w-6 h-full border-4 border-white rounded-lg shadow-lg transform -translate-x-1/2 pointer-events-none"
          style={{
            left: `${(hue / 360) * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
          style={{ backgroundColor: hexColor }}
        />
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">HEX</p>
            <p className="text-lg font-mono font-bold text-gray-800 dark:text-gray-600">
              {hexColor.toUpperCase()}
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            title="Copiar código"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {showPresets && presets.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-600 mb-2">
            Colores populares
          </label>
          <div className="grid grid-cols-8 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.color}
                onClick={() => handlePresetClick(preset.color)}
                className={`aspect-square rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-md ${
                  hexColor.toLowerCase() === preset.color.toLowerCase()
                    ? 'ring-3 ring-potaxie-green ring-offset-2'
                    : ''
                }`}
                style={{ backgroundColor: preset.color }}
                aria-label={`Seleccionar ${preset.name}`}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
