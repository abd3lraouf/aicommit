import { LMStudioClient } from '@lmstudio/sdk';
import { debugLog } from '../cli/debug.js';
import { ConnectionError, ModelNotLoadedError } from '../../core/errors/ai-errors.js';

export interface LMStudioConfig {
  host: string;
  port: number;
  model: string;
  timeout: number;
}

export class LMStudioClientManager {
  private client: LMStudioClient;
  private config: LMStudioConfig;
  private modelHandle: any = null;

  constructor(config: LMStudioConfig) {
    this.config = config;
    this.client = new LMStudioClient({
      baseUrl: `ws://${config.host}:${config.port}`
    });
    
    debugLog('LMStudio', `Initialized LM Studio client manager: ws://${config.host}:${config.port}`);
  }

  async ensureModelLoaded(): Promise<any> {
    if (this.modelHandle) {
      return this.modelHandle;
    }

    try {
      debugLog('LMStudio', `Checking if model is already loaded: ${this.config.model}`);
      
      // First check if the model is already loaded
      const loadedModels = await this.client.llm.listLoaded();
      const isLoaded = loadedModels.some((model: any) => 
        model.identifier === this.config.model || 
        model.path === this.config.model ||
        model.modelKey === this.config.model
      );
      
      if (isLoaded) {
        debugLog('LMStudio', `Model already loaded, creating dynamic handle: ${this.config.model}`);
        // Use createDynamicHandle() to get a handle for the already loaded model
        this.modelHandle = this.client.llm.createDynamicHandle(this.config.model);
        debugLog('LMStudio', `Successfully created dynamic handle for existing model: ${this.config.model}`);
      } else {
        debugLog('LMStudio', `Model not loaded, loading: ${this.config.model}`);
        // Use load() to load the model
        this.modelHandle = await this.client.llm.load(this.config.model);
        debugLog('LMStudio', `Successfully loaded model: ${this.config.model}`);
      }
      
      return this.modelHandle;
    } catch (error) {
      debugLog('LMStudio', `Failed to ensure model is loaded: ${this.config.model}`, error);
      throw new ModelNotLoadedError(this.config.model);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Try to get the list of loaded models to check connection
      const models = await this.client.llm.listLoaded();
      debugLog('LMStudio', `Connection successful. Loaded models: ${models.length}`);
      return true;
    } catch (error) {
      debugLog('LMStudio', 'Connection check failed', error);
      throw new ConnectionError(this.config.host, this.config.port);
    }
  }

  async getLoadedModels(): Promise<string[]> {
    try {
      const models = await this.client.llm.listLoaded();
      return models.map((model: any) => model.identifier);
    } catch (error) {
      debugLog('LMStudio', 'Failed to get loaded models', error);
      return [];
    }
  }

  async isModelLoaded(modelName: string): Promise<boolean> {
    try {
      const loadedModels = await this.getLoadedModels();
      return loadedModels.includes(modelName);
    } catch (error) {
      debugLog('LMStudio', 'Failed to check if model is loaded', error);
      return false;
    }
  }

  getClient(): LMStudioClient {
    return this.client;
  }

  getConfig(): LMStudioConfig {
    return this.config;
  }

  // Reset the model handle to force reload
  resetModel(): void {
    this.modelHandle = null;
    debugLog('LMStudio', 'Model handle reset');
  }
} 