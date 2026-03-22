import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class EmailStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;

    // MailMessages Table
    new dynamodb.Table(this, 'MailMessagesTable', {
      tableName: 'tlao-email-messages',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'messageId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      globalSecondaryIndexes: [
        {
          indexName: 'ReceivedAtIndex',
          partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'receivedAt', type: dynamodb.AttributeType.NUMBER },
          projectionType: dynamodb.ProjectionType.ALL,
        },
        {
          indexName: 'MailboxIndex',
          partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'mailbox', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
        {
          indexName: 'StatusIndex',
          partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    // Mailboxes Table
    new dynamodb.Table(this, 'MailboxesTable', {
      tableName: 'tlao-email-mailboxes',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'mailboxId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      globalSecondaryIndexes: [
        {
          indexName: 'EmailAddressIndex',
          partitionKey: { name: 'emailAddress', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
        {
          indexName: 'DomainIndex',
          partitionKey: { name: 'domain', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    // EmailRuns Table
    new dynamodb.Table(this, 'EmailRunsTable', {
      tableName: 'tlao-email-runs',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'runId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      globalSecondaryIndexes: [
        {
          indexName: 'SourceIndex',
          partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
          projectionType: dynamodb.ProjectionType.ALL,
        },
        {
          indexName: 'BackendRunIndex',
          partitionKey: { name: 'backendRunId', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    // EmailArtifacts Table
    new dynamodb.Table(this, 'EmailArtifactsTable', {
      tableName: 'tlao-email-artifacts',
      partitionKey: { name: 'runId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'artifactId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Cost Tracking Table
    new dynamodb.Table(this, 'CostTrackingTable', {
      tableName: 'tlao-email-cost-tracking',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dateServiceOp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl',
    });

    // Privacy Opt-In Table
    new dynamodb.Table(this, 'PrivacyOptInTable', {
      tableName: 'tlao-email-privacy-optin',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'mailboxId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Outcome Links Table
    new dynamodb.Table(this, 'OutcomeLinksTable', {
      tableName: 'tlao-email-outcome-links',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'messageId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Artifact Proposals Table
    new dynamodb.Table(this, 'ArtifactProposalsTable', {
      tableName: 'tlao-email-artifact-proposals',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'proposalId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      globalSecondaryIndexes: [
        {
          indexName: 'MessageIdIndex',
          partitionKey: { name: 'messageId', type: dynamodb.AttributeType.STRING },
          projectionType: dynamodb.ProjectionType.ALL,
        },
      ],
    });

    // Routing Rules Table
    new dynamodb.Table(this, 'RoutingRulesTable', {
      tableName: 'tlao-email-routing-rules',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pattern', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Privacy Opt-In Table
    new dynamodb.Table(this, 'PrivacyOptInTable', {
      tableName: 'tlao-email-privacy-optin',
      partitionKey: { name: 'workspaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'mailboxId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 Bucket for Email Storage
    const emailBucket = new s3.Bucket(this, 'EmailBucket', {
      bucketName: `tlao-email-${accountId}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          prefix: 'raw/',
          expiration: cdk.Duration.days(90),
        },
        {
          prefix: 'backups/',
          expiration: cdk.Duration.days(365),
        },
      ],
    });

    // CloudWatch Alarms

    // Disk Usage Alarm (for Stalwart EC2 instance)
    new cloudwatch.Alarm(this, 'DiskUsageAlarm', {
      alarmName: 'tlao-email-disk-usage-high',
      alarmDescription: 'Alert when Stalwart EC2 disk usage exceeds 80%',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'DiskSpaceUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        threshold: 80,
      }),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Authentication Failure Rate Alarm
    new cloudwatch.Alarm(this, 'AuthFailureRateAlarm', {
      alarmName: 'tlao-email-auth-failure-rate-high',
      alarmDescription: 'Alert when authentication failure rate exceeds threshold',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'AuthenticationFailureRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        threshold: 0.1, // 10% failure rate
      }),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Mail Delivery Failure Rate Alarm
    new cloudwatch.Alarm(this, 'MailDeliveryFailureRateAlarm', {
      alarmName: 'tlao-email-delivery-failure-rate-high',
      alarmDescription: 'Alert when mail delivery failure rate exceeds threshold',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'MailDeliveryFailureRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        threshold: 0.05, // 5% failure rate
      }),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Email Processing Error Rate Alarm
    new cloudwatch.Alarm(this, 'EmailProcessingErrorRateAlarm', {
      alarmName: 'tlao-email-processing-error-rate-high',
      alarmDescription: 'Alert when email processing error rate exceeds threshold',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'ProcessingErrorRate',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        threshold: 0.1, // 10% error rate
      }),
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Lambda Invocation Error Alarm
    new cloudwatch.Alarm(this, 'LambdaInvocationErrorAlarm', {
      alarmName: 'tlao-email-lambda-errors',
      alarmDescription: 'Alert when Lambda invocation errors occur',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        threshold: 5,
      }),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Backend API Failure Alarm
    new cloudwatch.Alarm(this, 'BackendAPIFailureAlarm', {
      alarmName: 'tlao-email-backend-api-failures',
      alarmDescription: 'Alert when Backend API calls fail',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'BackendAPIFailures',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        threshold: 10,
      }),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // S3 Operation Failure Alarm
    new cloudwatch.Alarm(this, 'S3OperationFailureAlarm', {
      alarmName: 'tlao-email-s3-operation-failures',
      alarmDescription: 'Alert when S3 operations fail',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'S3OperationFailures',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        threshold: 5,
      }),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Bedrock Classification Failure Alarm
    new cloudwatch.Alarm(this, 'BedrockClassificationFailureAlarm', {
      alarmName: 'tlao-email-bedrock-classification-failures',
      alarmDescription: 'Alert when Bedrock classification fails',
      metric: new cloudwatch.Metric({
        namespace: 'TLAO/Email',
        metricName: 'BedrockClassificationFailures',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        threshold: 10,
      }),
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }
}

const app = new cdk.App();
new EmailStack(app, 'EmailStack');
