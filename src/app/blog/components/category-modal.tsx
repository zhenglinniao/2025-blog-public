'use client'

import dayjs from 'dayjs'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { DialogModal } from '@/components/dialog-modal'

interface CategoryModalProps {
	open: boolean
	onClose: () => void
	categoryList: string[]
	newCategory: string
	onNewCategoryChange: (value: string) => void
	onAddCategory: () => void
	onRemoveCategory: (category: string) => void
	editableItems: BlogIndexItem[]
	onAssignCategory: (slug: string, category?: string) => void
}

export function CategoryModal({
	open,
	onClose,
	categoryList,
	newCategory,
	onNewCategoryChange,
	onAddCategory,
	onRemoveCategory,
	editableItems,
	onAssignCategory
}: CategoryModalProps) {
	return (
		<DialogModal open={open} onClose={onClose} className='card w-[720px] max-w-[90vw] rounded-2xl p-6'>
			<div className='mb-4 flex items-center justify-between'>
				<div className='text-lg font-semibold'>文章分类</div>
				<button onClick={onClose} className='text-secondary text-sm hover:text-brand'>
					关闭
				</button>
			</div>
			<div className='space-y-4'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
					<input
						value={newCategory}
						onChange={e => onNewCategoryChange(e.target.value)}
						placeholder='输入分类名称'
						className='w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand'
					/>
					<button onClick={onAddCategory} className='brand-btn whitespace-nowrap px-4 py-2 text-sm'>
						新增分类
					</button>
				</div>
				<div className='flex flex-wrap gap-2 rounded-lg bg-white/60 p-3 text-sm'>
					{categoryList.length === 0 ? (
						<span className='text-secondary'>暂无分类</span>
					) : (
						categoryList.map(cat => (
							<span key={cat} className='flex items-center gap-2 rounded-full border px-3 py-1'>
								{cat}
								<button onClick={() => onRemoveCategory(cat)} className='text-secondary text-xs hover:text-brand'>
									删除
								</button>
							</span>
						))
					)}
				</div>
				<div className='max-h-[360px] space-y-2 overflow-y-auto rounded-xl bg-white/60 p-3'>
					{editableItems.map(item => (
						<div key={item.slug} className='flex flex-col gap-2 rounded-lg border bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between'>
							<div className='text-sm font-medium'>
								{item.title || item.slug}
								<span className='text-secondary ml-2 text-xs'>{dayjs(item.date).format('YYYY-MM-DD')}</span>
							</div>
							<select
								value={item.category || ''}
								onChange={e => onAssignCategory(item.slug, e.target.value)}
								className='rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand'>
								<option value=''>未分类</option>
								{categoryList.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>
					))}
					{editableItems.length === 0 && <div className='text-secondary text-sm'>暂无文章</div>}
				</div>
			</div>
		</DialogModal>
	)
}

