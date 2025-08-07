'use client';

import { useProjectStore } from '../store/useProjectStore';
import { useViewerStore } from '../store/useViewerStore';
import * as Accordion from '@radix-ui/react-accordion';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { ChevronDownIcon, CheckCircledIcon, CrossCircledIcon, ClockIcon } from '@radix-ui/react-icons';

export default function ProjectStateViewer() {
  const project = useProjectStore(state => state.project);
  const setValidityReport = useProjectStore(state => state.setValidityReport);
  const selectedPartId = useViewerStore(state => state.selectedPartId);
  const selectPart = useViewerStore(state => state.selectPart);
  
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
          <div className="flex-1">
            <div className="text-sm font-mono">
              {part.name || `Part ${index + 1}`}
            </div>
            <div className="text-xs text-gray-500">
              ID: {part.id.substring(0, 8)}...
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            {part.geometry && <span className="text-green-600">G</span>}
            {part.material && <span className="text-blue-600">M</span>}
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

    return (
      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-sm text-gray-800 mb-1">
            {selectedPart.name}
          </h4>
          <p className="text-xs text-gray-500">ID: {selectedPart.id}</p>
        </div>

        <Accordion.Root type="multiple" defaultValue={['transform']}>
          <Accordion.Item value="transform" className="border-b border-gray-200">
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between py-3 text-left">
                <span className="text-sm font-medium text-gray-700">Transform</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="pb-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase mb-1 block">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, i) => (
                      <div key={axis} className="space-y-1">
                        <label className="text-xs text-gray-600">{axis}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedPart.matrix.elements[12 + i].toFixed(3)}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-gray-300 select-none">
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
      <div className="h-[40%] flex flex-col min-h-0">
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
      <div className="h-[35%] flex flex-col min-h-0">
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
      <div className="h-[25%] flex flex-col min-h-0">
        <div className="px-4 py-2 bg-blue-50 border-b border-gray-300 flex items-center justify-between">
          <h4 className="font-medium text-sm">Validation</h4>
          <button
            onClick={handleValidate}
            disabled={!project || project.parts.length === 0}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Validate
          </button>
        </div>
        <div className="flex-1 p-4">
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
        </div>
      </div>
    </div>
  );
}