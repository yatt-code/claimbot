"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => {
      const newToasts = [...prev, newToast];
      if (newToasts.length > TOAST_LIMIT) {
        return newToasts.slice(-TOAST_LIMIT);
      }
      return newToasts;
    });

    // Auto remove toast after duration
    const duration = toast.duration ?? TOAST_REMOVE_DELAY;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastRenderer />
    </ToastContext.Provider>
  );
}

function ToastRenderer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  return (
    <div
      className={cn(
        "relative w-80 rounded-lg border p-4 shadow-lg transition-all duration-300",
        "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800",
        {
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950": toast.variant === "destructive",
          "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950": toast.variant === "success",
          "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950": toast.variant === "warning",
        }
      )}
    >
      <div className="flex items-start space-x-2">
        <div className="flex-1">
          {toast.title && (
            <div className={cn(
              "text-sm font-semibold",
              {
                "text-red-900 dark:text-red-100": toast.variant === "destructive",
                "text-green-900 dark:text-green-100": toast.variant === "success",
                "text-yellow-900 dark:text-yellow-100": toast.variant === "warning",
                "text-gray-900 dark:text-gray-100": toast.variant === "default" || !toast.variant,
              }
            )}>
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className={cn(
              "text-sm mt-1",
              {
                "text-red-700 dark:text-red-200": toast.variant === "destructive",
                "text-green-700 dark:text-green-200": toast.variant === "success",
                "text-yellow-700 dark:text-yellow-200": toast.variant === "warning",
                "text-gray-600 dark:text-gray-300": toast.variant === "default" || !toast.variant,
              }
            )}>
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className={cn(
            "rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            {
              "text-red-500 hover:text-red-600": toast.variant === "destructive",
              "text-green-500 hover:text-green-600": toast.variant === "success",
              "text-yellow-500 hover:text-yellow-600": toast.variant === "warning",
              "text-gray-500 hover:text-gray-600": toast.variant === "default" || !toast.variant,
            }
          )}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {toast.action && (
        <div className="mt-3">
          {toast.action}
        </div>
      )}
    </div>
  );
}