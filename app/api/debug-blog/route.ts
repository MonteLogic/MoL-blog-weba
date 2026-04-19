import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug =
    searchParams.get('slug') ||
    'using-github-as-a-headless-cms-for-your-next-js-blog';

  const cwd = process.cwd();
  const jsonFilePath = path.join(cwd, 'generated/markdown-paths.json');

  const debug: Record<string, any> = {
    cwd,
    jsonFileExists: fs.existsSync(jsonFilePath),
    contentDirExists: fs.existsSync(path.join(cwd, 'MoL-blog-content')),
    contentPostsDirExists: fs.existsSync(
      path.join(cwd, 'MoL-blog-content/posts'),
    ),
    targetSlug: slug,
  };

  if (debug.jsonFileExists) {
    try {
      const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
      const paths: string[] = JSON.parse(jsonContent);
      debug.totalPaths = paths.length;

      // Check if any path contains the slug text
      debug.matchingPaths = paths.filter((p: string) =>
        p.toLowerCase().includes(slug.replace(/-/g, '-')),
      );

      // Check if content directory has files
      if (debug.contentPostsDirExists) {
        try {
          const uncatDir = path.join(
            cwd,
            'MoL-blog-content/posts/uncategorized',
          );
          debug.uncategorizedDirExists = fs.existsSync(uncatDir);
          if (debug.uncategorizedDirExists) {
            debug.uncategorizedDirs = fs.readdirSync(uncatDir).slice(0, 10);
          }
        } catch (e: any) {
          debug.dirReadError = e.message;
        }
      }

      // Try to resolve the exact file
      for (const filePath of paths) {
        const fullPath = path.join(cwd, filePath.trim());
        if (filePath.includes('using-github')) {
          debug.targetFilePath = filePath;
          debug.targetFullPath = fullPath;
          debug.targetFileExists = fs.existsSync(fullPath);

          if (debug.targetFileExists) {
            try {
              const stat = fs.statSync(fullPath);
              debug.targetFileSize = stat.size;
              debug.targetIsDirectory = stat.isDirectory();
            } catch (e: any) {
              debug.targetStatError = e.message;
            }
          }
        }
      }
    } catch (e: any) {
      debug.jsonParseError = e.message;
    }
  }

  // Also check the generated dir
  const generatedDir = path.join(cwd, 'generated');
  debug.generatedDirExists = fs.existsSync(generatedDir);
  if (debug.generatedDirExists) {
    debug.generatedDirContents = fs.readdirSync(generatedDir);
  }

  return NextResponse.json(debug, { status: 200 });
}
