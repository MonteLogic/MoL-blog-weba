const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // Include content files in the serverless function bundle.
  // auth() makes blog pages dynamic (rendered at request time), but file tracing
  // can't detect the dynamically-computed fs.readFileSync() paths to markdown files.
  outputFileTracingIncludes: {
    '/blog/[slug]': ['./MoL-blog-content/posts/**/*', './generated/**/*'],
    '/blog': ['./MoL-blog-content/posts/**/*', './generated/**/*'],
    '/blog/projects/[project]': ['./MoL-blog-content/posts/**/*'],
    '/blog/projects/[project]/[post]': ['./MoL-blog-content/posts/**/*'],
    '/blog/pain-points': ['./MoL-blog-content/posts/**/*'],
    '/blog/pain-points/[slug]': ['./MoL-blog-content/posts/**/*'],
    '/blog/categories/[slug]': [
      './MoL-blog-content/posts/**/*',
      './generated/**/*',
    ],
    '/blog/posts': ['./MoL-blog-content/posts/**/*'],
    '/blog/posts/[slug]': ['./MoL-blog-content/posts/**/*'],
    '/api/projects/[project]/posts/[post]': ['./MoL-blog-content/posts/**/*'],
    '/[slug]': ['./MoL-blog-content/posts/**/*'],
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
