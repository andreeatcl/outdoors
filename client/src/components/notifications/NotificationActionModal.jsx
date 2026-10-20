import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function NotificationActionModal({ open, onClose, options }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-5 flex flex-col gap-2">
        {options.map((opt) => (
          <Button
            key={opt.label}
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={opt.onClick}
          >
            {opt.icon && <opt.icon size={16} />}
            {opt.label}
          </Button>
        ))}
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Anulează
        </Button>
      </div>
    </Modal>
  );
}
