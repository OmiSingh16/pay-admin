"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from "react";

type Toast = {
  id: string;
  message: string;
  undoAction?: () => void;
  timer?: NodeJS.Timeout;
};

interface ToastContextType {
  toast: (message: string, undoAction?: () => void, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback((message: string, undoAction?: () => void, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Agar undo hai, toh server call ko delay karne ke liye hum log pagehide pe bhi flush karenge
    // (Isko hum pages mein implement karenge, yahan sirf UI dikhana hai)
    
    setToasts((prev) => [...prev, { id, message, undoAction }]);
    
    if (duration > 0) {
      timers.current[id] = setTimeout(() => {
        removeToast(id);
        // Agar timer complete ho gaya aur undo nahi dabaya, toh action execute karo
        if (undoAction) undoAction(); 
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const handleUndo = (t: Toast) => {
    removeToast(t.id);
    // Undo dabane pe action cancel ho jayega (logic page mein handle hoga)
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed left-1/2 bottom-[calc(18px+env(safe-area-inset-bottom))] -translate-x-1/2 grid gap-2 z-[90] w-[min(420px,92vw)] max-md:bottom-24">
        {toasts.map((t) => (
          <div key={t.id} className="bg-[var(--navy)] text-white rounded-[14px] py-3 pl-4 pr-3.5 flex justify-between items-center gap-3 font-semibold animate-[slideUp_0.22s_ease-out]">
            <span>{t.message}</span>
            {t.undoAction && (
              <button onClick={() => handleUndo(t)} className="text-[var(--saffron)] font-extrabold px-2 py-1">
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}