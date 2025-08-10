'use client';

import React from 'react';
import { usePrinterStore } from '../store/usePrinterStore';
import { useAnimationProgress } from '../hooks/useAnimationProgress';
import { printerAnimationController } from '../controllers/PrinterAnimationController';

export const PrinterControls: React.FC = () => {
  const { speed, isPlaying, play, pause, setSpeed } = usePrinterStore();
  const progress = useAnimationProgress();

  const handleProgressScrub = (newProgress: number) => {
    // Immediately sync animation state
    printerAnimationController.setProgress(newProgress);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="printer-controls">
      <div className="flex items-center gap-6">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayToggle}
          className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isPlaying ? 'Pause' : 'Continue'}
        </button>
        
        {/* Progress Section */}
        <div className="flex items-center gap-3 flex-1 min-w-48">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Progress:
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => handleProgressScrub(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-medium text-gray-700 min-w-12">
            {Math.round(progress * 100)}%
          </span>
        </div>
        
        {/* Speed Section */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Speed:
          </label>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-medium text-gray-700 min-w-10">
            {speed.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrinterControls;