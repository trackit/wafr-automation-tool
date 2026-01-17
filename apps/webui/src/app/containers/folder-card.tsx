import { useDroppable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EllipsisVertical,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { deleteFolder, updateFolder } from '@webui/api-client';
import { ConfirmationModal, Modal } from '@webui/ui';

interface FolderCardProps {
  name: string;
  assessmentCount: number;
  onClick: () => void;
  isOver?: boolean;
}

function FolderCard({ name, assessmentCount, onClick }: FolderCardProps) {
  const queryClient = useQueryClient();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState(name);

  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${name}`,
    data: { type: 'folder', folderName: name },
  });

  const renameMutation = useMutation({
    mutationFn: () => updateFolder({ folderName: name, name: newName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organization'],
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: ['assessments'],
        refetchType: 'all',
      });
      setShowRenameModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder({ folderName: name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organization'],
        refetchType: 'all',
      });
      await queryClient.invalidateQueries({
        queryKey: ['assessments'],
        refetchType: 'all',
      });
      setShowDeleteModal(false);
    },
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`
          border-2 border-dashed rounded-lg p-4
          hover:shadow-md hover:shadow-primary/20
          transition-all duration-300
          cursor-pointer
          w-full max-w-[400px] h-full
          flex flex-col items-center justify-center gap-3
          min-h-[160px]
          ${isOver ? 'border-primary bg-primary/10 scale-105' : 'border-neutral-content hover:border-primary/50 hover:bg-primary/4'}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-center">
          {isOver ? (
            <FolderOpen className="w-12 h-12 text-primary" />
          ) : (
            <Folder className="w-12 h-12 text-primary/70" />
          )}
        </div>
        <div className="text-center">
          <div className="font-semibold text-base-content">{name}</div>
          <div className="text-sm text-base-content/60">
            {assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div
          className="dropdown dropdown-end absolute top-2 right-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs p-1">
            <EllipsisVertical className="w-4 h-4" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-40 p-2 shadow-sm"
          >
            <li>
              <button
                className="flex flex-row gap-2 w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNewName(name);
                  setShowRenameModal(true);
                }}
              >
                <Pencil className="w-4 h-4" /> Rename
              </button>
            </li>
            <li>
              <button
                className="flex flex-row gap-2 text-error w-full text-left"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </li>
          </ul>
        </div>
      </div>

      {showRenameModal && (
        <Modal open={showRenameModal} onClose={() => setShowRenameModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rename Folder</h3>
            <input
              type="text"
              className="input input-bordered w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Folder name"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost"
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => renameMutation.mutate()}
                disabled={renameMutation.isPending || !newName.trim()}
              >
                {renameMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Folder"
          message={`Are you sure you want to delete "${name}"? Assessments in this folder will become uncategorized.`}
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </>
  );
}

export default FolderCard;
