import { readFile, writeFile } from 'fs/promises';

/**
 * Read input file with proper error handling
 */
export async function readInputFile(path: string): Promise<string> {
  try {
    const content = await readFile(path, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        throw new Error(`Input file not found: ${path}`);
      }
      if ('code' in error && error.code === 'EACCES') {
        throw new Error(`Permission denied reading file: ${path}`);
      }
      throw new Error(`Failed to read ${path}: ${error.message}`);
    }
    throw new Error(`Failed to read ${path}: Unknown error`);
  }
}

/**
 * Write output file with proper error handling
 */
export async function writeOutputFile(
  path: string,
  html: string
): Promise<void> {
  try {
    await writeFile(path, html, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'EACCES') {
        throw new Error(`Permission denied writing file: ${path}`);
      }
      if ('code' in error && error.code === 'ENOENT') {
        throw new Error(`Output directory does not exist for: ${path}`);
      }
      throw new Error(`Failed to write ${path}: ${error.message}`);
    }
    throw new Error(`Failed to write ${path}: Unknown error`);
  }
}