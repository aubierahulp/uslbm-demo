import { dummyJsonAuthApi } from '@/features/auth/data/dummyjson-auth-api';

const fetchMock = jest.fn();
globalThis.fetch = fetchMock;

const response = (status: number, body: unknown = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

describe('dummyJsonAuthApi.login', () => {
  beforeEach(() => fetchMock.mockReset());

  it('posts the credentials and maps the response to a session', async () => {
    fetchMock.mockResolvedValue(
      response(200, {
        id: 1,
        username: 'emilys',
        email: 'emily@x.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        gender: 'female',
        image: 'https://x',
        accessToken: 'access',
        refreshToken: 'refresh',
      })
    );

    const session = await dummyJsonAuthApi.login('emilys', 'emilyspass');

    expect(fetchMock).toHaveBeenCalledWith('https://dummyjson.com/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ username: 'emilys', password: 'emilyspass' });
    expect(session).toEqual({
      user: { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@x.com' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('maps a 400 to invalid credentials', async () => {
    fetchMock.mockResolvedValue(response(400, { message: 'Invalid credentials' }));
    await expect(dummyJsonAuthApi.login('emilys', 'wrong')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('maps a server error to a network error', async () => {
    fetchMock.mockResolvedValue(response(503));
    await expect(dummyJsonAuthApi.login('emilys', 'pass')).rejects.toMatchObject({ code: 'network' });
  });

  it('maps a failed request to a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(dummyJsonAuthApi.login('emilys', 'pass')).rejects.toMatchObject({ code: 'network' });
  });
});
