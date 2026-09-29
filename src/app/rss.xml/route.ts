import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

import siteContent from '@/config/site-content.json'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'
import { SITE_URL } from '@/consts'
import { absolutizeMarkdown } from '@/lib/crosspost'

const FEED_PATH = '/rss.xml'
const SITE_ORIGIN = SITE_URL.replace(/\/$/, '')
const FEED_URL = `${SITE_ORIGIN}${FEED_PATH}`
const PUBLIC_DIR = path.join(process.cwd(), 'public')

const blogs = blogIndex as BlogIndexItem[]

const escapeXml = (value: string): string =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const wrapCdata = (value: string): string => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

const getExtension = (input: string): string | undefined => {
	const clean = input.split(/[?#]/)[0]
	return clean.split('.').pop()?.toLowerCase()
}

const getMimeTypeFromUrl = (url?: string): string | null => {
	if (!url) return null
	const ext = getExtension(url)
	if (!ext) return null
	if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
	if (ext === 'png') return 'image/png'
	if (ext === 'gif') return 'image/gif'
	if (ext === 'webp') return 'image/webp'
	if (ext === 'svg') return 'image/svg+xml'
	return null
}

const buildEnclosure = (cover?: string): string | null => {
	if (!cover) return null
	const absoluteUrl = /^https?:\/\//.test(cover) ? cover : `${SITE_ORIGIN}${cover}`
	const type = getMimeTypeFromUrl(absoluteUrl)
	if (!type) return null

	let length: number | null = null

	if (!/^https?:\/\//.test(cover)) {
		const filePath = path.join(PUBLIC_DIR, cover.replace(/^\/+/, ''))
		try {
			const stat = fs.statSync(filePath)
			if (stat.isFile()) {
				length = stat.size
			}
		} catch {
			length = null
		}
	}

	if (length === null) {
		return null
	}

	return `<enclosure url="${escapeXml(absoluteUrl)}" type="${type}" length="${length}" />`
}

const serializeItem = async (item: BlogIndexItem): Promise<string> => {
	const link = `${SITE_ORIGIN}/blog/${item.slug}`
	const title = escapeXml(item.title || item.slug)
	const description = wrapCdata(item.summary || '')
	const pubDate = new Date(item.date).toUTCString()
	const categories = (item.tags || [])
		.filter(Boolean)
		.map(tag => `<category>${escapeXml(tag)}</category>`)
		.join('')

	const enclosure = buildEnclosure(item.cover)
	const markdownPath = path.join(PUBLIC_DIR, 'blogs', item.slug, 'index.md')
	const markdown = await fs.promises.readFile(markdownPath, 'utf8')
	const content = await marked.parse(absolutizeMarkdown(markdown, SITE_ORIGIN))

	return `
		<item>
			<title>${title}</title>
			<link>${link}</link>
			<guid isPermaLink="false">${escapeXml(link)}</guid>
			<description>${description}</description>
			<content:encoded>${wrapCdata(content)}</content:encoded>
			<pubDate>${pubDate}</pubDate>
			${categories}
			${enclosure ?? ''}
		</item>`.trim()
}

export const dynamic = 'force-static'
export const revalidate = false

export async function GET(): Promise<Response> {
	const title = siteContent.meta?.title || '2025 Blog'
	const description = siteContent.meta?.description || 'Latest updates from 2025 Blog'

	const items = (await Promise.all(blogs.filter(item => item?.slug && !item.hidden).map(serializeItem))).join('')

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
	<channel xmlns:atom="http://www.w3.org/2005/Atom">
		<title>${escapeXml(title)}</title>
		<link>${SITE_ORIGIN}</link>
		<atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
		<description>${escapeXml(description)}</description>
		<language>zh-CN</language>
		<docs>https://www.rssboard.org/rss-specification</docs>
		<ttl>60</ttl>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		${items}
	</channel>
</rss>`

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=0, must-revalidate'
		}
	})
}
