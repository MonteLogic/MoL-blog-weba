#!/usr/bin/env node
/**
 * Script to run Biome and output diagnostics in a GCC-style format
 * that VS Code's Problems pane can parse.
 *
 * Usage: node scripts/biome-report.js [--max 2000]
 */

const { execSync } = require('child_process');
const path = require('path');
const workspaceRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const maxIndex = args.findIndex((arg) => arg === '--max');
const maxDiagnostics =
  maxIndex >= 0 ? Number(args[maxIndex + 1]) || 2000 : 2000;

const biomeCommand = `pnpm biome check . --reporter=json --max-diagnostics=${maxDiagnostics}`;

function getLineAndColumn(source, offset) {
  if (!source || offset == null || offset < 0) {
    return { line: 1, column: 1 };
  }

  const prefix = source.slice(0, offset);
  const lines = prefix.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function emitDiagnostics(data) {
  const diagnostics = Array.isArray(data?.diagnostics) ? data.diagnostics : [];

  for (const diag of diagnostics) {
    const filePath = diag?.location?.path?.file;
    if (!filePath) {
      continue;
    }

    const sourceCode = diag?.location?.sourceCode || '';
    const span = Array.isArray(diag?.location?.span)
      ? diag.location.span
      : null;
    const startOffset = span ? span[0] : 0;
    const { line, column } = getLineAndColumn(sourceCode, startOffset);

    const file = filePath.replace(/^\.\//, '');
    const severity = diag.severity === 'warning' ? 'warning' : 'error';
    const category = diag.category ? `${diag.category} ` : '';
    const message = diag.description || diag.category || 'Unknown issue';

    console.log(
      `${file}:${line}:${column}: ${severity}: ${category}${message}`,
    );
  }
}

try {
  const result = execSync(biomeCommand, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });

  emitDiagnostics(JSON.parse(result));
} catch (error) {
  if (error.stdout) {
    try {
      emitDiagnostics(JSON.parse(error.stdout));
      process.exitCode = 1;
    } catch (parseError) {
      console.error('Failed to parse Biome output');
      console.error(error.stdout);
      process.exitCode = 1;
    }
  } else {
    console.error('Biome check failed:', error.message);
    process.exitCode = 1;
  }
}
