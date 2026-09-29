'use client'

import { useAuthStore } from '@/hooks/use-auth'
import { KJUR, KEYUTIL } from 'jsrsasign'
import { filterMissingDeletions, normalizeTreeItems, type GitTreeItem } from './github-tree'

export const GH_API = 'https://api.github.com'

function handle401Error(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		useAuthStore.getState().clearAuth()
	} catch (error) {
		console.error('Failed to clear auth cache:', error)
	}
}

async function throwGitHubError(res: Response, action: string): Promise<never> {
	let detail = ''
	try {
		const data = await res.json()
		const errors = Array.isArray(data?.errors) ? data.errors.map((error: any) => error?.message || error?.code || JSON.stringify(error)).filter(Boolean) : []
		detail = [data?.message, ...errors].filter(Boolean).join('；')
	} catch {
		detail = await res.text().catch(() => '')
	}

	const suffix = detail ? `：${detail}` : ''
	throw new Error(`${action}失败 (${res.status})${suffix}`)
}

export function toBase64Utf8(input: string): string {
	return btoa(unescape(encodeURIComponent(input)))
}

export function signAppJwt(appId: string, privateKeyPem: string): string {
	const now = Math.floor(Date.now() / 1000)
	const header = { alg: 'RS256', typ: 'JWT' }
	const payload = { iat: now - 60, exp: now + 8 * 60, iss: appId }
	const prv = KEYUTIL.getKey(privateKeyPem) as unknown as string
	return KJUR.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), prv)
}

export async function getInstallationId(jwt: string, owner: string, repo: string): Promise<number> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/installation`, {
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '查询 GitHub App 安装信息')
	const data = await res.json()
	return data.id
}

export async function createInstallationToken(jwt: string, installationId: number): Promise<string> {
	const res = await fetch(`${GH_API}/app/installations/${installationId}/access_tokens`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '创建 GitHub 访问令牌')
	const data = await res.json()
	return data.token as string
}

export async function getFileSha(token: string, owner: string, repo: string, path: string, branch: string): Promise<string | undefined> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (res.status === 404) return undefined
	if (!res.ok) await throwGitHubError(res, '读取 GitHub 文件信息')
	const data = await res.json()
	return (data && data.sha) || undefined
}

export async function putFile(token: string, owner: string, repo: string, path: string, contentBase64: string, message: string, branch: string) {
	const sha = await getFileSha(token, owner, repo, path, branch)
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ message, content: contentBase64, branch, ...(sha ? { sha } : {}) })
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '更新 GitHub 文件')
	return res.json()
}

// Batch commit APIs

export async function getRef(token: string, owner: string, repo: string, ref: string): Promise<{ sha: string }> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/ref/${encodeURIComponent(ref)}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '读取 GitHub 分支')
	const data = await res.json()
	return { sha: data.object.sha }
}

export type TreeItem = GitTreeItem

export async function getCommitTreeSha(token: string, owner: string, repo: string, commitSha: string): Promise<string> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/commits/${encodeURIComponent(commitSha)}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '读取 GitHub 提交')
	const data = await res.json()
	if (!data?.tree?.sha) throw new Error('GitHub 提交中缺少 Tree SHA')
	return data.tree.sha as string
}

async function getTreePaths(token: string, owner: string, repo: string, treeSha: string): Promise<Set<string>> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '读取 GitHub 文件树')
	const data = await res.json()
	return new Set((Array.isArray(data?.tree) ? data.tree : []).map((item: any) => item?.path).filter(Boolean))
}

export async function createTree(token: string, owner: string, repo: string, tree: TreeItem[], baseCommitSha?: string): Promise<{ sha: string }> {
	let normalizedTree = normalizeTreeItems(tree)
	const baseTreeSha = baseCommitSha ? await getCommitTreeSha(token, owner, repo, baseCommitSha) : undefined
	if (baseTreeSha && normalizedTree.some(item => item.sha === null)) {
		const existingPaths = await getTreePaths(token, owner, repo, baseTreeSha)
		normalizedTree = filterMissingDeletions(normalizedTree, existingPaths)
	}
	if (normalizedTree.length === 0) throw new Error('没有需要保存的 GitHub 文件')
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/trees`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ tree: normalizedTree, ...(baseTreeSha ? { base_tree: baseTreeSha } : {}) })
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '创建 GitHub 文件树')
	const data = await res.json()
	return { sha: data.sha }
}

export async function createCommit(token: string, owner: string, repo: string, message: string, tree: string, parents: string[]): Promise<{ sha: string }> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/commits`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ message, tree, parents })
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '创建 GitHub 提交')
	const data = await res.json()
	return { sha: data.sha }
}

export async function updateRef(token: string, owner: string, repo: string, ref: string, sha: string, force = false): Promise<void> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/refs/${encodeURIComponent(ref)}`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ sha, force })
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '更新 GitHub 分支')
}

export async function readTextFileFromRepo(token: string, owner: string, repo: string, path: string, ref: string): Promise<string | null> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})
	if (res.status === 401) handle401Error()
	if (res.status === 404) return null
	if (!res.ok) await throwGitHubError(res, '读取 GitHub 文件')
	const data: any = await res.json()
	if (Array.isArray(data) || !data.content) return null
	try {
		return decodeURIComponent(escape(atob(data.content)))
	} catch {
		return atob(data.content)
	}
}

export async function listRepoFilesRecursive(token: string, owner: string, repo: string, path: string, ref: string): Promise<string[]> {
	async function fetchPath(targetPath: string): Promise<string[]> {
		const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}?ref=${encodeURIComponent(ref)}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		if (res.status === 401) handle401Error()
		if (res.status === 404) return []
		if (!res.ok) await throwGitHubError(res, '读取 GitHub 目录')
		const data: any = await res.json()
		if (Array.isArray(data)) {
			const files: string[] = []
			for (const item of data) {
				if (item.type === 'file') {
					files.push(item.path)
				} else if (item.type === 'dir') {
					const nested = await fetchPath(item.path)
					files.push(...nested)
				}
			}
			return files
		}
		if (data?.type === 'file') return [data.path]
		if (data?.type === 'dir') return fetchPath(data.path)
		return []
	}

	return fetchPath(path)
}

export async function createBlob(
	token: string,
	owner: string,
	repo: string,
	content: string,
	encoding: 'utf-8' | 'base64' = 'base64'
): Promise<{ sha: string }> {
	const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/blobs`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ content, encoding })
	})
	if (res.status === 401) handle401Error()
	if (!res.ok) await throwGitHubError(res, '创建 GitHub 文件内容')
	const data = await res.json()
	return { sha: data.sha }
}
