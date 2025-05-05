// scripts/generate.ts
import { generateMarkdownPaths } from '#/utils/paths/markdownPaths';
import * as path from 'path';


// Don't like the hard-coded string part of projectRoot
// Define your markdown directory and output file path relative to the project root
const projectRoot = path.join(__dirname, '../MoL-blog-content');
const markdownSourceDir = path.join(projectRoot, 'path/to/your/submodule'); // **Adjust this path**
const outputJsonFile = path.join(projectRoot, 'data/markdown-paths.json'); // **Adjust this path
const baseDirectoryForPaths = projectRoot; // Optional: make paths in JSON relative to project root

// Call the utility function
generateMarkdownPaths(markdownSourceDir, outputJsonFile, baseDirectoryForPaths);