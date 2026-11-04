import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const requiredMajor = 24
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10)

if (nodeMajor < requiredMajor) {
  console.error(`Sink requires Node.js ${requiredMajor} or newer, but ${process.versions.node} is running.`)
  process.exit(1)
}

const nuxtBin = fileURLToPath(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url))

if (!existsSync(nuxtBin)) {
  console.error('Nuxt is not installed. Run "pnpm install" before building.')
  process.exit(1)
}

// The production build needs a larger heap than the Node default; keep any
// NODE_OPTIONS supplied by the environment or CI instead of overriding it.
const result = spawnSync(process.execPath, [nuxtBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=8192',
  },
})

process.exit(result.status ?? 1)
