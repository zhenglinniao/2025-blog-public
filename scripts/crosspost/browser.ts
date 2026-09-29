import fs from 'node:fs'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import type { CrosspostDocument, CrosspostPlatform } from '../../src/lib/crosspost'
import { authFile, ensurePrivateDirectories } from './storage'
import type { CrosspostRunnerConfig, PlatformSyncResult } from './types'

type Session = { browser: Browser; context: BrowserContext }

const EDITOR_URLS: Record<CrosspostPlatform, string> = {
	csdn: 'https://mp.csdn.net/mp_blog/creation/editor',
	juejin: 'https://juejin.cn/editor/drafts/new?v=2'
}

async function openSession(platform: CrosspostPlatform, config: CrosspostRunnerConfig, headed = false): Promise<Session> {
	ensurePrivateDirectories()
	const storage = authFile(platform)
	const browser = await chromium.launch({
		headless: headed ? false : config.headless,
		channel: process.env.CROSSPOST_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chrome')
	})
	const context = await browser.newContext({ storageState: fs.existsSync(storage) ? storage : undefined })
	context.setDefaultTimeout(config.timeoutMs)
	return { browser, context }
}

async function saveSession(platform: CrosspostPlatform, session: Session): Promise<void> {
	await session.context.storageState({ path: authFile(platform) })
	await session.browser.close()
}

async function setCodeMirror(page: Page, markdown: string): Promise<void> {
	const codeMirror = page.locator('.CodeMirror').first()
	await codeMirror.waitFor({ state: 'visible' })
	const updated = await codeMirror.evaluate((element, value) => {
		const editor = (element as HTMLElement & { CodeMirror?: { setValue: (content: string) => void; focus: () => void } }).CodeMirror
		if (!editor) return false
		editor.setValue(value)
		editor.focus()
		return true
	}, markdown)

	if (!updated) {
		const textarea = page.locator('.CodeMirror textarea').first()
		await textarea.click({ force: true })
		await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
		await page.keyboard.insertText(markdown)
	}
}

async function codeMirrorValue(page: Page): Promise<string> {
	return page.locator('.CodeMirror').first().evaluate(element => {
		const editor = (element as HTMLElement & { CodeMirror?: { getValue: () => string } }).CodeMirror
		return editor?.getValue() || ''
	})
}

function normalizeEditorText(value: string): string {
	return value.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim()
}

async function csdnEditor(context: BrowserContext, draftId?: string): Promise<Page> {
	const page = await context.newPage()
	if (draftId) {
		await page.goto(`https://editor.csdn.net/md?not_checkout=1&articleId=${encodeURIComponent(draftId)}`, { waitUntil: 'domcontentloaded' })
		return page
	}

	await page.goto(EDITOR_URLS.csdn, { waitUntil: 'domcontentloaded' })
	const switchButton = page.getByText('使用 MD 编辑器', { exact: true })
	if (!(await switchButton.isVisible().catch(() => false))) throw new Error('CSDN 登录已失效或编辑器结构已变化，请运行 pnpm crosspost:login -- --platform csdn')

	const newPage = context.waitForEvent('page', { timeout: 8000 }).catch(() => null)
	await switchButton.click()
	return (await newPage) || page
}

async function syncCsdn(context: BrowserContext, document: CrosspostDocument, draftId?: string): Promise<PlatformSyncResult> {
	const page = await csdnEditor(context, draftId)
	await page.waitForLoadState('domcontentloaded')
	const titleDisplay = page.locator('.article-bar__title-display')
	await titleDisplay.waitFor({ state: 'visible' }).catch(() => {
		throw new Error('无法打开 CSDN Markdown 编辑器，登录可能已失效')
	})
	const editor = page.locator('pre.editor__inner[contenteditable="true"]')
	await editor.waitFor({ state: 'visible' })
	if (draftId) {
		await page.waitForFunction(() => (globalThis.document.querySelector('pre.editor__inner')?.textContent || '').trim().length > 0)
	}
	await titleDisplay.click()
	const title = page.locator('input[placeholder*="请输入文章标题"]')
	await title.waitFor({ state: 'visible' })
	await title.fill(document.title)
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://editor.csdn.net' })
	await page.evaluate(value => navigator.clipboard.writeText(value), document.markdown)
	await editor.click()
	await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
	await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V')
	await page.waitForFunction(
		expected => (globalThis.document.querySelector('pre.editor__inner')?.textContent || '').includes(expected),
		document.markdown.trim().slice(0, 24)
	)

	await page.waitForURL(/articleId=\d+/, { timeout: 25000 }).catch(() => undefined)
	await page.getByRole('button', { name: /保存草稿/ }).click()
	await page.getByText('已成功保存至草稿箱').waitFor({ state: 'visible', timeout: 15000 }).catch(async () => {
		await page.getByText(/文章已保存/).waitFor({ state: 'visible' })
	})

	const id = new URL(page.url()).searchParams.get('articleId')
	if (!id) throw new Error('CSDN 已保存但没有返回草稿编号')
	if ((await title.inputValue()).trim() !== document.title || normalizeEditorText(await editor.innerText()) !== normalizeEditorText(document.markdown)) {
		throw new Error('CSDN 草稿保存后的内容校验失败')
	}

	return { draftId: id, url: page.url(), status: 'draft' }
}

