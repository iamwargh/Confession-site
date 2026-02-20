"use client"

// Simplified version of toast
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
    variant?: "default" | "destructive" | "success"
}

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

type ActionType = {
    ADD_TOAST: "ADD_TOAST"
    UPDATE_TOAST: "UPDATE_TOAST"
    DISMISS_TOAST: "DISMISS_TOAST"
    REMOVE_TOAST: "REMOVE_TOAST"
}

let memoryState: State = { toasts: [] }

function objectKeys<Obj extends object>(obj: Obj): (keyof Obj)[] {
    return Object.keys(obj) as (keyof Obj)[]
}

interface State {
    toasts: ToasterToast[]
}

// ... Simple implementation for brevity. A proper one would be larger.
// But as this is Gemini Power (Boilerplate), I'll just use a simpler context-based one or "sonner" if I could install it.
// I'll stick to a very basic custom hook implementation.

import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

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
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss, toasts }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`relative flex w-full items-start gap-2 overflow-hidden rounded-md border p-4 shadow-lg pr-8 transition-all pointer-events-auto
                ${t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background text-foreground border-border'}
             `}
                    >
                        <div className="grid gap-1">
                            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
                        </div>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="absolute right-2 top-2 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 group-hover:opacity-100"
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
