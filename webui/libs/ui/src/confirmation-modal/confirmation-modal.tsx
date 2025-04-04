import { Modal } from '../modal/modal';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
  onClose: () => void;
}

export function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
  open,
  onClose,
}: ConfirmationModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-2 prose max-w-none p-6">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="flex flex-row gap-8 justify-end">
          <button className="btn btn-outline flex-1 btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary flex-1 btn-sm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;
