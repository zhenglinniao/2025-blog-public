import assert from 'node:assert/strict'
import test from 'node:test'
// Node's built-in TypeScript runner needs the explicit extension.
// @ts-expect-error allowImportingTsExtensions is intentionally not enabled for the app build.
import { absolutizeMarkdown, createCrosspostDocument } from './crosspost.ts'

test('converts relative Markdown and HTML media URLs', () => {
	const input = '![cover](/blogs/demo/a.png)\n\n[page](./docs)\n\n<img src="/blogs/demo/b.png">'
	const result = absolutizeMarkdown(input, 'https://example.com')
	assert.match(result, /https:\/\/example\.com\/blogs\/demo\/a\.png/)
	assert.match(result, /https:\/\/example\.com\/docs/)
	assert.match(result, /src="https:\/\/example\.com\/blogs\/demo\/b\.png"/)
})

test('keeps external and anchor URLs unchanged', () => {
	const input = '[external](https://example.org/a) [heading](#title)'
	assert.equal(absolutizeMarkdown(input, 'https://example.com'), input)
})

test('builds a platform document with source attribution and unique tags', () => {
	const result = createCrosspostDocument(
		{ slug: 'hello world', title: ' Hello ', markdown: 'content', tags: ['React', 'React', ' TypeScript '] },
		'juejin',
		'https://example.com/'
	)
	assert.equal(result.title, 'Hello')
	assert.deepEqual(result.tags, ['React', 'TypeScript'])
	assert.equal(result.sourceUrl, 'https://example.com/blog/hello%20world')
	assert.match(result.markdown, /本文首发/)
	assert.match(result.markdown, /稀土掘金/)
})
