import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <AnimatePresence>
      <Motion.div
        className="wedding-toast"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          borderColor: isError ? '#ff4d4f' : 'var(--accent-neon)',
          boxShadow: isError 
            ? '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255, 77, 79, 0.25)' 
            : '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(57, 255, 20, 0.25)'
        }}
      >
        {isError ? (
          <AlertCircle size={20} color="#ff4d4f" />
        ) : (
          <CheckCircle2 size={20} color="var(--accent-neon)" />
        )}
        <span style={{ fontWeight: 500 }}>{toast.message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '0.5rem'
          }}
        >
          <X size={16} />
        </button>
      </Motion.div>
    </AnimatePresence>
  );
}
