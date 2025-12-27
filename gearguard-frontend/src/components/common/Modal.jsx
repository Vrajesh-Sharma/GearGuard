export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-gray-500 hover:text-gray-900" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
