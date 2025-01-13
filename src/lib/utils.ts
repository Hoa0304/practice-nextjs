import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EntityError } from "./http";
import { toast } from "@/hooks/use-toast";
import { UseFormSetError } from "react-hook-form";

export type ApiError = {
  payload: {
    message: string;
  };
};

type ErrorApi = EntityError | ApiError;

interface FormData {
  username: string;
  password: string;
}

// Hàm kết hợp các lớp CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleErrorApi = ({
  error,
  setError,
  duration
}: {
  error: ErrorApi;
  setError?: UseFormSetError<FormData>;
  duration?: number;
}) => {
  if (error instanceof EntityError && setError) {
    // Duyệt qua các lỗi trả về từ EntityError
    error.payload.errors.forEach((item) => {
      setError(item.field as keyof FormData, {
        type: 'server',
        message: item.message
      });
    });
  } else {
    toast({
      title: 'Lỗi',
      description: error?.payload?.message ?? 'Lỗi không xác định',
      variant: 'destructive',
      duration: duration ?? 5000
    });
  }
}

// Hàm chuẩn hóa đường dẫn, loại bỏ dấu '/' nếu có
export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path;
}
