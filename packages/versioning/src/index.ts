/**
 * Versioning utilities for AI Agent Platform
 * Browser-compatible version
 */

import * as semver from 'semver';

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  buildMetadata?: string;
  gitCommit?: string;
  buildDate: string;
  environment: string;
}

export interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

/**
 * Version manager class
 */
export class VersionManager {
  private packageJson: PackageJson;

  constructor(packageJson?: PackageJson) {
    this.packageJson = packageJson || { name: 'ai-agent-platform', version: '1.1.1' };
  }

  /**
   * Get current version information
   */
  getVersionInfo(): VersionInfo {
    const version = this.packageJson.version;
    const parsed = semver.parse(version);
    
    if (!parsed) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      version,
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      prerelease: parsed.prerelease.length > 0 ? parsed.prerelease.join('.') : undefined,
      buildMetadata: parsed.build.length > 0 ? parsed.build.join('.') : undefined,
      gitCommit: this.getGitCommit(),
      buildDate: new Date().toISOString(),
      environment: 'browser',
    };
  }

  /**
   * Get version string
   */
  getVersion(): string {
    return this.packageJson.version;
  }

  /**
   * Get formatted version string
   */
  getFormattedVersion(): string {
    const info = this.getVersionInfo();
    let formatted = `v${info.version}`;
    
    if (info.gitCommit) {
      formatted += ` (${info.gitCommit.substring(0, 7)})`;
    }
    
    return formatted;
  }

  /**
   * Get detailed version string
   */
  getDetailedVersion(): string {
    const info = this.getVersionInfo();
    const parts = [`v${info.version}`];
    
    if (info.gitCommit) {
      parts.push(`commit: ${info.gitCommit.substring(0, 7)}`);
    }
    
    parts.push(`built: ${new Date(info.buildDate).toLocaleDateString()}`);
    parts.push(`env: ${info.environment}`);
    
    return parts.join(' • ');
  }

  /**
   * Check if version is prerelease
   */
  isPrerelease(): boolean {
    return semver.prerelease(this.packageJson.version) !== null;
  }

  /**
   * Compare with another version
   */
  compare(otherVersion: string): number {
    return semver.compare(this.packageJson.version, otherVersion);
  }

  /**
   * Check if current version satisfies a range
   */
  satisfies(range: string): boolean {
    return semver.satisfies(this.packageJson.version, range);
  }

  /**
   * Increment version
   */
  increment(release: 'major' | 'minor' | 'patch' | 'prerelease'): string {
    const newVersion = semver.inc(this.packageJson.version, release);
    if (!newVersion) {
      throw new Error(`Failed to increment version: ${this.packageJson.version}`);
    }
    return newVersion;
  }

  /**
   * Get git commit hash
   */
  private getGitCommit(): string | undefined {
    try {
      // Try to get from environment variable first (CI/CD)
      if (process.env.VERCEL_GIT_COMMIT_SHA) {
        return process.env.VERCEL_GIT_COMMIT_SHA;
      }
      
      if (process.env.GITHUB_SHA) {
        return process.env.GITHUB_SHA;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Create version manager instance
 */
export function createVersionManager(packageJson?: PackageJson): VersionManager {
  return new VersionManager(packageJson);
}

/**
 * Get version info for current package
 */
export function getVersionInfo(packageJson?: PackageJson): VersionInfo {
  const manager = new VersionManager(packageJson);
  return manager.getVersionInfo();
}

/**
 * Get formatted version string
 */
export function getVersion(packageJson?: PackageJson): string {
  const manager = new VersionManager(packageJson);
  return manager.getFormattedVersion();
}

/**
 * Get detailed version string
 */
export function getDetailedVersion(packageJson?: PackageJson): string {
  const manager = new VersionManager(packageJson);
  return manager.getDetailedVersion();
}

// Export default instance
export const versionManager = createVersionManager();