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
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    error: <XCircle className="w-4 h-4 text-rose-600" />,
    info: <Bell className="w-4 h-4 text-indigo-600" />
  };

  const bars = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-indigo-500'
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-200/90 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl min-w-[280px] pointer-events-auto animate-[fadeInUp_0.25s_ease_both]"
          >
            <div className={`w-1 h-7 rounded-full ${bars[t.type]} flex-shrink-0`} />
            {icons[t.type]}
            <span className="text-xs sm:text-sm font-medium text-slate-800">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={hideConfirm} />
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeInScale_0.2s_ease_both]">
            <h3 className="text-sm font-bold text-slate-900">{confirm.title}</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{confirm.desc}</p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={hideConfirm}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm();
                  hideConfirm();
                }}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
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
