import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { CrosspostInput, CrosspostPlatform } from '../../src/lib/crosspost'

const ARTICLE_FILE_PATTERN = /^public\/blogs\/([^/]+)\/(?:index\.md|config\.json)$/

export function extractChangedSlugs(files: string[]): string[] {
	return [...new Set(files.map(file => file.replaceAll('\\', '/').match(ARTICLE_FILE_PATTERN)?.[1]).filter((slug): slug is string => Boolean(slug)))].sort()
}

export function changedSlugsFromGit(before: string, after: string): string[] {
	const zeroSha = /^0+$/.test(before)
	const base = zeroSha ? `${after}^` : before
	const output = execFileSync('git', ['diff', '--name-only', base, after, '--', 'public/blogs'], { encoding: 'utf8' })
	return extractChangedSlugs(output.split(/\r?\n/).filter(Boolean))
}

export function loadArticle(repoRoot: string, slug: string): CrosspostInput | null {
	const articleDir = path.join(repoRoot, 'public', 'blogs', slug)
	const markdownPath = path.join(articleDir, 'index.md')
	const configPath = path.join(articleDir, 'config.json')
	if (!fs.existsSync(markdownPath) || !fs.existsSync(configPath)) return null

	const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
		title?: string
		tags?: string[]
		summary?: string
		hidden?: boolean
	}
	if (config.hidden) return null

	return {
		slug,
		title: config.title || slug,
		markdown: fs.readFileSync(markdownPath, 'utf8'),
		tags: config.tags || [],
		summary: config.summary
	}
}

export function contentHash(input: CrosspostInput, platform: CrosspostPlatform, siteUrl: string): string {
	return createHash('sha256')
		.update(JSON.stringify({ ...input, platform, siteUrl: siteUrl.replace(/\/$/, '') }))
		.digest('hex')
}
