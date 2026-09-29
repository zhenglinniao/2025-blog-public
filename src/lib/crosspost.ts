export type CrosspostPlatform = 'csdn' | 'juejin'

export type CrosspostInput = {
	slug: string
	title: string
	markdown: string
	tags?: string[]
	summary?: string
}

export type CrosspostDocument = {
	platform: CrosspostPlatform
	title: string
	markdown: string
	tags: string[]
	sourceUrl: string
	editorUrl: string
}

const PLATFORM_EDITORS: Record<CrosspostPlatform, string> = {
	csdn: 'https://mp.csdn.net/mp_blog/creation/editor',
	juejin: 'https://juejin.cn/editor/drafts/new?v=2'
}

function absoluteUrl(value: string, siteUrl: string): string {
	if (/^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(value)) return value
	if (value.startsWith('//')) return `https:${value}`
	return new URL(value.replace(/^\.\//, ''), `${siteUrl.replace(/\/$/, '')}/`).toString()
}

/**
 * Converts links and images in blog Markdown to public absolute URLs. Cross-post
 * editors cannot resolve paths such as /blogs/example/image.png against our site.
 */
export function absolutizeMarkdown(markdown: string, siteUrl: string): string {
	let output = markdown.replace(/(!?\[[^\]]*\]\()(<[^>]+>|[^\s)]+)(\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?(\))/g, (_match, open, rawUrl, title = '', close) => {
		const wrapped = rawUrl.startsWith('<') && rawUrl.endsWith('>')
		const value = wrapped ? rawUrl.slice(1, -1) : rawUrl
		const url = absoluteUrl(value, siteUrl)
		return `${open}${wrapped ? `<${url}>` : url}${title}${close}`
	})

	output = output.replace(/(<(?:img|video|source)\b[^>]*?\s(?:src|poster)=(["']))([^"']+)(\2)/gi, (_match, prefix, quote, rawUrl, suffix) => {
		return `${prefix}${absoluteUrl(rawUrl, siteUrl)}${suffix}`
	})

	return output
}

export function createCrosspostDocument(input: CrosspostInput, platform: CrosspostPlatform, siteUrl: string): CrosspostDocument {
	const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
	const sourceUrl = `${normalizedSiteUrl}/blog/${encodeURIComponent(input.slug)}`
	const body = absolutizeMarkdown(input.markdown.trim(), normalizedSiteUrl)
	const sourceNote = `> 本文首发于 [KID 的个人博客](${sourceUrl})，同步到${platform === 'csdn' ? ' CSDN' : '稀土掘金'}。`

	return {
		platform,
		title: input.title.trim(),
		markdown: `${sourceNote}\n\n${body}\n`,
		tags: [...new Set((input.tags || []).map(tag => tag.trim()).filter(Boolean))].slice(0, 5),
		sourceUrl,
		editorUrl: PLATFORM_EDITORS[platform]
	}
}
