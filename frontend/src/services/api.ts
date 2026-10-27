import { APP_CONFIG } from '../config/appConfig';

export interface RequestOptions extends RequestInit {
  userId?: number;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { userId = 1, headers, ...rest } = options;
  const url = `${APP_CONFIG.apiBaseUrl}${endpoint}`;
  const method = options.method || 'GET';

  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'x-user-id': String(userId),
    ...headers,
  };

  // Log de petición para facilitar el debugging
  console.groupCollapsed(`%c[API Request] ${method} ${url}`, 'color: #2563eb; font-weight: bold;');
  console.log('Endpoint:', endpoint);
  console.log('Headers:', finalHeaders);
  if (rest.body) {
    try {
      console.log('Payload:', JSON.parse(rest.body as string));
    } catch {
      console.log('Body:', rest.body);
    }
  }
  console.groupEnd();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: finalHeaders,
      ...rest,
    });
  } catch (networkError: any) {
    console.error(`%c[API Network Failure] No se pudo contactar ${url}`, 'color: #dc2626; font-weight: bold;', networkError);
    throw new Error(
      'No se pudo conectar con el servidor backend (puerto 3001). Asegúrate de que el backend esté corriendo ejecutando: npm run dev:backend'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error || `Error HTTP ${response.status}: ${response.statusText}`;

    // Si el backend retornó errores detallados de validación Zod, formatearlos claramente
    if (errorData.details && typeof errorData.details === 'object') {
      const fieldErrors = Object.entries(errorData.details)
        .filter(([k]) => k !== '_errors')
        .map(([field, val]: any) => `${field}: ${val?._errors?.join(', ') || JSON.stringify(val)}`)
        .join('; ');

      if (fieldErrors) {
        errorMessage += ` [${fieldErrors}]`;
      }
    }

    console.group(`%c[API Error ${response.status}] ${method} ${url}`, 'color: #dc2626; font-weight: bold;');
    console.error('Mensaje:', errorMessage);
    console.error('Respuesta servidor:', errorData);
    console.groupEnd();

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as T;
  console.log(`%c[API Response 200] ${method} ${url}`, 'color: #16a34a; font-weight: bold;', data);
  return data;
}
