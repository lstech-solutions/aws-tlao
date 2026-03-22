import { MailboxService } from '../../src/services/mailbox-service'
import { dynamoDBService } from '../../src/lib/dynamodb'
import { StalwartClient } from '../../src/services/stalwart-client'
import { Mailbox } from '../../src/types/mailbox'

jest.mock('node-fetch', () => jest.fn())
jest.mock('../../src/lib/dynamodb')
jest.mock('../../src/services/stalwart-client')

describe('MailboxService', () => {
  const mockDynamoDBService = dynamoDBService as jest.Mocked<typeof dynamoDBService>
  const MockedStalwartClient = StalwartClient as jest.MockedClass<typeof StalwartClient>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns mailbox login settings that match the live OVH Stalwart setup', async () => {
    const createPrincipal = jest.fn().mockResolvedValue({ id: 'principal-123' })
    MockedStalwartClient.mockImplementation(
      () =>
        ({
          createPrincipal,
        }) as unknown as StalwartClient
    )

    const mailbox: Mailbox = {
      workspaceId: 'workspace-1',
      mailboxId: 'mailbox-1',
      name: 'support',
      emailAddress: 'support@xn--tlo-fla.com',
      domain: 'xn--tlo-fla.com',
      createdAt: Date.now(),
      isActive: true,
      ingestionMode: 'operational',
    }

    const service = new MailboxService(
      'https://mail.xn--tlo-fla.com',
      'tlao-provisioner',
      'mail.xn--tlo-fla.com',
      'secret-value'
    )

    mockDynamoDBService.update.mockResolvedValue(undefined)

    const result = await service.provisionMailbox(mailbox)

    expect(createPrincipal).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'support@xn--tlo-fla.com',
        name: 'support@xn--tlo-fla.com',
      })
    )
    expect(mockDynamoDBService.update).toHaveBeenCalledWith(
      'tlao-email-mailboxes',
      { workspaceId: 'workspace-1', mailboxId: 'mailbox-1' },
      'SET stalwartPrincipalId = :principalId, stalwartPrincipalName = :principalName',
      {
        ':principalId': 'principal-123',
        ':principalName': 'support@xn--tlo-fla.com',
      }
    )
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        credentials: expect.objectContaining({
          emailAddress: 'support@xn--tlo-fla.com',
          username: 'support@xn--tlo-fla.com',
          imapPort: 993,
          imapSecurity: 'TLS',
          smtpPort: 587,
          smtpSecurity: 'STARTTLS',
        }),
      })
    )
  })

  it('deletes the Stalwart principal by stored principal id when available', async () => {
    const deletePrincipal = jest.fn().mockResolvedValue(undefined)
    MockedStalwartClient.mockImplementation(
      () =>
        ({
          deletePrincipal,
        }) as unknown as StalwartClient
    )

    const service = new MailboxService(
      'https://mail.xn--tlo-fla.com',
      'tlao-provisioner',
      'mail.xn--tlo-fla.com',
      'secret-value'
    )

    mockDynamoDBService.get.mockResolvedValue({
      workspaceId: 'workspace-1',
      mailboxId: 'mailbox-1',
      name: 'support',
      emailAddress: 'support@xn--tlo-fla.com',
      domain: 'xn--tlo-fla.com',
      createdAt: Date.now(),
      isActive: true,
      ingestionMode: 'operational',
      stalwartPrincipalId: '42',
    })
    mockDynamoDBService.update.mockResolvedValue(undefined)

    await service.deleteMailbox('workspace-1', 'mailbox-1')

    expect(deletePrincipal).toHaveBeenCalledWith('42')
  })
})
