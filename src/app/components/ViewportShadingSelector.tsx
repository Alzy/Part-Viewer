'use client';

import { useViewerStore } from '../store/useViewerStore';

interface ViewModeOption {
  mode: 'textured' | 'wireframe' | 'flat';
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

export default function ViewportShadingSelector() {
  const { viewMode, setViewMode } = useViewerStore();

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-1">
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
  );
}