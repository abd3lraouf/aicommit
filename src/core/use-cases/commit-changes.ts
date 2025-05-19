/**
 * Use case for committing changes with the generated message
 */

import { GitRepository } from '../repositories/git-repository.js';

export class CommitChangesUseCase {
  constructor(
    private gitRepository: GitRepository
  ) {}

  /**
   * Commit changes with the provided message
   * @param commitMessage The commit message to use
   * @param dryRun If true, don't actually commit, just return the message
   */
  async execute(commitMessage: string, dryRun: boolean = false): Promise<boolean> {
    return await this.gitRepository.commitChanges(commitMessage, !dryRun);
  }
} 