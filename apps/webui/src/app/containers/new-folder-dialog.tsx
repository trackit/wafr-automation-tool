import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { createFolder, type getOrganization } from '@webui/api-client';
import { Modal } from '@webui/ui';

type OrganizationData = Awaited<ReturnType<typeof getOrganization>>;

interface NewFolderDialogProps {
  compact?: boolean;
}

function NewFolderDialog({ compact = false }: NewFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (name: string) => {
      await createFolder({ name });
    },
    onMutate: async (name: string) => {
      setFolderName('');
      setOpen(false);

      await queryClient.cancelQueries({ queryKey: ['organization'] });

      const previousOrganization = queryClient.getQueryData<OrganizationData>([
        'organization',
      ]);

      if (previousOrganization) {
        const newFolders = [...(previousOrganization.folders ?? []), name].sort(
          (a, b) => a.localeCompare(b),
        );
        queryClient.setQueryData<OrganizationData>(['organization'], {
          ...previousOrganization,
          folders: newFolders,
          folderCounts: {
            ...previousOrganization.folderCounts,
            [name]: 0,
          },
        });
      }

      return { previousOrganization };
    },
    onError: (_err, _name, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ['organization'],
          context.previousOrganization,
        );
      }
      enqueueSnackbar({
        message: 'Failed to create folder',
        variant: 'error',
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      mutate(folderName.trim());
    }
  };

  return (
    <>
      {compact ? (
        <button
          className="btn btn-ghost btn-xs p-1"
          onClick={() => setOpen(true)}
          title="New Folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      ) : (
        <div className="not-prose w-full">
          <button
            className="btn btn-ghost btn-sm w-full justify-start gap-2 text-base-content/70 hover:text-base-content"
            onClick={() => setOpen(true)}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-xl font-bold">Create New Folder</h2>
          <hr />
          <div className="form-control">
            <label className="label">
              <span className="label-text">Folder Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter folder name"
              className="input input-bordered w-full"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          {error && (
            <div className="text-error text-sm">
              {error instanceof Error
                ? error.message
                : 'Failed to create folder'}
            </div>
          )}
          <div className="flex flex-row gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !folderName.trim()}
            >
              {isPending ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default NewFolderDialog;