async function syncJuejin(context: BrowserContext, document: CrosspostDocument, draftId?: string): Promise<PlatformSyncResult> {
	const page = await context.newPage()
	await page.goto(draftId ? `https://juejin.cn/editor/drafts/${encodeURIComponent(draftId)}` : EDITOR_URLS.juejin, { waitUntil: 'domcontentloaded' })
	const title = page.getByRole('textbox', { name: '输入文章标题...' })
	await title.waitFor({ state: 'visible' }).catch(() => {
		throw new Error('掘金登录已失效或编辑器结构已变化，请运行 pnpm crosspost:login -- --platform juejin')
	})
	if (draftId) {
		await page.locator('.CodeMirror').first().waitFor({ state: 'visible' })
		await page.waitForFunction(() => {
			const editor = (globalThis.document.querySelector('.CodeMirror') as (HTMLElement & { CodeMirror?: { getValue: () => string } }) | null)?.CodeMirror
			return Boolean(editor?.getValue().trim())
		})
	}
	await title.fill(document.title)
	await setCodeMirror(page, document.markdown)
	await page.waitForURL(/\/editor\/drafts\/\d+/, { timeout: 25000 })
	await page.getByText('保存成功').waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined)
	await page.waitForTimeout(2500)
	await page.reload({ waitUntil: 'domcontentloaded' })
	const reloadedTitle = page.getByRole('textbox', { name: '输入文章标题...' })
	await reloadedTitle.waitFor({ state: 'visible' })
	await page.locator('.CodeMirror').first().waitFor({ state: 'visible' })

	const id = page.url().match(/\/drafts\/(\d+)/)?.[1]
	if (!id) throw new Error('掘金已保存但没有返回草稿编号')
	if ((await reloadedTitle.inputValue()).trim() !== document.title || normalizeEditorText(await codeMirrorValue(page)) !== normalizeEditorText(document.markdown)) {
		throw new Error('掘金草稿保存后的内容校验失败')
	}

	return { draftId: id, url: page.url(), status: 'draft' }
}

export async function syncPlatform(
	platform: CrosspostPlatform,
	document: CrosspostDocument,
	config: CrosspostRunnerConfig,
	draftId?: string
): Promise<PlatformSyncResult> {
	const storage = authFile(platform)
	if (!fs.existsSync(storage)) throw new Error(`${platform} 尚未登录，请先运行 pnpm crosspost:login -- --platform ${platform}`)
	const session = await openSession(platform, config)
	try {
		return platform === 'csdn' ? await syncCsdn(session.context, document, draftId) : await syncJuejin(session.context, document, draftId)
	} finally {
		await saveSession(platform, session)
	}
}

export async function loginPlatform(platform: CrosspostPlatform, config: CrosspostRunnerConfig): Promise<void> {
	const session = await openSession(platform, config, true)
	try {
		const page = await session.context.newPage()
		await page.goto(EDITOR_URLS[platform], { waitUntil: 'domcontentloaded' })
		console.log(`请在浏览器中完成 ${platform === 'csdn' ? 'CSDN' : '掘金'} 登录，确认能看到文章编辑器后回到终端按回车。`)
		await new Promise<void>(resolve => process.stdin.once('data', () => resolve()))
	} finally {
		await saveSession(platform, session)
	}
}
