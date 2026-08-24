import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Hapus', isLoading, onConfirm, onClose }: ConfirmDialogProps) {
  return <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"><p className="text-sm text-slate-600">{message}</p><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button><Button variant="danger" onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button></div></Modal>;
}
