import { spawnSync } from 'node:child_process'
import process from 'node:process'

// Cloudflare Pages runs the build with CF_PAGES=1 and deploys the branch
// itself, so production migrations belong to its postbuild hook. Workers
// Builds deploys through `pnpm deploy:worker`, which migrates explicitly, so
// this hook stays a no-op there.
const isPagesMasterBuild = process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH === 'master'

if (!isPagesMasterBuild) {
  console.log('postbuild: skipped remote D1 migrations (only Cloudflare Pages master builds run them here)')
  process.exit(0)
}

console.log('postbuild: applying remote D1 migrations')

const pnpm = process.env.npm_execpath
const result = pnpm
  ? spawnSync(process.execPath, [pnpm, 'run', 'db:migrate:remote'], { stdio: 'inherit' })
  : spawnSync('pnpm run db:migrate:remote', { stdio: 'inherit', shell: true })

process.exit(result.status ?? 1)
