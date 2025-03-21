import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  notCentered?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  notCentered,
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div
        className={`fixed inset-0 flex w-screen items-center justify-center p-4 ${
          notCentered ? 'items-start' : 'items-center'
        }`}
      >
        <DialogPanel
          className={`space-y-4 border bg-white rounded-lg ${className}`}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default Modal;
