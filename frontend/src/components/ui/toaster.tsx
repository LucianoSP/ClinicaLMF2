"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction,
  type ToastActionElement,
} from "@/components/ui/toasts";
import { useToast } from "@/components/ui/toasts";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {/* Verifica se o action é válido e renderiza o ToastAction */}
          {action && (action as ToastActionElement).altText ? (
            <ToastAction altText={(action as ToastActionElement).altText}>
              {(action as ToastActionElement).action}
            </ToastAction>
          ) : null}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
