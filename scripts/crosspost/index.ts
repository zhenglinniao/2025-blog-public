import path from 'node:path'
import { createCrosspostDocument, type CrosspostPlatform } from '../../src/lib/crosspost'
import { loginPlatform, syncPlatform } from './browser'
import { changedSlugsFromGit, contentHash, listArticleSlugs, loadArticle } from './core'
import { crosspostHome, loadConfig, loadState, saveState } from './storage'

const PLATFORMS: CrosspostPlatform[] = ['csdn', 'juejin']

function option(name: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`)
	return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(name: string): boolean {
	return process.argv.includes(`--${name}`)
}

function positiveNumber(name: string, fallback: number): number {
	const value = option(name)
	if (!value) return fallback
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`--${name} 必须是非负数字`)
	return parsed
}

function sleep(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function selectedPlatforms(): CrosspostPlatform[] {
	const requested = option('platform')
	if (!requested || requested === 'all') return PLATFORMS
	const values = requested.split(',').filter((value): value is CrosspostPlatform => PLATFORMS.includes(value as CrosspostPlatform))
	if (!values.length) throw new Error('platform 只能是 csdn、juejin 或 all')
	return values
}

async function sync(): Promise<void> {
	const repoRoot = process.cwd()
	const config = loadConfig(repoRoot)
	const state = loadState()
	const explicitSlug = option('slug')
	const before = option('before') || process.env.GITHUB_EVENT_BEFORE
	const after = option('after') || process.env.GITHUB_SHA || 'HEAD'
	if (explicitSlug && hasFlag('all')) throw new Error('--slug 和 --all 不能同时使用')
	const bulkMode = hasFlag('all')
	const slugs = explicitSlug ? [explicitSlug] : bulkMode ? listArticleSlugs(repoRoot) : before ? changedSlugsFromGit(before, after) : []
	if (!slugs.length) throw new Error('没有检测到待同步文章；本地运行请提供 --slug <slug>')
	const platforms = selectedPlatforms()
	const importedDraftId = option('draft-id')
	if (importedDraftId && platforms.length !== 1) throw new Error('--draft-id 只能和单个平台一起使用')
	if (importedDraftId && bulkMode) throw new Error('--draft-id 不能用于全量同步')
	const dryRun = hasFlag('dry-run')
	const maxArticles = positiveNumber('max-articles', Number.POSITIVE_INFINITY)
	const delayMs = positiveNumber('delay-ms', bulkMode ? 8000 : 0)
	let attemptedArticles = 0
	let synced = 0
	let skipped = 0
	const failures: string[] = []

	for (const slug of slugs) {
		const input = loadArticle(repoRoot, slug)
		if (!input) {
			console.log(`[跳过] ${slug} 不存在、配置不完整或已隐藏`)
			continue
		}

		const pendingPlatforms = platforms.filter(platform => {
			if (!config.platforms[platform].enabled) return false
			const hash = contentHash(input, platform, config.siteUrl)
			return hasFlag('force') || state.articles[slug]?.platforms[platform]?.contentHash !== hash
		})
		if (!pendingPlatforms.length) {
			skipped += platforms.length
			continue
		}
		if (attemptedArticles >= maxArticles) break
		attemptedArticles += 1

		for (const platform of pendingPlatforms) {
			const hash = contentHash(input, platform, config.siteUrl)
			const previous = state.articles[slug]?.platforms[platform]
			const draftId = previous?.draftId || importedDraftId
			if (dryRun) {
				console.log(`[待同步] ${slug} -> ${platform}${draftId ? `（更新草稿 ${draftId}）` : '（新建草稿）'}`)
				continue
			}
			console.log(`[同步] ${slug} -> ${platform}${draftId ? `（更新草稿 ${draftId}）` : '（新建草稿）'}`)
			try {
				const document = createCrosspostDocument(input, platform, config.siteUrl)
				const result = await syncPlatform(platform, document, config, draftId)
				state.articles[slug] ||= { platforms: {} }
				state.articles[slug].platforms[platform] = {
					...result,
					contentHash: hash,
					syncedAt: new Date().toISOString()
				}
				saveState(state)
				synced += 1
				console.log(`[成功] ${slug} -> ${platform}: ${result.url}`)
			} catch (error) {
				const message = `${slug} -> ${platform}: ${error instanceof Error ? error.message : String(error)}`
				failures.push(message)
				console.error(`[失败] ${message}`)
			}
			if (delayMs > 0) await sleep(delayMs)
		}
	}

	console.log(`[汇总] 处理文章 ${attemptedArticles} 篇，成功 ${synced} 项，跳过 ${skipped} 项，失败 ${failures.length} 项${dryRun ? '（预演，未写入平台）' : ''}`)
	if (failures.length) throw new Error(`批量同步存在失败项：\n${failures.join('\n')}`)
}

async function main(): Promise<void> {
	const command = process.argv[2]
	const config = loadConfig(process.cwd())
	if (command === 'login') {
		const platform = option('platform') as CrosspostPlatform | undefined
		if (!platform || !PLATFORMS.includes(platform)) throw new Error('请使用 --platform csdn 或 --platform juejin')
		await loginPlatform(platform, config)
		console.log(`${platform} 登录状态已安全保存到 ${crosspostHome()}`)
		return
	}
	if (command === 'status') {
		console.log(JSON.stringify(loadState(), null, 2))
		return
	}
	if (command === 'sync') {
		await sync()
		return
	}
	throw new Error('用法：pnpm crosspost:<login|sync|status> -- [参数]')
}

main().catch(error => {
	console.error(`[自动同步失败] ${error instanceof Error ? error.message : String(error)}`)
	process.exitCode = 1
})
