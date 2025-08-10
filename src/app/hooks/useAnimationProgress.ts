import { useState, useEffect } from 'react';
import { printerAnimationController } from '../controllers/PrinterAnimationController';

export function useAnimationProgress() {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const UPDATE_INTERVAL = 100; // 10fps updates for UI
    
    const interval = setInterval(() => {
      // Read current progress from animation controller
      const progress = printerAnimationController.getCurrentProgress();
      setDisplayProgress(progress);
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return displayProgress;
}