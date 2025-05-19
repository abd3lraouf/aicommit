/**
 * Debug utilities for the application
 */

import chalk from 'chalk';
import figures from 'figures';
import { styles } from './styles';

// Debug mode state
let isDebugMode = process.env.DEBUG === 'true';

/**
 * Set debug mode state
 * @param enabled Whether debug mode should be enabled
 */
export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
  
  if (enabled) {
    console.log(styles.debugHeadingText('DEBUG MODE ENABLED'));
    console.log(styles.debug(`
This mode provides detailed information about:
${styles.debugHighlight('•')} Message generation process
${styles.debugHighlight('•')} Conventional commit format validation
${styles.debugHighlight('•')} File analysis details

${styles.debugHighlight('To report any issues:')}
1. Run with --debug flag
2. Save the output (redact sensitive code if needed)
3. Open an issue on GitHub with the debug output
`));
    console.log(styles.debugSeparator());
  }
}

/**
 * Log message in debug mode only
 * @param context The context/category of the log
 * @param message The message to log
 * @param data Optional data to include
 * @param type Optional type of debug log ('api' for API-related logs)
 */
export function debugLog(context: string, message: string, data?: any, type?: 'api'): void {
  if (!isDebugMode) return;
  
  // If message is the debug separator, just print it directly
  if (message === styles.debugSeparator()) {
    console.log(message);
    return;
  }
  
  console.log(styles.debugText(context, message));
  if (data !== undefined) {
    if (typeof data === 'string') {
      // If data is a string, show it with debug styling
      console.log(styles.debug('Data:'), styles.debug(data));
    } else if (type === 'api') {
      // For API-related data, use the API debug styling with expanded objects
      console.log(styles.debugApi('API Payload:'), JSON.stringify(data, null, 2));
    } else {
      // For objects or other types, use a more neutral color but still indicate debug
      console.log(styles.debug('Data:'), data);
    }
  }
}

/**
 * Log original and generated content for debugging commit message generation
 * @param context The original content or context
 * @param generated The generated commit message
 */
export function debugExtraction(context: string, generated: string): void {
  if (!isDebugMode) return;
  
  console.log(styles.debugHeadingText('COMMIT CONTEXT'));
  console.log(styles.debug(context));
  
  console.log(styles.debugHeadingText('GENERATED COMMIT MESSAGE'));
  console.log(styles.debug(generated));
  console.log(styles.debugSeparator());
}
