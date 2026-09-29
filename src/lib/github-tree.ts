export type GitTreeItem = {
	path: string
	mode: '100644' | '100755' | '040000' | '160000' | '120000'
	type: 'blob' | 'tree' | 'commit'
	content?: string
	sha?: string | null
}

function normalizePath(path: string): string {
	const normalized = path
		.trim()
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\/{2,}/g, '/')
	if (!normalized || normalized === '.' || normalized.split('/').some(part => !part || part === '.' || part === '..')) {
		throw new Error(`GitHub 文件路径无效: ${path || '(空路径)'}`)
	}
	return normalized
}

/**
 * GitHub rejects trees containing duplicate paths. A replace operation may
 * legitimately produce both a deletion and an upload for the same path, so the
 * concrete file wins over the deletion while identical entries are collapsed.
 */
export function normalizeTreeItems<T extends GitTreeItem>(tree: T[]): T[] {
	const byPath = new Map<string, T>()

	for (const item of tree) {
		const path = normalizePath(item.path)
		if (item.content !== undefined && item.sha !== undefined) {
			throw new Error(`GitHub 文件不能同时提供 content 和 sha: ${path}`)
		}
		if (item.content === undefined && item.sha === undefined) {
			throw new Error(`GitHub 文件缺少 content 或 sha: ${path}`)
		}

		const normalized = { ...item, path }
		const existing = byPath.get(path)
		if (!existing || existing.sha === null || normalized.sha !== null) {
			byPath.set(path, normalized)
		}
	}

	return [...byPath.values()]
}

export function filterMissingDeletions<T extends GitTreeItem>(tree: T[], existingPaths: ReadonlySet<string>): T[] {
	return tree.filter(item => item.sha !== null || existingPaths.has(item.path))
}
