import type { CrosspostPlatform } from '../../src/lib/crosspost'

export type PublishMode = 'draft'

export type PlatformConfig = {
	enabled: boolean
	mode: PublishMode
}

export type CrosspostRunnerConfig = {
	version: 1
	siteUrl: string
	headless: boolean
	timeoutMs: number
	platforms: Record<CrosspostPlatform, PlatformConfig>
}

export type PlatformSyncState = {
	draftId: string
	contentHash: string
	status: 'draft'
	url: string
	syncedAt: string
}

export type ArticleSyncState = {
	platforms: Partial<Record<CrosspostPlatform, PlatformSyncState>>
}

export type CrosspostState = {
	version: 1
	articles: Record<string, ArticleSyncState>
}

export type PlatformSyncResult = {
	draftId: string
	url: string
	status: 'draft'
}
