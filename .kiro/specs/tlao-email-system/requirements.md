# Requirements Document

## Introduction

The TLÁO Email System is a standalone mail package and application that integrates Stalwart (an open-source Rust-based mail server) with TLÁO's operational intelligence capabilities. The system provides enterprise-grade email hosting with automated provisioning while extracting operational signals from incoming mail to drive TLÁO's execution engine. This enables email to function as both a communication platform and an operational data source for projects, outcomes, and artifacts.

## Glossary

- **Stalwart**: The open-source mail server substrate providing IMAP, JMAP, POP3, SMTP, CalDAV, CardDAV, and WebDAV protocols
- **Mail_Provisioner**: The service that automates mailbox creation, DNS configuration, and TLÁO registration
- **TLÁO_Mail_Ingestion**: The service that monitors mailboxes and converts emails into operational signals
- **Execution_Engine**: The TLÁO component that processes signals and creates execution runs
- **Principal**: A Stalwart user account with authentication credentials
- **Mailbox**: An email storage location associated with a principal
- **Alias**: An email address that forwards to one or more mailboxes
- **Workspace**: A TLÁO organizational unit that can own domains and mailboxes
- **Domain**: A DNS domain configured for mail delivery
- **Ingestion_Mode**: Classification determining how emails are processed (operational, opportunity, personal)
- **Signal**: A TLÁO operational event extracted from an email
- **Execution_Run**: A TLÁO workflow instance created from a signal
- **Outcome**: A TLÁO goal or deliverable that can be linked to emails
- **Artifact**: A TLÁO document or resource generated from email content
- **IMAP**: Internet Message Access Protocol for retrieving emails from a mail server
- **IMAPS**: IMAP with TLS encryption for secure email retrieval
- **SMTP**: Simple Mail Transfer Protocol for sending emails
- **SMTPS**: SMTP with TLS encryption for secure email sending
- **Autodiscover**: Microsoft protocol for automatic email client configuration
- **Autoconfig**: Mozilla protocol for automatic email client configuration
- **Email_Client**: A software application used to access email (e.g., Thunderbird, Outlook, Gmail, Apple Mail)

## Requirements

### Requirement 1: Stalwart Mail Server Infrastructure

**User Story:** As a system administrator, I want a fully functional mail server infrastructure, so that users can send and receive emails using standard protocols.

#### Acceptance Criteria

1. THE Stalwart SHALL support IMAP protocol for mail client access
2. THE Stalwart SHALL support JMAP protocol for modern mail client access
3. THE Stalwart SHALL support POP3 protocol for legacy mail client access
4. THE Stalwart SHALL support SMTP protocol for sending and receiving emails
5. THE Stalwart SHALL support CalDAV protocol for calendar synchronization
6. THE Stalwart SHALL support CardDAV protocol for contact synchronization
7. THE Stalwart SHALL support WebDAV protocol for file access
8. THE Stalwart SHALL provide a web-based administration interface
9. THE Stalwart SHALL provide a management API for automation
10. THE Stalwart SHALL store messages in an encrypted message store
11. THE Stalwart SHALL authenticate principals before granting access
12. THE Stalwart SHALL deliver incoming messages to the appropriate mailbox

### Requirement 2: AWS Infrastructure Deployment

**User Story:** As a system administrator, I want the mail system deployed on AWS infrastructure, so that it benefits from cloud scalability and reliability.

#### Acceptance Criteria

1. THE System SHALL deploy Stalwart on an EC2 instance
2. THE System SHALL use EBS volumes for mail storage
3. THE System SHALL use S3 buckets for backup storage
4. THE System SHALL use Route 53 for DNS management
5. WHERE outbound relay is enabled, THE System SHALL integrate with SES for SMTP relay
6. THE System SHALL use CloudWatch for monitoring and alerting
7. THE System SHALL assign an Elastic IP to the EC2 instance for stable reverse DNS
8. THE System SHALL encrypt EBS volumes at rest
9. THE System SHALL encrypt S3 backup data at rest

### Requirement 3: Domain and DNS Configuration

**User Story:** As a system administrator, I want automated DNS configuration, so that domains are properly configured for mail delivery.

#### Acceptance Criteria

