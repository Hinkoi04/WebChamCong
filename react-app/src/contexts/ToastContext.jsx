import React, { createContext, useContext, useState } from 'react';
import { Bell, CheckCircle2, XCircle } from 'lucide-react';


const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  const showConfirm = (title, desc, onConfirm) => {
    setConfirm({ title, desc, onConfirm });
  };

  const hideConfirm = () => {
    setConfirm(null);
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    info: <Bell className="w-4 h-4 text-blue-400" />
  };

  const bars = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    info: 'bg-blue-400'
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xl min-w-[260px] pointer-events-auto animate-[fadeInUp_0.25s_ease_both]"
          >
            <div className={`w-0.5 h-8 rounded-full ${bars[t.type]} flex-shrink-0`} />
            {icons[t.type]}
            <span className="text-sm text-zinc-100">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={hideConfirm} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl animate-[fadeInScale_0.2s_ease_both]">
            <h3 className="text-sm font-semibold text-zinc-100">{confirm.title}</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{confirm.desc}</p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={hideConfirm}
                className="flex-1 px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm();
                  hideConfirm();
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
