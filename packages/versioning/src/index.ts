/**
 * Versioning utilities for AI Agent Platform
 */

import * as semver from 'semver';
import { readFileSync } from 'fs';
import { join } from 'path';

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
  private packagePath: string;
  private packageJson: PackageJson;

  constructor(packagePath?: string) {
    this.packagePath = packagePath || this.findPackageJson();
    this.packageJson = this.loadPackageJson();
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
      environment: process.env.NODE_ENV || 'development',
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
   * Find package.json file
   */
  private findPackageJson(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== '/') {
      const packagePath = join(currentDir, 'package.json');
      try {
        readFileSync(packagePath);
        return packagePath;
      } catch {
        currentDir = join(currentDir, '..');
      }
    }
    
    throw new Error('package.json not found');
  }

  /**
   * Load package.json
   */
  private loadPackageJson(): PackageJson {
    try {
      const content = readFileSync(this.packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error}`);
    }
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

      // Try to read from git
      const { execSync } = require('child_process');
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
      return commit;
    } catch {
      return undefined;
    }
  }
}

/**
 * Create version manager instance
 */
export function createVersionManager(packagePath?: string): VersionManager {
  return new VersionManager(packagePath);
}

/**
 * Get version info for current package
 */
export function getVersionInfo(packagePath?: string): VersionInfo {
  const manager = new VersionManager(packagePath);
  return manager.getVersionInfo();
}

/**
 * Get formatted version string
 */
export function getVersion(packagePath?: string): string {
  const manager = new VersionManager(packagePath);
  return manager.getFormattedVersion();
}

/**
 * Get detailed version string
 */
export function getDetailedVersion(packagePath?: string): string {
  const manager = new VersionManager(packagePath);
  return manager.getDetailedVersion();
}

// Export default instance
export const versionManager = createVersionManager();