1. WHEN a domain is provisioned, THE Mail_Provisioner SHALL create an MX record pointing to the Stalwart host
2. WHEN a domain is provisioned, THE Mail_Provisioner SHALL create an SPF record for sender authentication
3. WHEN a domain is provisioned, THE Mail_Provisioner SHALL create a DKIM record for message signing
4. WHEN a domain is provisioned, THE Mail_Provisioner SHALL create a DMARC record for policy enforcement
5. WHEN a domain is provisioned, THE Mail_Provisioner SHALL configure reverse DNS for the Elastic IP
6. THE Mail_Provisioner SHALL validate DNS propagation before marking provisioning complete

### Requirement 4: Mailbox Provisioning Service

**User Story:** As a workspace administrator, I want to provision mailboxes programmatically, so that I can automate user onboarding.

#### Acceptance Criteria

1. WHEN a provisioning request is received, THE Mail_Provisioner SHALL validate the domain and workspace parameters
2. WHEN a provisioning request is valid, THE Mail_Provisioner SHALL create a Stalwart principal with authentication credentials
3. WHEN a principal is created, THE Mail_Provisioner SHALL create the associated mailbox
4. WHERE aliases are specified, THE Mail_Provisioner SHALL create alias mappings to the mailbox
5. WHEN provisioning succeeds, THE Mail_Provisioner SHALL register the mailbox in TLÁO Mail with the specified ingestion mode
6. WHEN provisioning succeeds, THE Mail_Provisioner SHALL return credentials and setup information
7. IF provisioning fails, THEN THE Mail_Provisioner SHALL rollback partial changes and return an error description
8. THE Mail_Provisioner SHALL use the Stalwart management API with an API key for all automation

### Requirement 5: Security Controls

**User Story:** As a security officer, I want comprehensive security controls, so that the mail system is protected from unauthorized access and attacks.

#### Acceptance Criteria

1. THE System SHALL enforce TLS encryption for all SMTP connections
2. THE System SHALL enforce TLS encryption for all IMAP connections
3. THE System SHALL enforce TLS encryption for all JMAP connections
4. THE System SHALL block all network ports except those required for mail protocols and administration
5. THE System SHALL implement rate limiting to prevent brute force authentication attempts
6. THE System SHALL restrict web administration access to authorized IP ranges or VPN connections
7. THE System SHALL require strong authentication for administrative access
8. THE System SHALL log all authentication attempts
9. WHEN repeated failed authentication attempts occur, THE System SHALL temporarily block the source IP address
10. THE System SHALL send CloudWatch alerts for security events

### Requirement 6: JMAP Mail Ingestion

**User Story:** As a TLÁO user, I want emails automatically converted into operational signals, so that I can track work and outcomes through email.

#### Acceptance Criteria

1. THE TLÁO_Mail_Ingestion SHALL connect to Stalwart using JMAP protocol as the primary method
2. WHERE JMAP is unavailable, THE TLÁO_Mail_Ingestion SHALL fall back to IMAP protocol
3. WHEN a new email arrives in a monitored mailbox, THE TLÁO_Mail_Ingestion SHALL detect it within 60 seconds
4. WHEN an email is detected, THE TLÁO_Mail_Ingestion SHALL extract sender, recipients, subject, body, and attachments
5. WHEN an email is extracted, THE TLÁO_Mail_Ingestion SHALL classify it by ingestion mode
6. WHEN an email is classified, THE TLÁO_Mail_Ingestion SHALL normalize it into a signal structure
7. THE TLÁO_Mail_Ingestion SHALL preserve the original email message ID for traceability

### Requirement 7: Operational Email Classification

**User Story:** As a TLÁO user, I want operational emails automatically processed, so that support requests and alerts become actionable signals.

#### Acceptance Criteria

1. WHEN an email arrives at an operational mailbox (support@, ops@, alerts@), THE TLÁO_Mail_Ingestion SHALL create a signal with operational classification
2. WHEN an operational signal is created, THE TLÁO_Mail_Ingestion SHALL submit it to the Execution_Engine
3. WHEN the Execution_Engine receives an operational signal, THE Execution_Engine SHALL create an execution run
4. WHERE the email content references existing outcomes, THE TLÁO_Mail_Ingestion SHALL link the signal to those outcomes
5. WHERE the email content references existing projects, THE TLÁO_Mail_Ingestion SHALL link the signal to those projects
6. THE TLÁO_Mail_Ingestion SHALL generate suggested tasks based on email content
7. THE TLÁO_Mail_Ingestion SHALL generate suggested plans based on email content

