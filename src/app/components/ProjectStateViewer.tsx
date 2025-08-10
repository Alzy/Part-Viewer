'use client';

import { useProjectStore } from '../store/useProjectStore';
import { usePrinterStore } from '../store/usePrinterStore';
import { useViewerStore } from '../store/useViewerStore';
import { getKeyframesFromObject3D } from '../utils/printingUtilities';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { CheckCircledIcon, CrossCircledIcon, ClockIcon } from '@radix-ui/react-icons';
import { Vector3, Quaternion, Euler } from 'three';

export default function ProjectStateViewer() {
  const project = useProjectStore(state => state.project);
  const setValidityReport = useProjectStore(state => state.setValidityReport);
  const setPrintReady = useProjectStore(state => state.setPrintReady);
  const selectedPartId = useViewerStore(state => state.selectedPartId);
  const selectPart = useViewerStore(state => state.selectPart);
  
  // Printer store actions
  const setKeyframes = usePrinterStore(state => state.setKeyframes);
  const play = usePrinterStore(state => state.play);
  const isPlaying = usePrinterStore(state => state.isPlaying);
  
  const selectedPart = project?.parts.find(part => part.id === selectedPartId);
  
  const handleValidate = () => {
    // We'll just dummy the success til I can think of a better simulation
    const success = Math.random() > 0.3;

    // Mock validation for demonstration
    const mockReport = {
      validatedAt: new Date(),
      success: success,
      summary: success ? 'All checks passed' : 'Issues detected in geometry'
    };
    setValidityReport(mockReport);
    setPrintReady(success); // Control print gate based on validation
  };

  const handleStartPrint = () => {
    if (!project?.sceneRoot) return;
    
    // Extract keyframes from validated project
    const keyframes = getKeyframesFromObject3D(project.sceneRoot);
    if (keyframes.length > 1) {
      setKeyframes(keyframes); // PrinterStore: Set print path
      play(); // PrinterStore: Start printing immediately
    } else {
      console.warn('No valid keyframes found in project');
    }
  };

  const renderStartPrintButton = () => {
    // Hide start print button when already printing
    if (!project?.validityReport?.success || !project?.isPrintReady || isPlaying) {
      return null;
    }
    
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-green-800">Ready to Print</h5>
            <p className="text-xs text-green-600">Project validated successfully</p>
          </div>
          <button
            onClick={handleStartPrint}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium transition-colors"
          >
            Start Print
          </button>
        </div>
      </div>
    );
  };

  const renderPrintingStatus = () => {
    if (!isPlaying) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium text-blue-600">Printing in Progress</span>
          </div>
          <p className="text-sm text-gray-700">
            Project is currently being printed. Validation is disabled during printing.
          </p>
          <div className="text-xs text-gray-500">
            Use the floating controls at the bottom to manage the print job.
          </div>
        </div>
      </div>
    );
  };

  const renderPartsList = () => (
    <div className="space-y-1">
      {project?.parts.map((part, index) => (
        <div
          key={part.id}
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-md border ${
            selectedPartId === part.id ? 'bg-blue-100 text-blue-900 border-blue-300' : 'text-gray-700 border-gray-200 hover:border-blue-200'
          }`}
          onClick={() => selectPart(part.id)}
        >
          <div className="flex items-center mr-3">
            <img
              src="/icons/cube.svg"
              alt="Part"
              className="w-4 h-4 text-gray-500"
              onError={(e) => {
                // Fallback to a simple div if icon fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-mono">
              {part.name || `Part ${index + 1}`}
            </div>
            <div className="text-xs text-gray-500">
              ID: {part.id.substring(0, 8)}...
            </div>
          </div>
        </div>
      )) || (
        <div className="text-sm text-gray-500 italic p-3">No parts loaded</div>
      )}
    </div>
  );

  const renderSelectedPartDetails = () => {
    if (!selectedPart) {
      return (
        <div className="p-4 text-sm text-gray-500">
          Select a part to view details
        </div>
      );
    }

    // Extract transform data using Three.js utilities
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    selectedPart.matrix.decompose(position, quaternion, scale);
    
    // Convert quaternion to Euler angles and then to degrees
    const euler = new Euler().setFromQuaternion(quaternion);
    const rotationDegrees = {
      x: euler.x * (180 / Math.PI),
      y: euler.y * (180 / Math.PI),
      z: euler.z * (180 / Math.PI)
    };

    return (
      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-sm text-gray-800 mb-1">
            {selectedPart.name}
          </h4>
          <p className="text-xs text-gray-500">ID: {selectedPart.id}</p>
        </div>

        {/* Position */}
        <div>
          <label className="text-xs text-gray-500 uppercase mb-2 block">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'X', value: position.x },
              { label: 'Y', value: position.y },
              { label: 'Z', value: position.z }
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-gray-600">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={value.toFixed(3)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="text-xs text-gray-500 uppercase mb-2 block">Rotation (degrees)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'X', value: rotationDegrees.x },
              { label: 'Y', value: rotationDegrees.y },
              { label: 'Z', value: rotationDegrees.z }
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-gray-600">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={value.toFixed(1)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="text-xs text-gray-500 uppercase mb-2 block">Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'X', value: scale.x },
              { label: 'Y', value: scale.y },
              { label: 'Z', value: scale.z }
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs text-gray-600">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={value.toFixed(3)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-800"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white border-l border-gray-300 select-none overflow-hidden">
      {/* Project Header */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-300">
        <h3 className="font-semibold text-sm text-gray-800">
          {project?.name || 'Loading...'}
        </h3>
        <p className="text-xs text-gray-600">
          {project?.parts?.length || 0} parts
        </p>
      </div>

      {/* Parts List - 40% of height */}
      <div className="h-[40%] flex flex-col min-h-0 max-h-[40%] overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 border-b border-gray-300">
          <h4 className="font-medium text-sm">Parts</h4>
        </div>
        <ScrollArea.Root className="flex-1 min-h-0">
          <ScrollArea.Viewport className="w-full h-full">
            <div className="p-2">{renderPartsList()}</div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      <Separator.Root className="bg-gray-300 data-[orientation=horizontal]:h-px" />

      {/* Part Details - 35% of height */}
      <div className="h-[35%] flex flex-col min-h-0 max-h-[35%] overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 border-b border-gray-300">
          <h4 className="font-medium text-sm">Part Details</h4>
        </div>
        <ScrollArea.Root className="flex-1 min-h-0">
          <ScrollArea.Viewport className="w-full h-full">
            {renderSelectedPartDetails()}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      <Separator.Root className="bg-gray-300 data-[orientation=horizontal]:h-px" />

      {/* Validation Section - 25% of height */}
      <div className="h-[25%] flex flex-col min-h-0 max-h-[25%] overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 border-b border-gray-300 flex items-center justify-between">
          <h4 className="font-medium text-sm">Validation</h4>
          <button
            onClick={handleValidate}
            disabled={!project || project.parts.length === 0 || isPlaying}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Validate
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Show printing status when active */}
          {isPlaying ? (
            renderPrintingStatus()
          ) : (
            <>
              {project?.validityReport ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {project.validityReport.success ? (
                      <CheckCircledIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CrossCircledIcon className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      project.validityReport.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {project.validityReport.success ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{project.validityReport.summary}</p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3" />
                    <span>{project.validityReport.validatedAt.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Click validate to check project integrity
                </div>
              )}
              {renderStartPrintButton()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}