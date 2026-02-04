import { AxiosError } from "axios";
import { ExternalToast, toast } from "sonner";
import { ERROR_MESSAGES } from "@/constants/error-messages.constant";

interface ErrorHandlerOptions {
  logToConsole?: boolean;
  showToast?: boolean;
  messagePrefix?: string;
  defaultMessage?: string;
  toastOptions?: Partial<ExternalToast>;
}

function normalizeError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const isNetworkError = !error.response;
    return {
      name: "AxiosError",
      message: isNetworkError
        ? "Error de conexión"
        : error.response?.data?.error?.message || error.message,
      stack: error.response?.data?.error?.stack || error.stack,
    };
  }

  if (error && typeof error === "object" && !("message" in error)) {
    return new Error(ERROR_MESSAGES.FORM_VALIDATION);
  }

  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  if (error && typeof error === "object") {
    if ("message" in error && typeof (error as any).message === "string") {
      return new Error((error as any).message);
    }
    return new Error(JSON.stringify(error));
  }

  return new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
}

export default function clientErrorHandler(
  error: unknown,
  callback = () => {},
  {
    logToConsole = true,
    showToast = true,
    messagePrefix = "Error: ",
    defaultMessage = "Error desconocido",
    toastOptions = { duration: 4000 },
  }: ErrorHandlerOptions = {},
): void {
  const normalizedError = normalizeError(error);

  if (logToConsole) console.error(normalizedError);
  if (showToast) {
    const displayMessage = normalizedError.message || defaultMessage;
    toast.error(`${messagePrefix}${displayMessage}`, toastOptions);
  }

  callback();
}