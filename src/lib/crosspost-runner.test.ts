import assert from 'node:assert/strict'
import test from 'node:test'
// Node's built-in TypeScript runner needs the explicit extension.
// @ts-expect-error allowImportingTsExtensions is intentionally not enabled for the app build.
import { contentHash, extractChangedSlugs } from '../../scripts/crosspost/core.ts'

test('只提取真正发生文章正文或配置变化的 slug', () => {
	assert.deepEqual(
		extractChangedSlugs([
			'public/blogs/demo/index.md',
			'public\\blogs\\demo\\config.json',
			'public/blogs/another/image.png',
			'public/blogs/index.json',
			'src/app/page.tsx'
		]),
		['demo']
	)
})

test('平台和文章内容共同决定同步哈希', () => {
	const article = { slug: 'demo', title: '标题', markdown: '# 正文', tags: ['测试'] }
	const csdn = contentHash(article, 'csdn', 'https://example.com')
	assert.equal(csdn, contentHash(article, 'csdn', 'https://example.com/'))
	assert.notEqual(csdn, contentHash(article, 'juejin', 'https://example.com'))
	assert.notEqual(csdn, contentHash({ ...article, markdown: '# 新正文' }, 'csdn', 'https://example.com'))
})
