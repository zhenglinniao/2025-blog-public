import assert from 'node:assert/strict'
import test from 'node:test'
// Node's built-in TypeScript runner needs the explicit extension.
// @ts-expect-error allowImportingTsExtensions is intentionally not enabled for the app build.
import { filterMissingDeletions, normalizeTreeItems } from './github-tree.ts'

test('规范化 GitHub 路径并去除重复项', () => {
	const result = normalizeTreeItems([
		{ path: '/src\\config.json', mode: '100644', type: 'blob', sha: 'first' },
		{ path: 'src/config.json', mode: '100644', type: 'blob', sha: 'second' }
	])
	assert.deepEqual(result, [{ path: 'src/config.json', mode: '100644', type: 'blob', sha: 'second' }])
})

test('同一路径同时删除和上传时保留新文件', () => {
	const result = normalizeTreeItems([
		{ path: 'public/image.png', mode: '100644', type: 'blob', sha: 'new-file' },
		{ path: 'public/image.png', mode: '100644', type: 'blob', sha: null }
	])
	assert.equal(result.length, 1)
	assert.equal(result[0].sha, 'new-file')
})

test('拒绝越界路径', () => {
	assert.throws(() => normalizeTreeItems([{ path: '../secret', mode: '100644', type: 'blob', sha: 'x' }]), /路径无效/)
})

test('跳过 GitHub 树中已不存在的删除项', () => {
	const result = filterMissingDeletions(
		[
			{ path: 'exists.png', mode: '100644', type: 'blob', sha: null },
			{ path: 'missing.png', mode: '100644', type: 'blob', sha: null },
			{ path: 'new.png', mode: '100644', type: 'blob', sha: 'new-file' }
		],
		new Set(['exists.png'])
	)
	assert.deepEqual(
		result.map(item => item.path),
		['exists.png', 'new.png']
	)
})
