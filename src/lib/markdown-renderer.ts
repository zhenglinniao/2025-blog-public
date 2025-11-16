import { marked } from 'marked'
import type { Tokens } from 'marked'
import { codeToHtml } from 'shiki'

export type TocItem = { id: string; text: string; level: number }

export interface MarkdownRenderResult {
	html: string
	toc: TocItem[]
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
}

export async function renderMarkdown(markdown: string): Promise<MarkdownRenderResult> {
	// Parse TOC from markdown
	const toc: TocItem[] = []
	for (const line of markdown.split('\n')) {
		const m = /^(#{1,3})\s+(.+)$/.exec(line.trim())
		if (m) {
			const level = m[1].length
			const text = m[2].trim()
			const id = slugify(text)
			toc.push({ id, text, level })
		}
	}

	// Pre-process code blocks with Shiki
	const codeBlockMap = new Map<string, string>()
	const tokens = marked.lexer(markdown)

	for (const token of tokens) {
		if (token.type === 'code') {
			const codeToken = token as Tokens.Code
			try {
				const html = await codeToHtml(codeToken.text, {
					lang: codeToken.lang || 'text',
					theme: 'one-light'
				})
				const key = `__SHIKI_CODE_${codeBlockMap.size}__`
				codeBlockMap.set(key, html)
				codeToken.text = key
			} catch {
				// Keep original if highlighting fails
			}
		}
	}

	// Render HTML with heading ids
	const renderer = new marked.Renderer()

	renderer.heading = (token: Tokens.Heading) => {
		const id = slugify(token.text || '')
		return `<h${token.depth} id="${id}">${token.text}</h${token.depth}>`
	}

	renderer.code = (token: Tokens.Code) => {
		// Check if this code block was pre-processed
		const highlighted = codeBlockMap.get(token.text)
		if (highlighted) {
			return highlighted
		}
		// Fallback to default
		return `<pre><code>${token.text}</code></pre>`
	}

	renderer.listitem = (token: Tokens.ListItem) => {
		// Render inline markdown inside list items (e.g. links, emphasis)
		const inner = token.tokens ? (marked.parser(token.tokens) as string) : token.text

		if (token.task) {
			const checkbox = token.checked ? '<input type="checkbox" checked disabled />' : '<input type="checkbox" disabled />'
			return `<li class="task-list-item">${checkbox} ${inner}</li>\n`
		}

		return `<li>${inner}</li>\n`
	}

	marked.use({
		renderer
	})
	const html = (marked.parser(tokens) as string) || ''

	return { html, toc }
}
