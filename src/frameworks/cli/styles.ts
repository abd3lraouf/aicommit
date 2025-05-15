/**
 * Styling utilities for consistent CLI output
 */

import chalk from 'chalk';
import figures from 'figures';

// Define consistent styling functions
export const styles = {
  // Colors
  info: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  highlight: chalk.cyan,
  muted: chalk.gray,
  debug: chalk.hex('#8a8a8a'), // Darker gray for debug text
  debugHighlight: chalk.hex('#b58900'), // Amber color for important debug info
  debugHeading: chalk.hex('#6c71c4'), // Muted purple for headings
  debugBorder: chalk.hex('#586e75'), // Muted teal for borders

  // Symbols
  infoSymbol: figures.info,
  successSymbol: figures.tick,
  warningSymbol: figures.warning,
  errorSymbol: figures.cross,
  pointerSymbol: figures.pointer,
  bulletSymbol: '•',
  debugSymbol: figures.arrowRight,
  
  // Combined styles
  infoText: (text: string) => `${chalk.blue(figures.info)} ${chalk.blue(text)}`,
  successText: (text: string) => `${chalk.green(figures.tick)} ${chalk.green(text)}`,
  warningText: (text: string) => `${chalk.yellow(figures.warning)} ${chalk.yellow(text)}`,
  errorText: (text: string) => `${chalk.red(figures.cross)} ${chalk.red(text)}`,
  processText: (text: string) => `${chalk.blue(figures.pointer)} ${chalk.cyan(text)}`,
  debugText: (context: string, text: string) => 
    `${styles.debug(figures.arrowRight)} ${styles.debugHighlight(`[${context}]`)} ${styles.debug(text)}`,
  debugHeadingText: (text: string) => {
    const border = styles.debugBorder('─'.repeat(text.length + 10));
    return `\n${border}\n${styles.debugHeading(`     ${text}     `)}\n${border}`;
  },
  debugSeparator: () => styles.debugBorder('\n' + '─'.repeat(50) + '\n'),
  debugValue: (value: string) => styles.debugHighlight(value),
  
  // Status indicators
  step: (current: number, total: number) => chalk.bold.blue(`[${current}/${total}]`),
  bullet: (text: string) => `  ${chalk.green('•')} ${text}`,
};
