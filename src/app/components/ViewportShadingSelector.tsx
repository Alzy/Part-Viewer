'use client';

import { useViewerStore } from '../store/useViewerStore';
import { useProjectStore } from '../store/useProjectStore';

interface ViewModeOption {
  mode: 'textured' | 'wireframe' | 'flat';
  label: string;
  icon: string;
}

interface StressViewModeOption {
  mode: 'voxels' | 'vertex_shading';
  label: string;
  icon: string;
}

const viewModes: ViewModeOption[] = [
  {
    mode: 'textured',
    label: 'Textured',
    icon: '/icons/textured-mode.svg'
  },
  {
    mode: 'wireframe',
    label: 'Wireframe',
    icon: '/icons/wireframe-mode.svg'
  },
  {
    mode: 'flat',
    label: 'Flat',
    icon: '/icons/flat-mode.svg'
  }
];

const stressViewModes: StressViewModeOption[] = [
  {
    mode: 'vertex_shading',
    label: 'Vertex Shading',
    icon: '/icons/textured-mode.svg'
  },
  {
    mode: 'voxels',
    label: 'Voxels',
    icon: '/icons/cube.svg'
  },
];

export default function ViewportShadingSelector() {
  const { viewMode, setViewMode, showStressData, setShowStressData, stressDataViewMode, setStressDataViewMode } = useViewerStore();
  const project = useProjectStore(state => state.project);
  
  // Check if we should show stress data controls
  const hasSuccessfulValidation = project?.validityReport?.success === true;

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      {/* Main view mode selector */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-1">
        {viewModes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`
              relative p-2 rounded transition-all duration-200
              ${viewMode === mode
                ? 'bg-blue-500 text-white shadow-md'
                : 'hover:bg-gray-100 text-gray-700'
              }
            `}
            title={label}
            aria-label={`Switch to ${label} view`}
          >
            <img
              src={icon}
              alt={label}
              className={`
                w-5 h-5 transition-all duration-200
                ${viewMode === mode ? 'filter invert brightness-200' : ''}
              `}
              onError={(e) => {
                // Fallback to text if icon fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span
              className="text-xs font-medium"
              style={{
                display: 'none',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {label.charAt(0).toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      {/* Stress data controls - only show if validation was successful */}
      {hasSuccessfulValidation && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-2">
          {/* Stress data toggle */}
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              id="showStressData"
              checked={showStressData}
              onChange={(e) => setShowStressData(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showStressData" className="text-sm font-medium text-gray-700">
              Show Stress Data
            </label>
          </div>

          {/* Stress view mode selector - only show if stress data is enabled */}
          {showStressData && (
            <div className="flex gap-1 border-t border-gray-200 pt-2">
              {stressViewModes.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => setStressDataViewMode(mode)}
                  className={`
                    relative p-2 rounded transition-all duration-200 text-xs
                    ${stressDataViewMode === mode
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                  title={label}
                  aria-label={`Switch to ${label} stress view`}
                >
                  <img
                    src={icon}
                    alt={label}
                    className={`
                      w-4 h-4 transition-all duration-200
                      ${stressDataViewMode === mode ? 'filter invert brightness-200' : ''}
                    `}
                    onError={(e) => {
                      // Fallback to text if icon fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      display: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {label.charAt(0).toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}