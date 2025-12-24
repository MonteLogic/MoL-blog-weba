# MoL-blog

A Next.js blog that renders markdown content from a separate content repository.

## Setup

### Prerequisites
- Node.js 20.x
- pnpm

### 1. Clone Both Repositories

Clone the web app and content repo as siblings:

```bash
cd /path/to/your/projects
git clone https://github.com/MonteLogic/MoL-blog-weba.git
git clone https://github.com/MonteLogic/MoL-blog-content.git
```

### 2. Create Symlink

Link the content repo into the web app:

```bash
cd MoL-blog-weba
ln -s ../MoL-blog-content MoL-blog-content
```

### 3. Generate Markdown Paths

```bash
pnpm install
pnpm run generate-markdown-paths
```

### 4. Run Development Server

```bash
pnpm dev
```

## Working with Content

The content repo is **independent**—commit and push to it separately:

```bash
cd ../MoL-blog-content
# Add/edit posts...
git add . && git commit -m "new post" && git push
```

The web app repo does **not** track content commits, eliminating submodule conflicts.

## VS Code Multi-Repo Setup

To see both repos in Source Control:
1. **File > Add Folder to Workspace...**
2. Select `MoL-blog-content`
3. (Optional) **File > Save Workspace As...** to persist

---

## Notes

- [WordPress Export to Markdown](https://github.com/lonekorean/wordpress-export-to-markdown) - useful for migrating, but exports `.md` not `.mdx`
- [Previous setup notes](https://gist.github.com/MonteLogic/13c02295d79aa31bb5d9eeb8035a3f1c)
