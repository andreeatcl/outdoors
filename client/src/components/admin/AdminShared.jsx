import { Search } from "lucide-react";

export const PAGE_SIZE = 10;

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-xl p-5 max-w-sm w-full shadow-lg">
        <p className="text-sm text-text-primary mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-lg text-text-muted hover:bg-background"
          >
            Anulează
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Șterge
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

export function Pagination({ page, totalPages, summary, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 text-sm text-text-muted">
      <span>
        Pagina {page} din {totalPages} ({summary})
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 rounded-lg border border-border disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 rounded-lg border border-border disabled:opacity-40"
        >
          Următor
        </button>
      </div>
    </div>
  );
}
