import { spawn } from 'node:child_process'
import { access, readFile, realpath } from 'node:fs/promises'
import { delimiter, resolve } from 'node:path'
import { platform } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

function parseEnvFile(contents) {
  const values = {}

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/)

    if (!match) continue

    let value = match[2] ?? ''

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s+#.*$/, '').trim()
    }

    values[match[1]] = value.replace(/\\n/g, '\n')
  }

  return values
}

const inheritedKeys = new Set(Object.keys(process.env))

for (const file of ['.env.development', '.env']) {
  const path = resolve(root, file)

  let contents

  try {
    contents = await readFile(path, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') continue
    throw error
  }

  const parsed = parseEnvFile(contents)

  for (const [key, value] of Object.entries(parsed)) {
    if (!inheritedKeys.has(key)) process.env[key] = value
  }
}

const [workingDirectory, command, ...args] = process.argv.slice(2)

if (!workingDirectory || !command) {
  throw new Error('Provide a working directory and command to run after loading the root environment files.')
}

const cwd = resolve(process.cwd(), workingDirectory)

const isWindows = platform() === 'win32'
const searchPaths = (process.env.PATH ?? '').split(delimiter)
const candidates = command.includes('/') || command.includes('\\')
  ? [resolve(cwd, command)]
  : searchPaths.flatMap(directory =>
      isWindows
        ? [`${command}.cmd`, `${command}.exe`, command].map(name => resolve(directory, name))
        : [resolve(directory, command)]
    )
let resolvedCommand = command

for (const candidate of candidates) {
  try {
    await access(candidate)
    resolvedCommand = await realpath(candidate)
    break
  } catch {}
}

const child = isWindows && resolvedCommand.toLowerCase().endsWith('.cmd')
  ? spawn([resolvedCommand, ...args].map(value => `"${value.replaceAll('"', '""')}"`).join(' '), {
      cwd,
      env: process.env,
      stdio: 'inherit',
      shell: true
    })
  : isWindows && resolvedCommand.toLowerCase().endsWith('.exe')
    ? spawn(resolvedCommand, args, { cwd, env: process.env, stdio: 'inherit' })
    : spawn(resolvedCommand, args, { cwd, env: process.env, stdio: 'inherit' })

child.on('error', error => {
  console.error(error.message)
  process.exitCode = 1
})

child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
