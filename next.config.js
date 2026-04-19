const path = require('path');
const webpack = require('webpack');

const contentFiles = ['./MoL-blog-content/posts/**/*'];
const contentAndGenerated = [
  './MoL-blog-content/posts/**/*',
  './generated/**/*',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // Include content files in the serverless function bundle.
  // auth() makes blog pages dynamic (rendered at request time), but file tracing
  // can't detect the dynamically-computed fs.readFileSync() paths to markdown files.
  // Note: uses posts/** only (not MoL-blog-content/**) to avoid including
  // MoL-blog-content/node_modules which contains pnpm symlinks.
  outputFileTracingIncludes: {
    '/blog': contentAndGenerated,
    '/blog/[slug]': contentAndGenerated,
    '/blog/posts': contentFiles,
    '/blog/posts/[slug]': contentFiles,
    '/blog/projects/[project]': contentFiles,
    '/blog/projects/[project]/[post]': contentFiles,
    '/blog/pain-points': contentFiles,
    '/blog/pain-points/[slug]': contentFiles,
    '/blog/categories/[slug]': contentAndGenerated,
    '/api/projects/[project]/posts/[post]': contentFiles,
    '/[slug]': contentFiles,
  },
  webpack: (config, { dev, isServer }) => {
    (config.resolve = {
      ...config.resolve,
      symlinks: false,
      alias: {
        ...config.resolve.alias,
        '#': path.resolve(__dirname),
      },
    }),
      // Ignore LICENSE files
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /LICENSE$/,
        }),
      );

    // Mark .node files as external
    config.externals.push(({ context, request }, callback) => {
      if (/\.node$/.test(request)) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    });

    // Handle .md files
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'html-loader',
        },
        {
          loader: 'markdown-loader',
        },
      ],
    });

    // Exclude .d.ts files
    config.module.rules.push({
      test: /\.d\.ts$/,
      loader: 'ignore-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
