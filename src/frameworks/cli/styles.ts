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
  
  // Symbols
  infoSymbol: figures.info,
  successSymbol: figures.tick,
  warningSymbol: figures.warning,
  errorSymbol: figures.cross,
  pointerSymbol: figures.pointer,
  bulletSymbol: '•',
  
  // Combined styles
  infoText: (text: string) => `${chalk.blue(figures.info)} ${chalk.blue(text)}`,
  successText: (text: string) => `${chalk.green(figures.tick)} ${chalk.green(text)}`,
  warningText: (text: string) => `${chalk.yellow(figures.warning)} ${chalk.yellow(text)}`,
  errorText: (text: string) => `${chalk.red(figures.cross)} ${chalk.red(text)}`,
  processText: (text: string) => `${chalk.blue(figures.pointer)} ${chalk.cyan(text)}`,
  debugText: (context: string, text: string) => `${chalk.gray(figures.info)} ${chalk.gray(`[${context}]`)} ${chalk.gray(text)}`,
  
  // Status indicators
  step: (current: number, total: number) => chalk.bold.blue(`[${current}/${total}]`),
  bullet: (text: string) => `  ${chalk.green('•')} ${text}`,
};
