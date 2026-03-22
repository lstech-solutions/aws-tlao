import fetch from 'node-fetch'
import { StalwartClient } from '../../src/services/stalwart-client'

jest.mock('node-fetch', () => jest.fn())

describe('StalwartClient', () => {
  const mockFetch = fetch as unknown as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses Basic auth when username and secret are provided separately', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 3, emails: ['support@xn--tlo-fla.com'] } }),
    })

    const client = new StalwartClient(
      'https://mail.xn--tlo-fla.com',
      'tlao-provisioner',
      'secret-value'
    )

    await client.getMailboxInfo('support')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('tlao-provisioner:secret-value').toString('base64')}`
    )
  })

  it('uses Basic auth when legacy credentials are passed as username:secret', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 3, emails: ['support@xn--tlo-fla.com'] } }),
    })

    const client = new StalwartClient(
      'https://mail.xn--tlo-fla.com',
      'tlao-provisioner:secret-value'
    )

    await client.getMailboxInfo('support')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('tlao-provisioner:secret-value').toString('base64')}`
    )
  })

  it('creates principals through the current /api/principal endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 42 }),
    })

    const client = new StalwartClient(
      'https://mail.xn--tlo-fla.com',
      'tlao-provisioner',
      'secret-value'
    )

    const principal = await client.createPrincipal({
      email: 'support@xn--tlo-fla.com',
      name: 'support@xn--tlo-fla.com',
      password: 'secret-pass',
    })

    expect(principal.id).toBe('42')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mail.xn--tlo-fla.com/api/principal',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          type: 'individual',
          name: 'support@xn--tlo-fla.com',
          description: 'support@xn--tlo-fla.com mailbox',
          emails: ['support@xn--tlo-fla.com'],
          secrets: ['secret-pass'],
          roles: ['user'],
        }),
      })
    )
  })
})
