#!/usr/bin/env node
/**
 * Design gate. Runs the Hallmark sloplint over this app's sources and ratchets
 * the FAIL count. The baseline is committed, so the number only goes down.
 *
 *   npm run design                check against the baseline, exit 1 on growth
 *   npm run design -- --update    record the current count as the new baseline
 *   npm run design -- --render    also measure in a browser (slower)
 *
 * The linter lives outside this repo, at ~/.agents/skills/hallmark. Set
 * HALLMARK_LINTER to another path when it moves. A missing linter is a hard
 * failure: a gate that cannot run must not report green.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative, dirname } from 'node:path'
import { homedir } from 'node:os'

const ROOT = process.cwd()
const BASELINE = join(ROOT, 'design-baseline.json')
const REPORT = join(ROOT, '.hallmark', 'design-report.json')

const args = new Set(process.argv.slice(2))
const UPDATE = args.has('--update')
const RENDER = args.has('--render')

const LINTER =
  process.env.HALLMARK_LINTER ||
  join(homedir(), '.agents', 'skills', 'hallmark', 'scripts', 'sloplint.mjs')

if (!existsSync(LINTER)) {
  console.error(`design: linter not found at ${LINTER}`)
  console.error('design: point HALLMARK_LINTER at sloplint.mjs')
  process.exit(2)
}

/** Extensions the linter understands. .ts is skipped: no JSX to judge. */
const EXTENSIONS = new Set(['.tsx', '.css', '.html'])

function targets(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'test' || name.startsWith('.')) continue
    if (name.includes('.test.')) continue
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) targets(path, out)
    else if (EXTENSIONS.has(extname(name))) out.push(path)
  }
  return out
}

function lint(file) {
  const cli = [LINTER, file, '--json']
  if (RENDER) cli.push('--render')
  const run = spawnSync('node', cli, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  try {
    return JSON.parse(run.stdout)
  } catch {
    console.error(`design: no JSON from sloplint on ${relative(ROOT, file)}`)
    console.error(String(run.stderr || '').trim().slice(0, 400))
    process.exit(2)
  }
}

const files = targets(join(ROOT, 'src'))
if (existsSync(join(ROOT, 'index.html'))) files.push(join(ROOT, 'index.html'))

let fails = 0
let reflex = 0
const rows = []

for (const file of files) {
  const result = lint(file)
  fails += result.summary.fails
  reflex += result.summary.reflex
  for (const finding of result.findings) {
    if (finding.grade === 'FAIL' || finding.grade === 'REFLEX') {
      rows.push({
        file: relative(ROOT, file),
        line: finding.line,
        gate: finding.gate,
        grade: finding.grade,
        evidence: finding.evidence,
      })
    }
  }
}

mkdirSync(dirname(REPORT), { recursive: true })
writeFileSync(
  REPORT,
  JSON.stringify({ fails, reflex, files: files.length, render: RENDER, rows }, null, 2),
)

const previous = existsSync(BASELINE)
  ? JSON.parse(readFileSync(BASELINE, 'utf8'))
  : { fails: Number.MAX_SAFE_INTEGER }

if (UPDATE) {
  writeFileSync(BASELINE, `${JSON.stringify({ fails, reflex, files: files.length }, null, 2)}\n`)
  console.log(`design: baseline recorded at ${fails} FAIL / ${reflex} REFLEX`)
  process.exit(0)
}

console.log(`design: ${fails} FAIL, ${reflex} REFLEX across ${files.length} files`)
for (const row of rows.filter((r) => r.grade === 'FAIL').slice(0, 20)) {
  console.log(`  FAIL ${row.gate} ${row.file}:${row.line} ${row.evidence}`)
}

if (fails > previous.fails) {
  console.error(`design: FAIL count grew from ${previous.fails} to ${fails}`)
  process.exit(1)
}

console.log(`design: within baseline (${previous.fails})`)
