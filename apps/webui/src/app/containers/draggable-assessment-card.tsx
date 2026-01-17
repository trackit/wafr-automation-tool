import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Computer,
  Earth,
  EllipsisVertical,
  Folder,
  GripVertical,
  LayoutDashboard,
  RefreshCw,
  Server,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { StatusBadge } from '@webui/ui';

import { formatACEOpportunity } from '../../lib/assessment-utils';

interface Assessment {
  id?: string;
  name?: string;
  roleArn?: string;
  createdAt?: string;
  regions?: string[];
  workflows?: string[] | string;
  opportunityId?: string;
  exportRegion?: string;
  wafrWorkloadArn?: string;
  folder?: string;
  error?: unknown;
  finishedAt?: string;
}

interface DraggableAssessmentCardProps {
  assessment: Assessment;
  status?: string;
  onClick: () => void;
  onRescan: () => void;
  onDelete: () => void;
  folders: string[];
  onMoveToFolder: (folder: string | null) => void;
  renderDialogs: () => ReactNode;
}

function DraggableAssessmentCard({
  assessment,
  status,
  onClick,
  onRescan,
  onDelete,
  folders,
  onMoveToFolder,
  renderDialogs,
}: DraggableAssessmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `assessment-${assessment.id}`,
      data: { type: 'assessment', assessment },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border border-neutral-content rounded-lg p-4
        hover:shadow-md hover:shadow-primary/20 hover:bg-primary/4
        transition-all duration-300
        cursor-pointer
        w-full max-w-[400px] h-full
        relative
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
      `}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 left-2 p-1 cursor-grab active:cursor-grabbing text-base-content/40 hover:text-base-content/70"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex flex-col gap-2 justify-between h-full w-full pl-5">
        <div className="flex flex-row justify-between items-start mb-2 gap-1">
          <div className="lg:text-lg md:text-base text-sm font-semibold text-primary">
            {assessment.name}
          </div>
          <div className="flex flex-row items-center gap-1 flex-1 flex-grow justify-end">
            {status ? (
              <StatusBadge status={status} className="badge-sm flex-shrink-0" />
            ) : (
              <span className="loading loading-dots loading-xs text-base-content"></span>
            )}
            <div
              className="dropdown dropdown-end"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs p-1"
              >
                <EllipsisVertical className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-50 w-60 p-2 shadow-sm"
              >
                <li>
                  <button
                    className="flex flex-row gap-2 text-primary w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRescan();
                    }}
                  >
                    <RefreshCw className="w-4 h-4" /> Rescan
                  </button>
                </li>
                <li className="m-1"></li>
                {renderDialogs()}
                {folders.length > 0 && (
                  <>
                    <li className="m-1"></li>
                    <li>
                      <details>
                        <summary className="flex flex-row gap-2 w-full">
                          <Folder className="w-4 h-4" />
                          Move to Folder
                        </summary>
                        <ul>
                          <li>
                            <button
                              className={`w-full text-left ${!assessment.folder ? 'font-semibold' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMoveToFolder(null);
                              }}
                            >
                              None
                            </button>
                          </li>
                          {folders.map((folder) => (
                            <li key={folder}>
                              <button
                                className={`w-full text-left ${assessment.folder === folder ? 'font-semibold' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onMoveToFolder(folder);
                                }}
                              >
                                {folder}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  </>
                )}
                <li className="m-1"></li>
                <li>
                  <button
                    className="flex flex-row gap-2 text-error w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-sm text-base-content flex flex-row gap-2 items-center">
            <Server className="w-4 h-4" />
            Account: {extractAccountId(assessment.roleArn)}
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center">
            <Calendar className="w-4 h-4" />
            Created:{' '}
            {assessment.createdAt
              ? new Date(assessment.createdAt).toLocaleDateString()
              : 'N/A'}
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center">
            <Earth className="w-4 h-4" />
            {assessment.regions?.join(', ') || 'Global'}
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center">
            <Computer className="w-4 h-4" />
            Workflow:
            {Array.isArray(assessment.workflows)
              ? assessment.workflows.length
                ? assessment.workflows.join(', ')
                : ' -'
              : assessment.workflows || ' -'}
          </div>
          <div className="text-sm text-base-content flex flex-row gap-2 items-center">
            <LayoutDashboard className="w-5 h-5" />
            ACE Opportunity: {formatACEOpportunity(assessment.opportunityId)}
          </div>
          {assessment.folder && (
            <div className="text-sm text-base-content flex flex-row gap-2 items-center">
              <Folder className="w-4 h-4" />
              Folder: {assessment.folder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DraggableAssessmentCard;