### Requirement 8: Opportunity Email Classification

**User Story:** As a grants manager, I want opportunity emails routed for evaluation, so that grant and partnership opportunities are properly assessed.

#### Acceptance Criteria

1. WHEN an email arrives at an opportunity mailbox (grants@, partnerships@), THE TLÁO_Mail_Ingestion SHALL create a signal with opportunity classification
2. WHEN an opportunity signal is created, THE TLÁO_Mail_Ingestion SHALL route it to the Grant evaluation workflow
3. WHEN an opportunity signal is created, THE TLÁO_Mail_Ingestion SHALL route it to the Opportunity evaluation workflow
4. THE TLÁO_Mail_Ingestion SHALL extract opportunity metadata including deadlines, funding amounts, and requirements

### Requirement 9: Personal Email Classification

**User Story:** As a TLÁO user, I want control over personal email ingestion, so that my privacy is protected.

#### Acceptance Criteria

1. WHERE a mailbox has personal ingestion mode, THE TLÁO_Mail_Ingestion SHALL only process emails if the user has opted in
2. WHERE a user has not opted in, THE TLÁO_Mail_Ingestion SHALL not access the mailbox contents
3. WHERE a user has opted in, THE TLÁO_Mail_Ingestion SHALL apply privacy controls to limit data extraction
4. THE System SHALL allow users to revoke opt-in at any time

### Requirement 10: Outcome and Artifact Mapping

**User Story:** As a TLÁO user, I want emails linked to outcomes and artifacts, so that I can track communication related to my work.

#### Acceptance Criteria

1. WHEN a signal is processed, THE TLÁO_Mail_Ingestion SHALL analyze content for outcome references
2. WHEN outcome references are found, THE TLÁO_Mail_Ingestion SHALL create links between the email and the outcomes
3. WHEN a signal is processed, THE TLÁO_Mail_Ingestion SHALL analyze content for artifact generation opportunities
4. WHERE artifact generation is appropriate, THE TLÁO_Mail_Ingestion SHALL create artifact proposals
5. THE TLÁO_Mail_Ingestion SHALL store routing rules that map email patterns to outcomes

### Requirement 11: Backup and Recovery

**User Story:** As a system administrator, I want automated backups, so that mail data can be recovered after failures.

#### Acceptance Criteria

1. THE System SHALL backup mail storage to S3 daily
2. THE System SHALL retain backups for 90 days
3. THE System SHALL encrypt backup data before uploading to S3
4. THE System SHALL verify backup integrity after each backup operation
5. WHEN a backup fails, THE System SHALL send a CloudWatch alert
6. THE System SHALL provide a recovery procedure to restore from S3 backups

### Requirement 12: Monitoring and Alerting

**User Story:** As a system administrator, I want comprehensive monitoring, so that I can detect and respond to issues quickly.

#### Acceptance Criteria

1. THE System SHALL send CloudWatch metrics for mail delivery success rate
2. THE System SHALL send CloudWatch metrics for mail delivery latency
3. THE System SHALL send CloudWatch metrics for authentication failure rate
4. THE System SHALL send CloudWatch metrics for disk usage
5. THE System SHALL send CloudWatch metrics for CPU and memory utilization
6. WHEN disk usage exceeds 80 percent, THE System SHALL send a CloudWatch alert
7. WHEN authentication failure rate exceeds threshold, THE System SHALL send a CloudWatch alert
8. WHEN mail delivery failure rate exceeds threshold, THE System SHALL send a CloudWatch alert

### Requirement 13: Multi-Domain Support

**User Story:** As a workspace administrator, I want to host multiple domains, so that different teams can have separate email identities.

#### Acceptance Criteria

1. THE System SHALL support multiple domains within a single Stalwart instance
2. WHEN a domain is added, THE Mail_Provisioner SHALL configure DNS records for that domain
3. THE System SHALL isolate mailboxes by domain
4. THE System SHALL allow aliases to reference mailboxes within the same domain
5. THE System SHALL associate each domain with a workspace in TLÁO

