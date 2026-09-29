'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { toast } from 'sonner'
import { SITE_URL } from '@/consts'
import { createCrosspostDocument, type CrosspostPlatform } from '@/lib/crosspost'
import { useWriteStore } from '../stores/write-store'

type CrosspostDialogProps = {
	open: boolean
	onClose: () => void
}

const PLATFORM_NAMES: Record<CrosspostPlatform, string> = {
	csdn: 'CSDN',
	juejin: '稀土掘金'
}

export function CrosspostDialog({ open, onClose }: CrosspostDialogProps) {
	const { form } = useWriteStore()
	const [platform, setPlatform] = useState<CrosspostPlatform>('csdn')
	const document = useMemo(
		() =>
			createCrosspostDocument(
				{
					slug: form.slug,
					title: form.title,
					markdown: form.md,
					tags: form.tags,
					summary: form.summary
				},
				platform,
				SITE_URL
			),
		[form.md, form.slug, form.summary, form.tags, form.title, platform]
	)

	if (!open) return null

	const copy = async (value: string, label: string) => {
		await navigator.clipboard.writeText(value)
		toast.success(`${label}已复制`)
	}

	const copyAndOpen = async () => {
		if (!document.title || !form.slug || !document.markdown.trim()) {
			toast.error('请先填写标题、slug 和正文')
			return
		}
		await copy(document.markdown, `${PLATFORM_NAMES[platform]} 文章`)
		window.open(document.editorUrl, '_blank', 'noopener,noreferrer')
		toast.info('编辑器已打开，粘贴正文并先保存为草稿')
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4' onMouseDown={onClose}>
			<div className='bg-card w-full max-w-3xl rounded-2xl border p-6 shadow-2xl' onMouseDown={event => event.stopPropagation()}>
				<div className='mb-5 flex items-start justify-between gap-4'>
					<div>
						<h2 className='text-xl font-semibold'>多平台同步</h2>
						<p className='mt-1 text-sm text-neutral-500'>图片和文内链接已转换为公网绝对地址；默认先保存草稿，检查后再发布。</p>
					</div>
					<button type='button' aria-label='关闭' className='rounded-lg p-2 hover:bg-black/5' onClick={onClose}>
						<X className='size-5' />
					</button>
				</div>

				<div className='mb-4 flex gap-2'>
					{(['csdn', 'juejin'] as const).map(item => (
						<button
							key={item}
							type='button'
							className={`rounded-xl border px-4 py-2 text-sm ${platform === item ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
							onClick={() => setPlatform(item)}>
							{PLATFORM_NAMES[item]}
						</button>
					))}
				</div>

				<div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
					<div className='rounded-xl border p-4'>
						<div className='text-xs text-neutral-500'>标题</div>
						<div className='mt-1 font-medium'>{document.title || '未填写'}</div>
					</div>
					<button type='button' className='rounded-xl border px-4 py-2 text-sm' onClick={() => copy(document.title, '标题')}>
						复制标题
					</button>
					<div className='rounded-xl border p-4'>
						<div className='text-xs text-neutral-500'>标签（最多 5 个）</div>
						<div className='mt-1 text-sm'>{document.tags.join('、') || '无'}</div>
					</div>
					<button type='button' className='rounded-xl border px-4 py-2 text-sm' onClick={() => copy(document.tags.join(','), '标签')}>
						复制标签
					</button>
				</div>

				<textarea readOnly value={document.markdown} className='mt-4 h-72 w-full resize-none rounded-xl border bg-black/[0.02] p-4 font-mono text-xs' />

				<div className='mt-5 flex flex-wrap justify-end gap-2'>
					<button type='button' className='rounded-xl border px-4 py-2 text-sm' onClick={() => copy(document.markdown, '文章')}>
						仅复制文章
					</button>
					<button type='button' className='brand-btn flex items-center gap-2 px-5' onClick={copyAndOpen}>
						复制并打开 {PLATFORM_NAMES[platform]}
						<ExternalLink className='size-4' />
					</button>
				</div>
			</div>
		</div>
	)
}
