#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const RELEASE_FILE_PATTERNS = [
  /^src\//,
  /^public\//,
  /^index\.html$/,
  /^vite\.config\.ts$/,
  /^tsconfig(?:\.[^.]+)?\.json$/,
]

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function refExists(ref) {
  try {
    git(['rev-parse', '--verify', `${ref}^{tree}`])
    return true
  } catch {
    return false
  }
}

function normalizeBaseRef() {
  const configuredBase = process.env.VERSION_GUARD_BASE || 'origin/main'
  const head = process.env.VERSION_GUARD_HEAD || 'HEAD'

  if (/^0+$/.test(configuredBase)) {
    return `${head}^`
  }

  return configuredBase
}

function readPackageVersion(ref) {
  const raw =
    ref === null
      ? readFileSync('package.json', 'utf8')
      : git(['show', `${ref}:package.json`])

  return JSON.parse(raw).version
}

function assertLockfileMatchesPackage(version) {
  const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'))

  if (lockfile.version !== version || lockfile.packages?.['']?.version !== version) {
    throw new Error(`package-lock.json version must match package.json version ${version}.`)
  }
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version)

  if (!match) {
    throw new Error(`Unsupported semver version: ${version}`)
  }

  return match.slice(1).map(Number)
}

function isVersionGreater(current, base) {
  const currentParts = parseVersion(current)
  const baseParts = parseVersion(base)

  for (let index = 0; index < currentParts.length; index += 1) {
    if (currentParts[index] > baseParts[index]) {
      return true
    }

    if (currentParts[index] < baseParts[index]) {
      return false
    }
  }

  return false
}

function changedFiles(base, head) {
  const args = head ? ['diff', '--name-only', base, head] : ['diff', '--name-only', base, '--']
  const tracked = git(args)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (head) {
    return tracked
  }

  const untracked = git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return [...new Set([...tracked, ...untracked])]
}

const baseRef = normalizeBaseRef()
const headRef = process.env.VERSION_GUARD_HEAD || null

if (!refExists(baseRef)) {
  throw new Error(`Base ref not found: ${baseRef}. Fetch origin/main or set VERSION_GUARD_BASE.`)
}

const files = changedFiles(baseRef, headRef)
const hasReleaseChange = files.some((file) => RELEASE_FILE_PATTERNS.some((pattern) => pattern.test(file)))

const currentVersion = readPackageVersion(headRef)
assertLockfileMatchesPackage(currentVersion)

if (!hasReleaseChange) {
  console.log('No release-relevant files changed; version bump not required.')
  process.exit(0)
}

const baseVersion = readPackageVersion(baseRef)

if (!isVersionGreater(currentVersion, baseVersion)) {
  console.error('Release-relevant files changed without a package version bump.')
  console.error(`Base version: ${baseVersion}`)
  console.error(`Current version: ${currentVersion}`)
  console.error('Run npm run release:patch before committing user-facing changes to main.')
  process.exit(1)
}

console.log(`Version bump verified: ${baseVersion} -> ${currentVersion}`)
