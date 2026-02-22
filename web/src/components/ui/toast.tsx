"use client"

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * TOAST NOTIFICATION SYSTEM — AI-35 (Gemini Power)
 * Provides success / destructive / default toast variants.
 * Consumed via useToast() hook from anywhere inside ToastProvider.
 */

interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextType {
    toast: (props: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
    toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant }]);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    function getVariantStyles(variant: Toast['variant']) {
        switch (variant) {
            case 'destructive':
                return 'bg-red-950 text-red-100 border-red-800';
            case 'success':
                return 'bg-green-950 text-green-100 border-green-800';
            default:
                return 'bg-background text-foreground border-border';
        }
    }

    function getVariantIcon(variant: Toast['variant']) {
        switch (variant) {
            case 'destructive': return <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />;
            case 'success': return <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />;
            default: return <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
        }
    }

    return (
        <ToastContext.Provider value={{ toast, dismiss, toasts }}>
            {children}
            {/* Toast container — bottom-right */}
            <div
                aria-live="polite"
                aria-atomic="false"
                className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 md:max-w-[400px] pointer-events-none"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="alert"
                        className={`relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-xl pr-10 pointer-events-auto animate-in slide-in-from-bottom-2 duration-300 ${getVariantStyles(t.variant)}`}
                    >
                        {getVariantIcon(t.variant)}
                        <div className="grid gap-0.5 flex-1 min-w-0">
                            {t.title && <div className="text-sm font-semibold leading-snug">{t.title}</div>}
                            {t.description && <div className="text-xs opacity-80 leading-relaxed">{t.description}</div>}
                        </div>
                        <button
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss"
                            className="absolute right-2 top-2 rounded-md p-1 opacity-40 hover:opacity-100 transition-opacity focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
