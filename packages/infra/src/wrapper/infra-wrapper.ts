import { createPipeline, type PipelineConfig } from '@lsts_tech/infra';

export type { PipelineConfig };

export interface TlaoPipelineOptions
  extends Pick<
    PipelineConfig,
    | 'repo'
    | 'region'
    | 'permissionsMode'
    | 'codestarConnectionArn'
    | 'infraPath'
    | 'nodeVersion'
    | 'pnpmVersion'
    | 'buildEnv'
    | 'computeType'
    | 'timeoutMinutes'
    | 'projectTag'
  > {}

export interface TlaoStageOptions {
  /** SST stage name (e.g. "dev", "production") */
  stage: string;
  /** Branch that triggers this stage */
  branch: string;
}

export type TlaoPipelineResult = ReturnType<typeof createPipeline>;

/**
 * Thin wrapper around @lsts_tech/infra createPipeline.
 * Creates one CodePipeline per stage (branch → stage mapping).
 */
export function createTlaoPipelines(
  namePrefix: string,
  options: TlaoPipelineOptions,
  stages: TlaoStageOptions[],
): TlaoPipelineResult[] {
  return stages.map((s) =>
    createPipeline({
      name: `${namePrefix}-${s.stage}`,
      repo: options.repo,
      branch: s.branch,
      stage: s.stage,
      region: options.region ?? 'us-east-1',
      permissionsMode: options.permissionsMode ?? 'least-privilege',
      codestarConnectionArn: options.codestarConnectionArn,
      infraPath: options.infraPath ?? 'packages/infra',
      nodeVersion: options.nodeVersion ?? '22',
      pnpmVersion: options.pnpmVersion ?? '9.15.0',
      buildEnv: options.buildEnv,
      computeType: options.computeType ?? 'BUILD_GENERAL1_MEDIUM',
      timeoutMinutes: options.timeoutMinutes ?? 30,
      projectTag: options.projectTag ?? namePrefix,
    }),
  );
}
