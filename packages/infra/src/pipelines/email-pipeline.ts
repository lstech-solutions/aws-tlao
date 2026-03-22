import { createTlaoPipelines, type TlaoPipelineResult } from '../wrapper/infra-wrapper';
import { infraConfig } from '../config/infra.config';

const { email, region } = infraConfig;
const { pipeline } = email;

export function createEmailPipelines(): TlaoPipelineResult[] {
  const codestarConnectionArn = process.env.CODESTAR_CONNECTION_ARN;
  if (!codestarConnectionArn) {
    throw new Error('CODESTAR_CONNECTION_ARN is required to create pipelines');
  }

  const shared = {
    repo: pipeline.repo,
    region,
    permissionsMode: pipeline.permissionsMode,
    codestarConnectionArn,
    infraPath: email.infraPath,
    nodeVersion: email.nodeVersion,
    pnpmVersion: email.pnpmVersion,
    projectTag: email.namePrefix,
  };

  const { dev, staging, production } = pipeline.stages;

  return [
    ...createTlaoPipelines(`${email.namePrefix}`, { ...shared, computeType: dev.computeType, timeoutMinutes: dev.timeoutMinutes }, [
      { stage: 'dev', branch: dev.branch },
    ]),
    ...createTlaoPipelines(`${email.namePrefix}`, { ...shared, computeType: staging.computeType, timeoutMinutes: staging.timeoutMinutes }, [
      { stage: 'staging', branch: staging.branch },
    ]),
    ...createTlaoPipelines(
      `${email.namePrefix}`,
      {
        ...shared,
        computeType: production.computeType,
        timeoutMinutes: production.timeoutMinutes,
        buildEnv: {
          GITHUB_REPO: pipeline.repo,
          AWS_REGION: region,
          INFRA_CREATE_PIPELINES: 'false',
        },
      },
      [{ stage: 'production', branch: production.branch }],
    ),
  ];
}
