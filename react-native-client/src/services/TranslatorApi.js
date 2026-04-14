// src/services/TranslatorApi.js

const DEFAULT_BASE_URL = 'http://10.0.2.2:8080/darija-translator/api/translator';
// 10.0.2.2 = Android emulator loopback to host machine
// Use your actual server IP for physical devices, e.g. http://192.168.1.100:8080/...

let _config = {
  baseUrl: DEFAULT_BASE_URL,
  username: 'translator-user',
  password: '', // set via Settings screen
};

export function setConfig(config) {
  _config = { ..._config, ...config };
}

export function getConfig() {
  return { ..._config };
}

function authHeader() {
  const encoded = btoa(`${_config.username}:${_config.password}`);
  return `Basic ${encoded}`;
}

export async function healthCheck() {
  try {
    const response = await fetch(`${_config.baseUrl}/health`, {
      method: 'GET',
      headers: { Authorization: authHeader() },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function translateText(text, sourceLanguage = 'English') {
  const response = await fetch(`${_config.baseUrl}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({ text, sourceLanguage }),
  });

  if (response.status === 401) {
    return { success: false, errorMessage: 'Authentication failed. Check credentials.' };
  }

  const data = await response.json();
  return data;
}
