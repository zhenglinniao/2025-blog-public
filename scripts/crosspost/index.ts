import path from 'node:path'
import { createCrosspostDocument, type CrosspostPlatform } from '../../src/lib/crosspost'
import { loginPlatform, syncPlatform } from './browser'
import { changedSlugsFromGit, contentHash, loadArticle } from './core'
import { crosspostHome, loadConfig, loadState, saveState } from './storage'

const PLATFORMS: CrosspostPlatform[] = ['csdn', 'juejin']

function option(name: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`)
	return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(name: string): boolean {
	return process.argv.includes(`--${name}`)
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
	const slugs = explicitSlug ? [explicitSlug] : before ? changedSlugsFromGit(before, after) : []
	if (!slugs.length) throw new Error('没有检测到待同步文章；本地运行请提供 --slug <slug>')
	const platforms = selectedPlatforms()
	const importedDraftId = option('draft-id')
	if (importedDraftId && platforms.length !== 1) throw new Error('--draft-id 只能和单个平台一起使用')

	for (const slug of slugs) {
		const input = loadArticle(repoRoot, slug)
		if (!input) {
			console.log(`[跳过] ${slug} 不存在、配置不完整或已隐藏`)
			continue
		}

		for (const platform of platforms) {
			if (!config.platforms[platform].enabled) continue
			const hash = contentHash(input, platform, config.siteUrl)
			const previous = state.articles[slug]?.platforms[platform]
			if (!hasFlag('force') && previous?.contentHash === hash) {
				console.log(`[跳过] ${slug} -> ${platform} 内容没有变化`)
				continue
			}

			const draftId = previous?.draftId || importedDraftId
			console.log(`[同步] ${slug} -> ${platform}${draftId ? `（更新草稿 ${draftId}）` : '（新建草稿）'}`)
			const document = createCrosspostDocument(input, platform, config.siteUrl)
			const result = await syncPlatform(platform, document, config, draftId)
			state.articles[slug] ||= { platforms: {} }
			state.articles[slug].platforms[platform] = {
				...result,
				contentHash: hash,
				syncedAt: new Date().toISOString()
			}
			saveState(state)
			console.log(`[成功] ${slug} -> ${platform}: ${result.url}`)
		}
	}
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
