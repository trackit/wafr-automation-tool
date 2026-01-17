import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';

import { createFolder } from '@webui/api-client';
import { Modal } from '@webui/ui';

function NewFolderDialog() {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (name: string) => {
      await createFolder({ name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organization'],
        refetchType: 'all',
      });
      setFolderName('');
      setOpen(false);
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
      <div className="not-prose">
        <button
          className="btn btn-secondary btn-sm border-none rounded-lg font-semibold min-w-[140px]"
          onClick={() => setOpen(true)}
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
      </div>
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
              {error instanceof Error ? error.message : 'Failed to create folder'}
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
