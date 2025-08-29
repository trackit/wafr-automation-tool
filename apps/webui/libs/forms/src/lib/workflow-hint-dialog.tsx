import { Info } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '@webui/ui';

export function WorkflowHintDialog() {
  const [showWorkflowHint, setShowWorkflowHint] = useState<boolean>(false);

  return (
    <>
      <Info
        className="w-4 h-4 text-base-content/50 cursor-pointer"
        onClick={() => setShowWorkflowHint(true)}
      />
      {showWorkflowHint && (
        <Modal
          open={true}
          onClose={() => setShowWorkflowHint(false)}
          className="w-auto max-w-6xl"
          notCentered={false}
          children={
            <div className="flex flex-col md:flex-row gap-2 p-6 gap-x-8">
              <div>
                <h1 className="text-2xl font-semibold mb-4 text-gray-800">
                  How the Workflow Filter Works
                </h1>
                <div>
                  <div className="mb-4">
                    <p className="text-gray-700 text-base mb-2">
                      The workflow is the name of the resources you want to
                      target. This name is used to identify these resources in
                      the output.
                    </p>
                    <p className="text-gray-700 text-base mb-2">
                      You can enter multiple workflows, separated by commas.
                    </p>
                    <p className="text-gray-700 text-base mb-2">
                      If no workflow is specified, no filtering is applied.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md shadow-sm border-l-4 border-blue-500 mb-4">
                    <p className="text-blue-600">
                      When one or more workflow names are provided, the system
                      automatically filters the scan findings by comparing each
                      finding to the specified workflows.
                      <br />
                      It checks if the finding's name, description, or resource
                      ARN contains any of the provided workflow names.
                    </p>
                  </div>
                </div>
              </div>
              <img
                src="/assets/workflow.png"
                className="max-w-72 mx-auto object-contain"
                alt="Workflow example diagram"
              />
            </div>
          }
        />
      )}
    </>
  );
}

export default WorkflowHintDialog;
