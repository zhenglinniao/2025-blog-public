import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { CrosspostPlatform } from '../../src/lib/crosspost'
import type { CrosspostRunnerConfig, CrosspostState } from './types'

export function crosspostHome(): string {
	return path.resolve(process.env.CROSSPOST_HOME || path.join(os.homedir(), '.blog-crosspost'))
}

export function authFile(platform: CrosspostPlatform): string {
	return path.join(crosspostHome(), 'auth', `${platform}.json`)
}

export function ensurePrivateDirectories(): void {
	fs.mkdirSync(path.join(crosspostHome(), 'auth'), { recursive: true })
}

export function loadConfig(repoRoot: string): CrosspostRunnerConfig {
	const value = JSON.parse(fs.readFileSync(path.join(repoRoot, '.crosspostrc.json'), 'utf8')) as CrosspostRunnerConfig
	if (value.version !== 1) throw new Error(`不支持的跨平台配置版本：${String(value.version)}`)
	if (process.env.CROSSPOST_HEADLESS) value.headless = process.env.CROSSPOST_HEADLESS !== 'false'
	return value
}

export function loadState(): CrosspostState {
	const file = path.join(crosspostHome(), 'state.json')
	if (!fs.existsSync(file)) return { version: 1, articles: {} }
	return JSON.parse(fs.readFileSync(file, 'utf8')) as CrosspostState
}

export function saveState(state: CrosspostState): void {
	ensurePrivateDirectories()
	const file = path.join(crosspostHome(), 'state.json')
	const temporary = `${file}.tmp`
	fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
	fs.renameSync(temporary, file)
}
