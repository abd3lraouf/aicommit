/**
 * Main application class
 */

import { GenerateCommitMessageUseCase } from './core/use-cases/generate-commit-message';
import { CommitChangesUseCase } from './core/use-cases/commit-changes';
import { GitRepository } from './core/repositories/git-repository';
import { AIRepository } from './core/repositories/ai-repository';
import { GitRepositoryImpl } from './frameworks/git/git-repository-impl';
import { DefaultAIRepositoryImpl } from './frameworks/default-ai/default-ai-repository-impl';
import { CliPresenter, CliOptions } from './frameworks/cli/cli-presenter';
import { setDebugMode } from './frameworks/cli/debug';
import { initializeConfig, getCliOptions } from './config';

export class App {
  private gitRepository: GitRepository | null = null;
  private aiRepository: AIRepository | null = null;
  private generateCommitMessageUseCase: GenerateCommitMessageUseCase | null = null;
  private commitChangesUseCase: CommitChangesUseCase | null = null;
  private cliPresenter: CliPresenter;

  constructor() {
    // Only initialize the presenter in the constructor
    // Repositories and use cases will be initialized after config is loaded
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
      
      // Initialize configuration with CLI options
      await initializeConfig({
        'api-host': cliOptions.apiHost,
        'api-port': cliOptions.apiPort,
        'api-endpoint': cliOptions.apiEndpoint,
        'api-model': cliOptions.apiModel,
        'api-timeout': cliOptions.apiTimeout,
        'dry-run': cliOptions.dryRun,
        'interactive': cliOptions.interactive,
        'verbose': cliOptions.verbose,
        'debug': cliOptions.debug,
      });
      
      // Get config CLI options (may be modified by .aicommitrc files)
      const configCliOptions = getCliOptions();
      
      // Merge CLI options with loaded config (CLI options take precedence)
      const mergedOptions = {
        ...configCliOptions,
        ...cliOptions
      };
      
      // Set debug mode if enabled
      if (mergedOptions.debug) {
        setDebugMode(true);
        console.log('Debug mode enabled. Additional information will be displayed.');
      }
      
      // Initialize repositories now that config is loaded
      this.gitRepository = new GitRepositoryImpl();
      this.aiRepository = new DefaultAIRepositoryImpl();
      
      // Initialize use cases
      this.generateCommitMessageUseCase = new GenerateCommitMessageUseCase(
        this.gitRepository,
        this.aiRepository
      );
      this.commitChangesUseCase = new CommitChangesUseCase(
        this.gitRepository
      );
      
      // Show welcome message in verbose mode
      if (cliOptions.verbose) {
        this.cliPresenter.showProcess('Starting AICommit process...');
        this.cliPresenter.showStep(1, 3, 'Analyzing Git changes');
      }
      
      // Generate commit message
      if (!this.generateCommitMessageUseCase) {
        throw new Error('Generate commit message use case not initialized');
      }
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
      
      if (!this.commitChangesUseCase) {
        throw new Error('Commit changes use case not initialized');
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