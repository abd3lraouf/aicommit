export class AIError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AIError';
  }
}

export class ModelNotLoadedError extends AIError {
  constructor(modelName: string) {
    super(`Model "${modelName}" is not loaded in LM Studio. Please load the model and try again.`);
    this.name = 'ModelNotLoadedError';
  }
}

export class ConnectionError extends AIError {
  constructor(host: string, port: number) {
    super(`Cannot connect to LM Studio at ${host}:${port}. Please ensure LM Studio is running and the server is started.`);
    this.name = 'ConnectionError';
  }
}

export class SchemaValidationError extends AIError {
  constructor(details: string) {
    super(`Schema validation failed: ${details}. The model may not support structured output properly.`);
    this.name = 'SchemaValidationError';
  }
}

export class TimeoutError extends AIError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms. The model may be taking too long to respond.`);
    this.name = 'TimeoutError';
  }
}

export function createAIError(error: unknown, context?: { modelName?: string; host?: string; port?: number; timeout?: number }): AIError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('model not found') || errorMessage.includes('model not loaded')) {
    return new ModelNotLoadedError(context?.modelName || 'unknown');
  } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
    return new ConnectionError(context?.host || 'localhost', context?.port || 1234);
  } else if (errorMessage.includes('schema') || errorMessage.includes('validation')) {
    return new SchemaValidationError(errorMessage);
  } else if (errorMessage.includes('timeout')) {
    return new TimeoutError(context?.timeout || 30000);
  } else {
    return new AIError(`LM Studio API Error: ${errorMessage}`, error instanceof Error ? error : undefined);
  }
} 