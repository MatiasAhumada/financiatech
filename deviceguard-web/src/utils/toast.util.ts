import type { ReactNode } from "react";
import { toast, ExternalToast } from "sonner";

const defaultOptions: ExternalToast = {
  duration: 4000,
};

export const toastSuccess = (
  title: string | ReactNode,
  options?: ExternalToast
) => {
  toast.success(title, {
    ...defaultOptions,
    ...options,
  });
};

export const toastError = (
  title: string | ReactNode,
  options?: ExternalToast
) => {
  toast.error(title, {
    ...defaultOptions,
    ...options,
  });
};

export const toastWarning = (
  title: string | ReactNode,
  options?: ExternalToast
) => {
  toast.warning(title, {
    ...defaultOptions,
    ...options,
  });
};

export const toastInfo = (
  title: string | ReactNode,
  options?: ExternalToast
) => {
  toast.info(title, {
    ...defaultOptions,
    ...options,
  });
};

export const toastLoading = (
  title: string | ReactNode,
  options?: ExternalToast
) => {
  return toast.loading(title, {
    duration: Infinity,
    ...options,
  });
};
