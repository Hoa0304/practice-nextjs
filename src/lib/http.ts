import envConfig from '@/config';
import { normalizePath } from '@/lib/utils';
import { LoginResType } from '@/schemaValidations/auth.schema';
import { redirect } from 'next/navigation';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

export class HttpError extends Error {
    status: number;
    payload: Record<string, unknown>;
    constructor({ status, payload }: { status: number; payload: Record<string, unknown> }) {
      super('Http Error');
      this.status = status;
      this.payload = payload;
    }
  }
  

export class EntityError extends HttpError {
  status: 422;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: 422;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<Response> = null;
export const isClient = () => typeof window !== 'undefined';

// Định nghĩa kiểu phản hồi API trả về
interface ApiResponse<T> {
  status: number;
  payload: T;
}

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
): Promise<ApiResponse<T>> => {
  let body: BodyInit | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }

  const baseHeaders: { [key: string]: string } = body instanceof FormData ? {} : { 'Content-Type': 'application/json' };

  if (isClient()) {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      baseHeaders.Authorization = `Bearer ${sessionToken}`;
    }
  }

  const baseUrl =
    options?.baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl;

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options?.headers || {}),
    },
    body,
    method,
  });

  const payload: T = await res.json();
  const data = {
    status: res.status,
    payload,
  };

  // Xử lý các lỗi từ server
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(data as { status: 422; payload: EntityErrorPayload });
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient()) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ force: true }),
            headers: { ...baseHeaders },
          });
          try {
            await clientLogoutRequest;
          } finally {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('sessionTokenExpiresAt');
            clientLogoutRequest = null;
            location.href = '/login';
          }
        }
      } else {
        const sessionToken = (options?.headers as Record<string, string>)?.Authorization.split('Bearer ')[1];
        redirect(`/logout?sessionToken=${sessionToken}`);
      }
    } else {
      throw new HttpError({ status: res.status, payload: data.payload ?? {} });
    }
  }

  // Lưu token vào localStorage nếu là client
  if (isClient()) {
    if (['auth/login', 'auth/register'].some((item) => item === normalizePath(url))) {
      const { token, expiresAt } = (payload as LoginResType).data;
      localStorage.setItem('sessionToken', token);
      localStorage.setItem('sessionTokenExpiresAt', expiresAt);
    } else if ('auth/logout' === normalizePath(url)) {
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('sessionTokenExpiresAt');
    }
  }

  return data;
};

const http = {
  get<T>(url: string, options?: Omit<CustomOptions, 'body'>): Promise<ApiResponse<T>> {
    return request<T>('GET', url, options);
  },

  post<T>(
    url: string,
    body: unknown,
    options?: Omit<CustomOptions, 'body'> | undefined
  ): Promise<ApiResponse<T>> {
    return request<T>('POST', url, { ...options, body: JSON.stringify(body) as BodyInit });
  },

  put<T>(
    url: string,
    body: unknown,
    options?: Omit<CustomOptions, 'body'> | undefined
  ): Promise<ApiResponse<T>> {
    return request<T>('PUT', url, { ...options, body: JSON.stringify(body) as BodyInit });
  },

  delete<T>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ): Promise<ApiResponse<T>> {
    return request<T>('DELETE', url, { ...options });
  },
};

export default http;
