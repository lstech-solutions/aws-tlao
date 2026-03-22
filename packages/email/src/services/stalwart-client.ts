import fetch from 'node-fetch'

export interface CreatePrincipalParams {
  email: string
  name: string
  password: string
  description?: string
  roles?: string[]
}

export interface Principal {
  id: string
  email: string
  name: string
  password: string
  createdAt: number
}

export interface MailboxInfo {
  email: string
  quotaUsed: number
  quotaLimit: number
  messageCount: number
}

interface StalwartApiResponse<T> {
  data: T
}

export class StalwartClient {
  private baseUrl: string
  private apiCredential: string
  private apiSecret?: string

  constructor(baseUrl: string, apiCredential: string, apiSecret?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiCredential = apiCredential
    this.apiSecret = apiSecret
  }

  private buildAuthorizationHeader(): string {
    if (this.apiSecret !== undefined) {
      return `Basic ${Buffer.from(`${this.apiCredential}:${this.apiSecret}`).toString('base64')}`
    }

    const separatorIndex = this.apiCredential.indexOf(':')
    if (separatorIndex > 0) {
      return `Basic ${Buffer.from(this.apiCredential).toString('base64')}`
    }

    return `Bearer ${this.apiCredential}`
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${this.baseUrl}${path}`
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.buildAuthorizationHeader(),
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Stalwart API error: ${response.status} ${response.statusText} ${errorBody}`.trim()
      )
    }

    return response.json()
  }

  async createPrincipal(params: CreatePrincipalParams): Promise<Principal> {
    const result = (await this.request('POST', '/api/principal', {
      type: 'individual',
      name: params.name,
      description: params.description ?? `${params.email} mailbox`,
      emails: [params.email],
      secrets: [params.password],
      roles: params.roles ?? ['user'],
    })) as StalwartApiResponse<number>

    return {
      id: String(result.data),
      email: params.email,
      name: params.name,
      password: params.password,
      createdAt: Date.now(),
    }
  }

  async deletePrincipal(identifier: string): Promise<void> {
    await this.request('DELETE', `/api/principal/${encodeURIComponent(identifier)}`)
  }

  async createAlias(alias: string, target: string): Promise<void> {
    await this.request('POST', '/api/aliases', {
      alias,
      target,
    })
  }

  async deleteAlias(alias: string): Promise<void> {
    await this.request('DELETE', `/api/aliases/${encodeURIComponent(alias)}`)
  }

  async updateAlias(alias: string, targets: string[]): Promise<void> {
    await this.request('PUT', `/api/aliases/${encodeURIComponent(alias)}`, {
      targets,
    })
  }

  async getMailboxInfo(email: string): Promise<MailboxInfo> {
    const result = (await this.request(
      'GET',
      `/api/principal/${encodeURIComponent(email)}`
    )) as StalwartApiResponse<{
      emails?: string[]
      quota?: number
      usedQuota?: number
      usedQuotaMessages?: number
    }>

    return {
      email: result.data.emails?.[0] ?? email,
      quotaUsed: result.data.usedQuota || 0,
      quotaLimit: result.data.quota || 0,
      messageCount: result.data.usedQuotaMessages || 0,
    }
  }
}
