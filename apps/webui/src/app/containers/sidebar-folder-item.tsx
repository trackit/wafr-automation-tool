import { useDroppable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import {
  deleteFolder,
  type getOrganization,
  updateFolder,
} from '@webui/api-client';
import { ConfirmationModal, Modal } from '@webui/ui';

type OrganizationData = Awaited<ReturnType<typeof getOrganization>>;

interface SidebarFolderItemProps {
  name: string;
  assessmentCount: number;
  isActive: boolean;
  onClick: () => void;
  onFolderDeleted?: () => void;
  isMain?: boolean;
}

function SidebarFolderItem({
  name,
  assessmentCount,
  isActive,
  onClick,
  onFolderDeleted,
  isMain = false,
}: SidebarFolderItemProps) {
  const queryClient = useQueryClient();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState(name);

  const { isOver, setNodeRef } = useDroppable({
    id: isMain ? 'main-folder' : `folder-${name}`,
    data: {
      type: isMain ? 'uncategorized' : 'folder',
      folderName: isMain ? null : name,
    },
  });

  const renameMutation = useMutation({
    mutationFn: () => updateFolder({ folderName: name, name: newName }),
    onMutate: async () => {
      setShowRenameModal(false);

      await queryClient.cancelQueries({ queryKey: ['organization'] });

      const previousOrganization = queryClient.getQueryData<OrganizationData>([
        'organization',
      ]);

      if (previousOrganization) {
        const newFolders = (previousOrganization.folders ?? [])
          .map((f) => (f === name ? newName : f))
          .sort((a, b) => a.localeCompare(b));

        const newFolderCounts = { ...previousOrganization.folderCounts };
        if (newFolderCounts && name in newFolderCounts) {
          const count = newFolderCounts[name];
          delete newFolderCounts[name];
          newFolderCounts[newName] = count;
        }

        queryClient.setQueryData<OrganizationData>(['organization'], {
          ...previousOrganization,
          folders: newFolders,
          folderCounts: newFolderCounts,
        });
      }

      return { previousOrganization };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ['organization'],
          context.previousOrganization,
        );
      }
      enqueueSnackbar({
        message: 'Failed to rename folder',
        variant: 'error',
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
      await queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder({ folderName: name }),
    onMutate: async () => {
      setShowDeleteModal(false);

      await queryClient.cancelQueries({ queryKey: ['organization'] });

      const previousOrganization = queryClient.getQueryData<OrganizationData>([
        'organization',
      ]);

      if (previousOrganization) {
        const newFolders = (previousOrganization.folders ?? []).filter(
          (f) => f !== name,
        );

        const newFolderCounts = { ...previousOrganization.folderCounts };
        const deletedFolderCount = newFolderCounts?.[name] ?? 0;
        delete newFolderCounts[name];
        newFolderCounts[''] = (newFolderCounts[''] ?? 0) + deletedFolderCount;

        queryClient.setQueryData<OrganizationData>(['organization'], {
          ...previousOrganization,
          folders: newFolders,
          folderCounts: newFolderCounts,
        });
      }

      onFolderDeleted?.();

      return { previousOrganization };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ['organization'],
          context.previousOrganization,
        );
      }
      enqueueSnackbar({
        message: 'Failed to delete folder',
        variant: 'error',
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
      await queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`
          group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer
          transition-all duration-200 relative
          ${
            isActive
              ? 'bg-primary text-primary-content'
              : isOver
                ? 'bg-primary/20 border-2 border-primary border-dashed'
                : 'hover:bg-base-200'
          }
        `}
        onClick={onClick}
      >
        <div className="flex items-center min-w-0 flex-1">
          <span
            className={`truncate text-sm font-medium ${isActive ? 'text-primary-content' : 'text-base-content'}`}
          >
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full
              ${isActive ? 'bg-primary-content/20 text-primary-content' : 'bg-base-300 text-base-content/70'}
            `}
          >
            {assessmentCount}
          </span>
          {!isMain && (
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
                className={`btn btn-ghost btn-xs p-0.5 ${isActive ? 'text-primary-content hover:bg-primary-content/20' : ''}`}
              >
                <EllipsisVertical className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-50 w-40 p-2 shadow-lg"
              >
                <li>
                  <button
                    className="flex flex-row gap-2 w-full text-left text-base-content"
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
          )}
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

export default SidebarFolderItem;
