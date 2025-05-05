
// lib/markdownPaths.ts
import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

/**
 * Finds all markdown files in a directory and generates a JSON file with their paths.
 * @param markdownDirectory - The absolute or relative path to the directory containing markdown files.
 * @param outputFilePath - The absolute or relative path where the JSON file should be saved.
 * @param baseDir - Optional base directory to make paths relative to in the output JSON.
 */
export const generateMarkdownPaths = (
  markdownDirectory: string,
  outputFilePath: string,
  baseDir: string = ''
): void => {
  try {
    // Ensure the markdown directory exists
    if (!fs.existsSync(markdownDirectory)) {
      console.error(`Error: Markdown directory not found at ${markdownDirectory}`);
      process.exit(1);
    }

    // Use glob to find all .md files recursively
    const files: string[] = glob.sync('**/*.md', { cwd: markdownDirectory });

    // If a base directory is provided, make the paths relative to it
    const pathsToOutput: string[] = baseDir
      ? files.map(file => path.relative(baseDir, path.join(markdownDirectory, file)))
      : files;

    // Ensure the output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate the JSON data
    const jsonData = JSON.stringify(pathsToOutput, null, 2); // null, 2 for pretty printing

    // Write the JSON data to a file
    fs.writeFileSync(outputFilePath, jsonData, 'utf-8');

    console.log(`Generated ${outputFilePath} with paths to ${pathsToOutput.length} markdown files.`);
  } catch (error) {
    console.error('An error occurred while generating markdown paths:', error);
    process.exit(1);
  }
};