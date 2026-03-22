# TLÁO Mailbox Access

This deployment currently hosts the TLÁO domain in its DNS-safe punycode form: `xn--tlo-fla.com`. For transport, DNS, and client setup, use `admin@xn--tlo-fla.com` and `mail.xn--tlo-fla.com`.

The human-readable form is `admin@tláo.com`. This deployment rewrites inbound SMTP recipients on `@tláo.com` to the local punycode domain `@xn--tlo-fla.com` for delivery. The safe default is still to configure the account and publish transport settings with the punycode form.

## Primary Admin Mailbox

- Display address: `admin@tláo.com`
- Transport-safe address: `admin@xn--tlo-fla.com`
- IMAP/SMTP login username: `admin@xn--tlo-fla.com`
- Incoming mail server: `mail.xn--tlo-fla.com`
- Outgoing mail server: `mail.xn--tlo-fla.com`

The live hosted mailboxes now authenticate by full email address. That includes the TLÁO domain mailboxes and the currently hosted `cig.technology` mailboxes.

## Standard Client Settings

- IMAP server: `mail.xn--tlo-fla.com`
- IMAP port: `993`
- IMAP security: `SSL/TLS`
- IMAP auth: normal password
- SMTP server: `mail.xn--tlo-fla.com`
- SMTP port: `587`
- SMTP security: `STARTTLS`
- SMTP auth: normal password
- SMTP username: same mailbox login, for example `admin@xn--tlo-fla.com`

Port `465` with implicit TLS also works for SMTP submission, but `587` with STARTTLS is the preferred default for desktop and mobile clients.

## Webmail

The OVH bundle now supports a fallback SnappyMail webmail UI.

- Webmail URL: `https://webmail.xn--tlo-fla.com`
- SnappyMail admin URL: `https://webmail.xn--tlo-fla.com/?admin`
- SnappyMail bootstrap admin password file: `/opt/tlao-mail/snappymail/_data_/_default_/admin_password.txt`
- The branded fallback theme source is [`packages/email-ui/snappymail/image`](/home/ed/Documents/LSTS/aws/packages/email-ui/snappymail/image), and it currently patches SnappyMail's pinned `Default` theme at image-build time so the live UI actually serves the TLÁO styling.

SnappyMail uses full email address logins in this deployment. The live hosted mailboxes were migrated to that format so the same login contract works across multiple domains.

## Thunderbird

Mozilla Thunderbird supports manual IMAP account setup directly.

This deployment also serves Thunderbird autoconfig from `https://autoconfig.xn--tlo-fla.com/mail/config-v1.1.xml`, so automatic detection should work once DNS and Caddy are live.

1. Open Thunderbird and choose `Account Settings` or `Set up an existing email account`.
2. Enter:
   - Your name: `TLÁO Admin`
   - Email address: `admin@xn--tlo-fla.com`
   - Password: the mailbox password issued for `admin`
3. Choose `Configure manually`.
4. Set the incoming server:
   - Protocol: `IMAP`
   - Hostname: `mail.xn--tlo-fla.com`
   - Port: `993`
   - Connection security: `SSL/TLS`
   - Authentication method: `Normal password`
   - Username: `admin@xn--tlo-fla.com`
5. Set the outgoing server:
   - Hostname: `mail.xn--tlo-fla.com`
   - Port: `587`
   - Connection security: `STARTTLS`
   - Authentication method: `Normal password`
   - Username: `admin@xn--tlo-fla.com`
6. Save the account and send a test message to `admin@xn--tlo-fla.com`.

## Gmail App

The Gmail mobile app supports adding external IMAP accounts manually. Use the Gmail app on Android or iPhone/iPad, not Gmail on the web, if you want Gmail to act as the IMAP client for this mailbox.

### Android

1. Open the Gmail app.
2. Tap your profile picture.
3. Tap `Add another account`.
4. Tap `Other`.
5. Enter `admin@xn--tlo-fla.com`.
6. Select `Personal (IMAP)`.
7. Enter the mailbox password.
8. For incoming mail, enter:
   - Server: `mail.xn--tlo-fla.com`
   - Port: `993`
   - Security type: `SSL/TLS`
   - Username: `admin@xn--tlo-fla.com`
9. For outgoing mail, enter:
   - SMTP server: `mail.xn--tlo-fla.com`
   - Port: `587`
   - Security type: `STARTTLS`
   - Require sign-in: `Yes`
   - Username: `admin@xn--tlo-fla.com`
   - Password: same mailbox password

### iPhone and iPad

1. Open the Gmail app.
2. Tap your profile picture.
3. Tap `Add another account`.
4. Tap `Other (IMAP)`.
5. Enter `admin@xn--tlo-fla.com`.
6. Enter the same IMAP and SMTP settings listed above.

## Gmail Web Caveat

Gmail on the web is not the right client for this mailbox if you need direct IMAP access. Google’s current official client guidance is for the Gmail mobile app when adding non-Gmail IMAP accounts. If you need desktop access, use Thunderbird, Apple Mail, Outlook, or another full IMAP client.

## Troubleshooting

- If an external sender still gets `550 5.1.2 Relay not allowed` for `admin@tláo.com`, retry after the server config reload completes or use `admin@xn--tlo-fla.com` as the transport-safe fallback.
- If login fails, verify the username is the full mailbox address, for example `admin@xn--tlo-fla.com`.
- If the client warns about the certificate, confirm the server name is exactly `mail.xn--tlo-fla.com`.
- If sending fails, verify the client is using SMTP `587` with `STARTTLS` and authentication enabled.
- If receiving fails, verify the client is using IMAP `993` with `SSL/TLS`.

## References

- Stalwart individual principals: <https://stalw.art/docs/auth/principals/individual/>
- Thunderbird account configuration: <https://support.mozilla.org/en-US/kb/configuration-options-accounts>
- Gmail app on Android: <https://support.google.com/mail/answer/6078445?co=GENIE.Platform%3DAndroid&hl=en>
- Gmail app on iPhone and iPad: <https://support.google.com/mail/answer/6078445?co=GENIE.Platform%3DiOS&hl=en>
