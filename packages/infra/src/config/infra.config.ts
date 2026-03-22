/**
 * Central IaC configuration for the TLAO project.
 * All infrastructure targets us-east-2 (Ohio).
 * Change region here and it propagates everywhere.
 */
export const infraConfig = {
  project: 'tlao',
  region: 'us-east-2',
  account: '058264267235',

  // ── Network ────────────────────────────────────────────────────────────────
  network: {
    vpcId: 'vpc-0c8348b71c4880311',
    subnets: {
      'us-east-2a': 'subnet-05a2fe9e998245315',
      'us-east-2b': 'subnet-0fcb636475542ac5a',
      'us-east-2c': 'subnet-068ac825323952795',
    },
  },

  // ── DNS ────────────────────────────────────────────────────────────────────
  dns: {
    // tláo.com (punycode)
    domain: 'xn--tlo-fla.com',
    hostedZoneId: 'Z032408613BA44LDYSF1T',
    mailSubdomain: 'mail.xn--tlo-fla.com',
  },

  // ── Stalwart EC2 mail server ───────────────────────────────────────────────
  stalwart: {
    instanceId: 'i-0618108ae8bfa24e5',
    elasticIp: '3.140.160.109',
    allocationId: 'eipalloc-06ffe47f6f22ccc2a',
    securityGroupId: 'sg-023b01a720c5beecf',
    keyName: 'tlao-email-ec2',
    instanceType: 't3.medium',
    amiId: 'ami-0b0b78dcacbab728f',
    iamRole: 'tlao-stalwart-ec2-role',
    iamInstanceProfile: 'tlao-stalwart-ec2-profile',
    dataDir: '/opt/stalwart',
    composeDir: '/opt/stalwart-compose',
    // SSM parameter paths
    ssm: {
      adminPassword: '/tlao/email/stalwart-admin-password',
    },
    // Ports exposed
    ports: {
      smtp: 25,
      smtpSubmission: 587,
      smtpsSubmission: 465,
      imaps: 993,
      manageSieve: 4190,
      https: 443,
      http: 80,
      ssh: 22,
    },
  },

  // ── Email package ──────────────────────────────────────────────────────────
  email: {
    namePrefix: 'tlao-email',
    infraPath: 'packages/infra',
    nodeVersion: '22',
    pnpmVersion: '9.15.0',

    // Deployed resource names (production stage)
    resources: {
      bucket: 'tlao-email-production-emailstoragebucket-sohwhubf',
      tables: {
        messages: 'tlao-email-production-EmailMessagesTable-oxzekazv',
        mailboxes: 'tlao-email-production-MailboxesTable-mczdzazv',
        runs: 'tlao-email-production-EmailRunsTable-sncdcedw',
        artifacts: 'tlao-email-production-EmailArtifactsTable-evbuauok',
        costTracking: 'tlao-email-production-CostTrackingTable-munkutvt',
        privacyOptIn: 'tlao-email-production-PrivacyOptInTable-bakthfka',
        outcomeLinks: 'tlao-email-production-OutcomeLinksTable-btakdsvu',
        artifactProposals: 'tlao-email-production-ArtifactProposalsTable-ucaachae',
        routingRules: 'tlao-email-production-RoutingRulesTable-fwdworza',
      },
    },

    pipeline: {
      repo: process.env.GITHUB_REPO ?? 'tlao-org/tlao',
      permissionsMode: 'least-privilege' as const,
      stages: {
        dev: { branch: 'main', computeType: 'BUILD_GENERAL1_MEDIUM' as const, timeoutMinutes: 30 },
        staging: { branch: 'staging', computeType: 'BUILD_GENERAL1_MEDIUM' as const, timeoutMinutes: 30 },
        production: { branch: 'production', computeType: 'BUILD_GENERAL1_LARGE' as const, timeoutMinutes: 60 },
      },
    },

    alarms: {
      authFailureThreshold: 0.1,
      deliveryFailureThreshold: 0.05,
      processingErrorThreshold: 0.1,
      lambdaErrorThreshold: 5,
      bedrockFailureThreshold: 10,
    },
  },
} as const;
