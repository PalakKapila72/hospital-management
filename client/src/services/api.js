const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('hospital_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // If downloading a CSV file
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Token expired or invalid
        localStorage.removeItem('hospital_token');
        localStorage.removeItem('hospital_user');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'An error occurred while processing request.');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: 'GET' });
  },
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