### Requirement 14: Alias Management

**User Story:** As a workspace administrator, I want to create email aliases, so that multiple addresses can route to the same mailbox.

#### Acceptance Criteria

1. THE Mail_Provisioner SHALL create aliases that forward to one or more mailboxes
2. WHEN an email is sent to an alias, THE Stalwart SHALL deliver it to all configured target mailboxes
3. THE Mail_Provisioner SHALL allow aliases to be updated after creation
4. THE Mail_Provisioner SHALL allow aliases to be deleted
5. THE System SHALL validate that alias targets exist before creating the alias

### Requirement 15: Outbound Mail Relay

**User Story:** As a system administrator, I want optional SES relay for outbound mail, so that I can improve deliverability.

#### Acceptance Criteria

1. WHERE SES relay is enabled, THE Stalwart SHALL route outbound SMTP through SES
2. WHERE SES relay is disabled, THE Stalwart SHALL send outbound SMTP directly
3. THE System SHALL allow SES relay to be enabled or disabled per domain
4. WHEN SES relay is enabled, THE System SHALL configure SMTP credentials for SES authentication

### Requirement 16: Provisioning Status Tracking

**User Story:** As a workspace administrator, I want to track provisioning status, so that I know when mailboxes are ready to use.

#### Acceptance Criteria

1. WHEN provisioning begins, THE Mail_Provisioner SHALL create a provisioning status record
2. WHILE provisioning is in progress, THE Mail_Provisioner SHALL update the status record with current step
3. WHEN provisioning completes successfully, THE Mail_Provisioner SHALL mark the status as complete
4. IF provisioning fails, THEN THE Mail_Provisioner SHALL mark the status as failed with error details
5. THE Mail_Provisioner SHALL allow querying provisioning status by request ID

### Requirement 17: Configuration Parser and Validator

**User Story:** As a developer, I want to parse and validate configuration files, so that system configuration is correct before deployment.

#### Acceptance Criteria

1. WHEN a configuration file is provided, THE Configuration_Parser SHALL parse it into a Configuration object
2. IF the configuration file is invalid, THEN THE Configuration_Parser SHALL return a descriptive error with line and column information
3. THE Configuration_Validator SHALL validate that required fields are present
4. THE Configuration_Validator SHALL validate that field values are within acceptable ranges
5. THE Configuration_Pretty_Printer SHALL format Configuration objects into valid configuration files
6. FOR ALL valid Configuration objects, parsing then printing then parsing SHALL produce an equivalent Configuration object (round-trip property)

### Requirement 18: Standard Email Client Support

**User Story:** As a user, I want to configure my mailbox in standard email clients like Thunderbird, Gmail, Outlook, and Apple Mail, so that I can access my email using my preferred client.

#### Acceptance Criteria

1. THE Stalwart SHALL support IMAP protocol on port 143 with STARTTLS for email client access
2. THE Stalwart SHALL support IMAPS protocol on port 993 with TLS encryption for secure email client access
3. THE Stalwart SHALL support SMTP protocol on port 587 with STARTTLS for email client sending
4. THE Stalwart SHALL support SMTPS protocol on port 465 with TLS encryption for secure email client sending
5. THE Stalwart SHALL authenticate email clients using username and password credentials
6. WHEN a mailbox is provisioned, THE Mail_Provisioner SHALL return connection details including IMAP server hostname, IMAP port, SMTP server hostname, SMTP port, and security settings
7. THE System SHALL provide autodiscover configuration for Microsoft Outlook clients
8. THE System SHALL provide autoconfig configuration for Mozilla Thunderbird clients
9. WHEN an email client requests autodiscover configuration, THE System SHALL return XML configuration with IMAP and SMTP server details
10. WHEN an email client requests autoconfig configuration, THE System SHALL return XML configuration with IMAP and SMTP server details
11. THE System SHALL document connection settings for manual configuration in Gmail, Apple Mail, and other standard clients
12. THE Stalwart SHALL support standard IMAP operations including FETCH, STORE, SEARCH, and IDLE for email client compatibility
