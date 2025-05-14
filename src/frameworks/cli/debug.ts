/**
 * Debug utilities for the application
 */

// Debug mode state
let isDebugMode = process.env.DEBUG === 'true';

/**
 * Set debug mode state
 * @param enabled Whether debug mode should be enabled
 */
export function setDebugMode(enabled: boolean): void {
  isDebugMode = enabled;
  
  if (enabled) {
    console.log(`
=== DEBUG MODE ENABLED ===
This mode provides detailed information about:
- Message extraction process
- Tag detection (<commit-start> and <commit-end>)
- Validation of conventional commit format
- Original Amazon Q responses

To report any issues with the extraction:
1. Run with --debug flag
2. Save the output (redact sensitive code if needed)
3. Open an issue on GitHub with the debug output
`);
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
  
  console.log(`[DEBUG:${context}] ${message}`);
  if (data !== undefined) {
    console.log('Data:', data);
  }
}

/**
 * Log original and extracted content for debugging commit message extraction
 * @param original The original content
 * @param extracted The extracted content
 */
export function debugExtraction(original: string, extracted: string): void {
  if (!isDebugMode) return;
  
  console.log('\n===== ORIGINAL AMAZON Q OUTPUT =====');
  console.log(original);
  
  // Check for tag presence
  const hasStartTag = original.includes('<commit-start>');
  const hasEndTag = original.includes('<commit-end>');
  console.log('\n===== TAG DETECTION =====');
  console.log(`Start tag detected: ${hasStartTag ? 'YES' : 'NO'}`);
  console.log(`End tag detected: ${hasEndTag ? 'YES' : 'NO'}`);
  
  // If tags are present, show the exact tagged section
  if (hasStartTag && hasEndTag) {
    const taggedMatch = original.match(/<commit-start>\s*([\s\S]*?)\s*<commit-end>/);
    if (taggedMatch && taggedMatch[1]) {
      console.log('\n===== TAGGED CONTENT =====');
      console.log(taggedMatch[1].trim());
    }
  }
  
  console.log('\n===== EXTRACTED COMMIT MESSAGE =====');
  console.log(extracted);
  console.log('\n=====================================');
}
