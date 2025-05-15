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
${styles.debugHighlight('•')} Message extraction process
${styles.debugHighlight('•')} Tag detection (<commit-start> and <commit-end>)
${styles.debugHighlight('•')} Validation of conventional commit format
${styles.debugHighlight('•')} Original Amazon Q responses

${styles.debugHighlight('To report any issues with the extraction:')}
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
 */
export function debugLog(context: string, message: string, data?: any): void {
  if (!isDebugMode) return;
  
  console.log(styles.debugText(context, message));
  if (data !== undefined) {
    if (typeof data === 'string') {
      // If data is a string, show it with debug styling
      console.log(styles.debug('Data:'), styles.debug(data));
    } else {
      // For objects or other types, use a more neutral color but still indicate debug
      console.log(styles.debug('Data:'), data);
    }
  }
}

/**
 * Log original and extracted content for debugging commit message extraction
 * @param original The original content
 * @param extracted The extracted content
 */
export function debugExtraction(original: string, extracted: string): void {
  if (!isDebugMode) return;
  
  console.log(styles.debugHeadingText('ORIGINAL AMAZON Q OUTPUT'));
  console.log(styles.debug(original));
  
  // Check for tag presence
  const hasStartTag = original.includes('<commit-start>');
  const hasEndTag = original.includes('<commit-end>');
  console.log(styles.debugHeadingText('TAG DETECTION'));
  console.log(styles.debug(`Start tag detected: ${hasStartTag ? styles.debugHighlight('YES') : 'NO'}`));
  console.log(styles.debug(`End tag detected: ${hasEndTag ? styles.debugHighlight('YES') : 'NO'}`));
  
  // If tags are present, show the exact tagged section
  if (hasStartTag && hasEndTag) {
    const taggedMatch = original.match(/<commit-start>\s*([\s\S]*?)\s*<commit-end>/);
    if (taggedMatch && taggedMatch[1]) {
      console.log(styles.debugHeadingText('TAGGED CONTENT'));
      console.log(styles.debug(taggedMatch[1].trim()));
    }
  }
  
  console.log(styles.debugHeadingText('EXTRACTED COMMIT MESSAGE'));
  console.log(styles.debug(extracted));
  console.log(styles.debugSeparator());
}
