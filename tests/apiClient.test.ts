import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { apiClient, BASE_URL } from '../src/services/apiClient.js';

type FetchCall = {
  url: string;
  init?: RequestInit;
};

const calls: FetchCall[] = [];

afterEach(() => {
  calls.length = 0;
  delete (globalThis as { fetch?: typeof fetch }).fetch;
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

function mockFetch(response: Response): void {
  globalThis.fetch = (async (url, init) => {
    calls.push({ url: String(url), init });
    return response;
  }) as typeof fetch;
}

test('unwraps successful API response envelopes', async () => {
  mockFetch(Response.json({ success: true, data: { id: 'device-1' }, message: '', code: 200 }));

  const result = await apiClient.get<{ id: string }>('/devices/device-1');

  assert.deepEqual(result, { id: 'device-1' });
  assert.equal(calls[0].url, `${BASE_URL}/devices/device-1`);
});

test('returns undefined for successful responses without a body', async () => {
  mockFetch(new Response(null, { status: 204 }));

  const result = await apiClient.delete<void>('/devices/device-1');

  assert.equal(result, undefined);
});



test('falls back to HTTP status when an error response is not JSON', async () => {
  mockFetch(new Response('Internal Server Error', { status: 500 }));

  await assert.rejects(() => apiClient.get('/devices'), /请求失败: 500/);
});

test('serializes JSON request bodies for documented API calls', async () => {
  mockFetch(Response.json({ access_token: 'token', token_type: 'bearer' }));

  await apiClient.post('/users/login', { username: 'admin', password: 'secret' });

  assert.equal((calls[0].init?.headers as Record<string, string>)['Content-Type'], 'application/json');
  assert.equal(calls[0].init?.body, JSON.stringify({ username: 'admin', password: 'secret' }));
});
