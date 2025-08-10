'use client';

import React from 'react';
import { usePrinterStore } from '../store/usePrinterStore';
import { useAnimationProgress } from '../hooks/useAnimationProgress';
import { printerAnimationController } from '../controllers/PrinterAnimationController';

const PrinterControls: React.FC = () => {
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
    <div className="printer-controls p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Printer Controls</h3>
      
      {/* Play/Pause Button */}
      <div className="mb-4">
        <button
          onClick={handlePlayToggle}
          className={`px-4 py-2 rounded font-medium ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      {/* Progress Scrubber */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Progress: {Math.round(progress * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(e) => handleProgressScrub(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Speed Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Speed: {speed.toFixed(2)}x
        </label>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.1x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Status Display */}
      <div className="text-sm text-gray-600">
        <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
        <div>Progress: {Math.round(progress * 100)}%</div>
        <div>Speed: {speed.toFixed(2)}x</div>
      </div>
    </div>
  );
};

export default PrinterControls;