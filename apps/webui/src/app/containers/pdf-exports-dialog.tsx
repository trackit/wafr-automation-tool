import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightFromLine,
  Download,
  FileTextIcon,
  Trash2,
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { type components } from '@shared/api-schema';
import {
  deletePDFExport,
  generatePDFExportURL,
  listPDFExports,
  startPDFExport,
} from '@webui/api-client';
import { Modal } from '@webui/ui';

function PDFExportStatus({
  status,
}: {
  status: components['schemas']['FileExport']['status'];
}) {
  switch (status) {
    case 'NOT_STARTED': {
      return (
        <div className="badge badge-warning badge-sm font-bold">
          Not Started
        </div>
      );
    }
    case 'IN_PROGRESS': {
      return (
        <div className="badge badge-primary badge-sm font-bold">
          In Progress
        </div>
      );
    }
    case 'ERRORED': {
      return (
        <div className="badge badge-error badge-sm font-bold">Errored</div>
      );
    }
    case 'COMPLETED': {
      return (
        <div className="badge badge-success badge-sm font-bold">Ready</div>
      );
    }
  }
}

function PDFExportsDialog({ assessmentId }: { assessmentId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: fileExports, isLoading: areFileExportsUnavailable } = useQuery({
    queryKey: ['assessments', assessmentId, 'exports', 'pdf'],
    queryFn: () => listPDFExports({ assessmentId }),
    enabled: open,
    refetchInterval: 15000,
  });

  const { mutate: startPDFExportMutation, isPending: isStartingPDFExport } =
    useMutation({
      mutationFn: () => {
        if (!fileExports) {
          throw new Error('File exports are unavailable');
        }

        // TODO: remove this when we will let the user input the version name
        const highestVersionName = fileExports.reduce<string | null>(
          (highestVersionName, fileExport) => {
            if (
              highestVersionName === null ||
              fileExport.versionName > highestVersionName
            ) {
              return fileExport.versionName;
            }
            return highestVersionName;
          },
          null,
        );
        const majorVersion = highestVersionName?.match(/(\d+)\.\d+/)?.[1];
        const versionName = majorVersion
          ? `${parseInt(majorVersion) + 1}.0`
          : '1.0';
        return startPDFExport({ assessmentId }, { versionName });
      },
      onMutate: () => {
        enqueueSnackbar({
          message: 'Starting PDF export...',
          variant: 'info',
        });
      },
      onError: (e: Error) => {
        enqueueSnackbar({
          message: 'Failed to start PDF export. Please contact support',
          variant: 'error',
        });
        console.error('Error starting PDF export:', e);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['assessments', assessmentId, 'exports', 'pdf'],
        });
        enqueueSnackbar({
          message: 'PDF export has been started successfully',
          variant: 'success',
        });
      },
    });
  const { mutate: downloadPDFExport } = useMutation({
    mutationFn: async (fileExportId: string) => {
      const response = await generatePDFExportURL({
        assessmentId,
        fileExportId,
      });
      const url = response.url;
      window.open(url, '_blank');
    },
    onMutate: () => {
      enqueueSnackbar({
        message: 'Downloading PDF export...',
        variant: 'info',
      });
    },
    onError: (e: Error) => {
      enqueueSnackbar({
        message: 'Failed to download PDF export. Please contact support',
        variant: 'error',
      });
      console.error('Error downloading PDF export', e);
    },
    onSuccess: () => {
      enqueueSnackbar({
        message: 'PDF export download has started',
        variant: 'success',
      });
    },
  });

  const { mutate: deletePDFExportMutation } = useMutation({
    mutationFn: async (fileExportId: string) => {
      await deletePDFExport({ assessmentId, fileExportId });
    },
    onMutate: () => {
      enqueueSnackbar({
        message: 'Deleting PDF export...',
        variant: 'info',
      });
    },
    onError: (e: Error) => {
      enqueueSnackbar({
        message: 'Failed to delete PDF export. Please contact support',
        variant: 'error',
      });
      console.error('Error deleting PDF export', e);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['assessments', assessmentId, 'exports', 'pdf'],
      });
      enqueueSnackbar({
        message: 'PDF export has been deleted successfully',
        variant: 'success',
      });
    },
  });

  return (
    <>
      <button
        className="flex flex-row gap-2 w-full text-left"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <FileTextIcon className="w-4 h-4" /> View PDF Exports
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col gap-4 px-6 py-4">
          <h2 className="text-2xl font-bold">PDF Exports</h2>
          <hr />
          <button
            className="btn btn-primary btn-sm text-sm w-fit self-end"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startPDFExportMutation();
            }}
            disabled={areFileExportsUnavailable || isStartingPDFExport}
          >
            <ArrowRightFromLine className="w-4 h-4" /> Start new PDF Export
          </button>
          <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fileExports?.map((fileExport) => (
                  <tr key={fileExport.id}>
                    <td>
                      <PDFExportStatus status={fileExport.status} />
                    </td>
                    <td>{fileExport.versionName}</td>
                    <td>
                      {new Date(fileExport.createdAt).toLocaleDateString()}
                    </td>
                    <td className="flex flex-row gap-1">
                      {fileExport.status === 'COMPLETED' && (
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            downloadPDFExport(fileExport.id);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-error btn-ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deletePDFExportMutation(fileExport.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default PDFExportsDialog;
