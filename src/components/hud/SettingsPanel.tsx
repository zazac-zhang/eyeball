import { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useThemeStore } from '../../stores/themeStore';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [corneaOpacity, setCorneaOpacity] = useState(0.35);
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [showSafetyCone, setShowSafetyCone] = useState(true);
  const [showNormalIndicator, setShowNormalIndicator] = useState(true);

  const mode = useSimulationStore((s) => s.mode);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-lg border border-blue-500/30 bg-gray-950/95 p-6 text-blue-100 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between border-b border-blue-500/20 pb-2">
          <h2 className="text-lg font-semibold text-blue-400">Settings</h2>
          <button
            onClick={onClose}
            className="rounded border border-blue-500/30 bg-blue-500/20 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/30"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between rounded border border-blue-500/15 bg-blue-500/5 px-3 py-2">
            <div>
              <label className="block text-sm text-blue-100">Theme</label>
              <p className="text-xs text-blue-300/60">Choose your preferred color scheme</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTheme('dark');
                }}
                className={`rounded border px-3 py-1.5 text-xs transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500/60 bg-blue-500/30 text-blue-100'
                    : 'border-blue-500/20 bg-blue-500/10 text-blue-300/70 hover:bg-blue-500/20'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => {
                  setTheme('light');
                }}
                className={`rounded border px-3 py-1.5 text-xs transition-all ${
                  theme === 'light'
                    ? 'border-amber-500/60 bg-amber-500/30 text-amber-100'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300/70 hover:bg-amber-500/20'
                }`}
              >
                ☀️ Light
              </button>
            </div>
          </div>

          {/* Cornea Opacity */}
          <div>
            <label className="mb-1.5 block text-sm text-blue-100">
              Cornea Opacity: {corneaOpacity.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.05}
              value={corneaOpacity}
              onChange={(e) => { setCorneaOpacity(parseFloat(e.target.value)); }}
              className="w-full accent-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
              disabled={mode !== 'VIEW'}
            />
            <p className="mt-1 text-xs text-blue-300/60">
              Adjust transparency of the cornea. Changes apply in VIEW mode.
            </p>
          </div>

          {/* Light Intensity */}
          <div>
            <label className="mb-1.5 block text-sm text-blue-100">
              Light Intensity: {lightIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={lightIntensity}
              onChange={(e) => { setLightIntensity(parseFloat(e.target.value)); }}
              className="w-full accent-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <p className="mt-1 text-xs text-blue-300/60">
              Adjust scene lighting intensity.
            </p>
          </div>

          {/* Visibility Toggles */}
          <div className="space-y-2">
            <label className="block text-sm text-blue-100">Visualization</label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showSafetyCone}
                onChange={(e) => { setShowSafetyCone(e.target.checked); }}
                className="accent-blue-500"
              />
              <span className="text-sm text-blue-200">Show Safety Cone (max tilt)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNormalIndicator}
                onChange={(e) => { setShowNormalIndicator(e.target.checked); }}
                className="accent-blue-500"
              />
              <span className="text-sm text-blue-200">Show Normal Indicator</span>
            </label>
          </div>

          {/* Info */}
          <div className="rounded border border-blue-500/15 bg-blue-500/5 px-3 py-2">
            <p className="text-xs text-blue-300/70">
              💡 Tip: Settings are saved to localStorage and persist across sessions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2 border-t border-blue-500/20 pt-4">
          <button
            onClick={onClose}
            className="pointer-events-auto rounded border border-blue-500/40 bg-blue-500/20 px-4 py-1.5 text-xs text-blue-100 transition-all duration-150 hover:bg-blue-500/40 hover:border-blue-500/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
