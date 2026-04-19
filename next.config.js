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
    '/blog/[slug]': ['./MoL-blog-content/**/*', './generated/**/*'],
    '/blog': ['./MoL-blog-content/**/*', './generated/**/*'],
    '/blog/projects/[project]': ['./MoL-blog-content/**/*'],
    '/blog/projects/[project]/[post]': ['./MoL-blog-content/**/*'],
    '/blog/pain-points': ['./MoL-blog-content/**/*'],
    '/blog/pain-points/[slug]': ['./MoL-blog-content/**/*'],
    '/blog/categories/[slug]': ['./MoL-blog-content/**/*', './generated/**/*'],
    '/blog/posts': ['./MoL-blog-content/**/*'],
    '/blog/posts/[slug]': ['./MoL-blog-content/**/*'],
    '/api/projects/[project]/posts/[post]': ['./MoL-blog-content/**/*'],
    '/[slug]': ['./MoL-blog-content/**/*'],
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
