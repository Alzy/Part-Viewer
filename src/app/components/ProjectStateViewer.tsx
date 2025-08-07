'use client';

import { useProjectStore } from '../store/useProjectStore';

export default function ProjectStateViewer() {
  const project = useProjectStore(state => state.project);
  
  return (
    <div className="w-80 bg-white border-l border-gray-300 p-4 shadow-lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {project?.name || 'Loading...'}
          </h3>
          <p className="text-sm text-gray-600">
            Parts: {project?.parts?.length || 0}
          </p>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-700">Validity Status</h4>
          <p className="text-sm text-gray-500">
            {project?.validityReport
              ? `${project.validityReport.success ? 'Valid' : 'Invalid'} - ${project.validityReport.summary}`
              : 'Not validated'
            }
          </p>
        </div>
      </div>
    </div>
  );
}