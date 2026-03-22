import { MailboxService } from '../services/mailbox-service';

export class AutodiscoverHandler {
  private mailboxService: MailboxService;
  private stalwartHostname: string;

  constructor(mailboxService: MailboxService, stalwartHostname: string) {
    this.mailboxService = mailboxService;
    this.stalwartHostname = stalwartHostname;
  }

  async handleAutodiscover(body: string): Promise<string> {
    try {
      // Parse Autodiscover XML request
      const emailMatch = body.match(/<EMailAddress>([^<]+)<\/EMailAddress>/);
      if (!emailMatch) {
        return this.errorResponse('Invalid autodiscover request');
      }

      const emailAddress = emailMatch[1];
      const mailbox = await this.mailboxService.resolveMailbox(emailAddress);

      if (!mailbox) {
        return this.errorResponse('Mailbox not found');
      }

      // Generate Autodiscover XML response
      return `<?xml version="1.0" encoding="utf-8"?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Response xmlns="http://schemas.microsoft.com/exchange/autodiscover/outlook/responseschema/2006a">
    <Account>
      <AccountType>email</AccountType>
      <Action>settings</Action>
      <Protocol>
        <Type>IMAP</Type>
        <Server>${this.stalwartHostname}</Server>
        <Port>993</Port>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
        <LoginName>${emailAddress}</LoginName>
      </Protocol>
      <Protocol>
        <Type>SMTP</Type>
        <Server>${this.stalwartHostname}</Server>
        <Port>465</Port>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
        <LoginName>${emailAddress}</LoginName>
      </Protocol>
    </Account>
  </Response>
</Autodiscover>`;
    } catch (error) {
      console.error('Autodiscover error:', error);
      return this.errorResponse('Internal server error');
    }
  }

  async handleAutoconfig(emailAddress: string): Promise<string> {
    try {
      if (!emailAddress) {
        return this.errorResponse('Email address required');
      }

      const mailbox = await this.mailboxService.resolveMailbox(emailAddress);

      if (!mailbox) {
        return this.errorResponse('Mailbox not found');
      }

      const domain = emailAddress.split('@')[1];

      // Generate Autoconfig XML response
      return `<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="${domain}">
    <domain>${domain}</domain>
    <displayName>TLÁO Email</displayName>
    <displayShortName>TLÁO</displayShortName>
    <incomingServer type="imap">
      <hostname>${this.stalwartHostname}</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>${emailAddress}</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>${this.stalwartHostname}</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>${emailAddress}</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>`;
    } catch (error) {
      console.error('Autoconfig error:', error);
      return this.errorResponse('Internal server error');
    }
  }

  private errorResponse(message: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Response>
    <Error Time="${new Date().toISOString()}" Id="1">
      <ErrorCode>600</ErrorCode>
      <Message>${message}</Message>
    </Error>
  </Response>
</Autodiscover>`;
  }
}
