/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'tlao-email',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: { region: 'us-east-2' },
      },
    };
  },

  async run() {
    // Dynamic imports required by SST v3 — no top-level imports allowed
    const { infraConfig } = await import('./src/config/infra.config');
    const { createEmailPipelines } = await import('./src/pipelines/email-pipeline');

    const { region, email } = infraConfig;
    const { alarms } = email;
    const stage = $app.stage;

    // ─── Storage ─────────────────────────────────────────────────────────────

    const emailBucket = new sst.aws.Bucket('EmailStorage', {
      versioning: true,
      cors: false,
      transform: {
        bucket: {
          serverSideEncryptionConfiguration: {
            rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }],
          },
          lifecycleRules: [
            { prefix: 'raw/', enabled: true, expirations: [{ days: 90 }] },
            { prefix: 'backups/', enabled: true, expirations: [{ days: 365 }] },
          ],
        },
      },
    });

    // ─── DynamoDB Tables ──────────────────────────────────────────────────────

    const messagesTable = new sst.aws.Dynamo('EmailMessages', {
      fields: {
        workspaceId: 'string',
        messageId: 'string',
        receivedAt: 'number',
        mailbox: 'string',
        status: 'string',
      },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'messageId' },
      globalIndexes: {
        ReceivedAtIndex: { hashKey: 'workspaceId', rangeKey: 'receivedAt' },
        MailboxIndex: { hashKey: 'workspaceId', rangeKey: 'mailbox' },
        StatusIndex: { hashKey: 'workspaceId', rangeKey: 'status' },
      },
    });

    const mailboxesTable = new sst.aws.Dynamo('Mailboxes', {
      fields: {
        workspaceId: 'string',
        mailboxId: 'string',
        emailAddress: 'string',
        domain: 'string',
      },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'mailboxId' },
      globalIndexes: {
        EmailAddressIndex: { hashKey: 'emailAddress' },
        DomainIndex: { hashKey: 'domain' },
      },
    });

    const runsTable = new sst.aws.Dynamo('EmailRuns', {
      fields: {
        workspaceId: 'string',
        runId: 'string',
        createdAt: 'number',
        backendRunId: 'string',
      },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'runId' },
      globalIndexes: {
        SourceIndex: { hashKey: 'workspaceId', rangeKey: 'createdAt' },
        BackendRunIndex: { hashKey: 'backendRunId' },
      },
    });

    const artifactsTable = new sst.aws.Dynamo('EmailArtifacts', {
      fields: { runId: 'string', artifactId: 'string' },
      primaryIndex: { hashKey: 'runId', rangeKey: 'artifactId' },
    });

    const costTrackingTable = new sst.aws.Dynamo('CostTracking', {
      fields: { workspaceId: 'string', dateServiceOp: 'string' },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'dateServiceOp' },
      ttl: 'ttl',
    });

    const privacyTable = new sst.aws.Dynamo('PrivacyOptIn', {
      fields: { workspaceId: 'string', mailboxId: 'string' },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'mailboxId' },
    });

    const outcomeLinksTable = new sst.aws.Dynamo('OutcomeLinks', {
      fields: { workspaceId: 'string', messageId: 'string' },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'messageId' },
    });

    const artifactProposalsTable = new sst.aws.Dynamo('ArtifactProposals', {
      fields: {
        workspaceId: 'string',
        proposalId: 'string',
        messageId: 'string',
      },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'proposalId' },
      globalIndexes: {
        MessageIdIndex: { hashKey: 'messageId' },
      },
    });

    const routingRulesTable = new sst.aws.Dynamo('RoutingRules', {
      fields: { workspaceId: 'string', pattern: 'string' },
      primaryIndex: { hashKey: 'workspaceId', rangeKey: 'pattern' },
    });

    // ─── Email Parser Lambda ──────────────────────────────────────────────────

    const emailParserFn = new sst.aws.Function('EmailParser', {
      handler: '../../packages/email/src/lambdas/email-parser.handler',
      runtime: 'nodejs22.x',
      timeout: '5 minutes',
      memory: '512 MB',
      environment: {
        STAGE: stage,
        EMAIL_BUCKET: emailBucket.name,
        MESSAGES_TABLE: messagesTable.name,
        MAILBOXES_TABLE: mailboxesTable.name,
        RUNS_TABLE: runsTable.name,
        ARTIFACTS_TABLE: artifactsTable.name,
        COST_TRACKING_TABLE: costTrackingTable.name,
        PRIVACY_TABLE: privacyTable.name,
        OUTCOME_LINKS_TABLE: outcomeLinksTable.name,
        ARTIFACT_PROPOSALS_TABLE: artifactProposalsTable.name,
        ROUTING_RULES_TABLE: routingRulesTable.name,
      },
      permissions: [
        {
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [$interpolate`${emailBucket.arn}/*`],
        },
        {
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:Query',
            'dynamodb:Scan',
          ],
          resources: [
            messagesTable.arn,
            mailboxesTable.arn,
            runsTable.arn,
            artifactsTable.arn,
            costTrackingTable.arn,
            privacyTable.arn,
            outcomeLinksTable.arn,
            artifactProposalsTable.arn,
            routingRulesTable.arn,
          ],
        },
        { actions: ['bedrock:InvokeModel'], resources: ['*'] },
      ],
    });

    // S3 → Lambda trigger for inbound raw emails
    emailBucket.notify({
      notifications: [
        {
          name: 'EmailParserTrigger',
          function: emailParserFn.arn,
          filterPrefix: 'raw/',
          events: ['s3:ObjectCreated:*'],
        },
      ],
    });

    // ─── CloudWatch Alarms ────────────────────────────────────────────────────

    const ns = 'TLAO/Email';

    new aws.cloudwatch.MetricAlarm('AuthFailureAlarm', {
      alarmName: `tlao-email-${stage}-auth-failure-rate`,
      namespace: ns,
      metricName: 'AuthenticationFailureRate',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: alarms.authFailureThreshold,
      comparisonOperator: 'GreaterThanThreshold',
      treatMissingData: 'notBreaching',
    });

    new aws.cloudwatch.MetricAlarm('DeliveryFailureAlarm', {
      alarmName: `tlao-email-${stage}-delivery-failure-rate`,
      namespace: ns,
      metricName: 'MailDeliveryFailureRate',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: alarms.deliveryFailureThreshold,
      comparisonOperator: 'GreaterThanThreshold',
      treatMissingData: 'notBreaching',
    });

    new aws.cloudwatch.MetricAlarm('ProcessingErrorAlarm', {
      alarmName: `tlao-email-${stage}-processing-errors`,
      namespace: ns,
      metricName: 'ProcessingErrorRate',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: alarms.processingErrorThreshold,
      comparisonOperator: 'GreaterThanThreshold',
      treatMissingData: 'notBreaching',
    });

    new aws.cloudwatch.MetricAlarm('LambdaErrorAlarm', {
      alarmName: `tlao-email-${stage}-lambda-errors`,
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensions: { FunctionName: emailParserFn.name },
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 1,
      threshold: alarms.lambdaErrorThreshold,
      comparisonOperator: 'GreaterThanThreshold',
      treatMissingData: 'notBreaching',
    });

    new aws.cloudwatch.MetricAlarm('BedrockFailureAlarm', {
      alarmName: `tlao-email-${stage}-bedrock-failures`,
      namespace: ns,
      metricName: 'BedrockClassificationFailures',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 1,
      threshold: alarms.bedrockFailureThreshold,
      comparisonOperator: 'GreaterThanThreshold',
      treatMissingData: 'notBreaching',
    });

    // ─── Pipelines (explicit gate) ────────────────────────────────────────────

    if (process.env.INFRA_CREATE_PIPELINES === 'true') {
      createEmailPipelines();
    }

    // ─── Outputs ──────────────────────────────────────────────────────────────

    return {
      stage,
      region,
      emailBucket: emailBucket.name,
      emailParserFn: emailParserFn.name,
      messagesTable: messagesTable.name,
      mailboxesTable: mailboxesTable.name,
      runsTable: runsTable.name,
      artifactsTable: artifactsTable.name,
      costTrackingTable: costTrackingTable.name,
      privacyTable: privacyTable.name,
      outcomeLinksTable: outcomeLinksTable.name,
      artifactProposalsTable: artifactProposalsTable.name,
      routingRulesTable: routingRulesTable.name,
    };
  },
});
