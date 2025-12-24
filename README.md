# MoL-blog

A Next.js blog that renders markdown content from a separate content repository.

## Local Development Setup

### Prerequisites
- Node.js 20.x
- pnpm

### 1. Clone Both Repositories

```bash
cd /path/to/your/projects
git clone https://github.com/MonteLogic/MoL-blog-weba.git
git clone https://github.com/MonteLogic/MoL-blog-content.git
```

### 2. Create Symlink

```bash
cd MoL-blog-weba
pnpm run setup   # Creates symlink to ../MoL-blog-content
```

### 3. Install & Run

```bash
pnpm install
pnpm dev
```

## Deployment (Vercel)

No configuration needed! On `pnpm install`, the content repo is automatically cloned from the URL in `package.json`:

```json
"config": {
  "contentRepo": "https://github.com/MonteLogic/MoL-blog-content.git"
}
```

## Forking This Project

1. Fork both repos: `MoL-blog-weba` and `MoL-blog-content`
2. Edit `package.json` → `config.contentRepo` to point to your content fork
3. Deploy to Vercel—it just works

## Working with Content

The content repo is **independent**—commit and push separately:

```bash
cd ../MoL-blog-content
git add . && git commit -m "new post" && git push
```

No submodule pointer commits needed—repos are fully decoupled.

## VS Code Multi-Repo Setup

To see both repos in Source Control:
1. **File > Add Folder to Workspace...**
2. Select `MoL-blog-content`

---

## Notes

- [WordPress Export to Markdown](https://github.com/lonekorean/wordpress-export-to-markdown)
- [Previous setup notes](https://gist.github.com/MonteLogic/13c02295d79aa31bb5d9eeb8035a3f1c)
