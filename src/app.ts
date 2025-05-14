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
      
      // Show welcome message in verbose mode
      if (cliOptions.verbose) {
        this.cliPresenter.showProcess('Starting AICommit process...');
        this.cliPresenter.showStep(1, 3, 'Analyzing Git changes');
      }
      
      // Generate commit message
      let commitMessage = await this.generateCommitMessageUseCase.execute();
      
      // Show status in verbose mode
      if (cliOptions.verbose) {
        this.cliPresenter.showStep(2, 3, 'Generated commit message');
        this.cliPresenter.showCommitMessage(commitMessage, 'Generated commit message:');
      }
      
      // If in interactive mode, allow user to edit the message
      if (cliOptions.interactive) {
        if (cliOptions.verbose) {
          this.cliPresenter.showProcess('Opening editor for message editing...');
        }
        commitMessage = this.cliPresenter.editCommitMessage(commitMessage);
        
        if (cliOptions.verbose) {
          this.cliPresenter.showProcess('Message edited successfully');
          this.cliPresenter.showCommitMessage(commitMessage, 'Edited commit message:');
        }
      }
      
      // If in dry run mode, just display the message
      if (cliOptions.dryRun) {
        this.cliPresenter.showDryRunMessage(commitMessage);
        return 0;
      }
      
      // Commit changes
      if (cliOptions.verbose) {
        this.cliPresenter.showStep(3, 3, 'Committing changes');
      }
      
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