/**
 * Main application class
 */

import { GenerateCommitMessageUseCase } from './core/use-cases/generate-commit-message';
import { CommitChangesUseCase } from './core/use-cases/commit-changes';
import { GitRepository } from './core/repositories/git-repository';
import { AIRepository } from './core/repositories/ai-repository';
import { GitRepositoryImpl } from './frameworks/git/git-repository-impl';
import { AmazonQRepositoryImpl } from './frameworks/amazon-q/amazon-q-repository-impl';
import { CliPresenter, CliOptions } from './frameworks/cli/cli-presenter';

export class App {
  private gitRepository: GitRepository;
  private aiRepository: AIRepository;
  private generateCommitMessageUseCase: GenerateCommitMessageUseCase;
  private commitChangesUseCase: CommitChangesUseCase;
  private cliPresenter: CliPresenter;

  constructor() {
    // Initialize repositories
    this.gitRepository = new GitRepositoryImpl();
    this.aiRepository = new AmazonQRepositoryImpl();
    
    // Initialize use cases
    this.generateCommitMessageUseCase = new GenerateCommitMessageUseCase(
      this.gitRepository,
      this.aiRepository
    );
    this.commitChangesUseCase = new CommitChangesUseCase(
      this.gitRepository
    );
    
    // Initialize presenter
    this.cliPresenter = new CliPresenter();
  }

  /**
   * Run the application with provided CLI options
   * @param options CLI options
   */
  async run(options?: CliOptions): Promise<number> {
    try {
      // If no options provided, parse from command line
      const cliOptions = options || this.cliPresenter.parseArguments();
      
      // Generate commit message
      let commitMessage = await this.generateCommitMessageUseCase.execute();
      
      // If in interactive mode, allow user to edit the message
      if (cliOptions.interactive) {
        commitMessage = this.cliPresenter.editCommitMessage(commitMessage);
      }
      
      // If in dry run mode, just display the message
      if (cliOptions.dryRun) {
        this.cliPresenter.showDryRunMessage(commitMessage);
        return 0;
      }
      
      // Commit changes
      const success = await this.commitChangesUseCase.execute(commitMessage, true);
      
      if (success) {
        this.cliPresenter.showSuccess('Successfully committed!');
        return 0;
      } else {
        this.cliPresenter.showError('Failed to commit changes.');
        return 1;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.cliPresenter.showError(`Error: ${errorMessage}`);
      return 1;
    }
  }
} 