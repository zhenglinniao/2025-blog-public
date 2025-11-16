'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import ShortLineSVG from '@/svgs/short-line.svg'
import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useReadArticles } from '@/hooks/use-read-articles'
import JuejinSVG from '@/svgs/juejin.svg'

export default function BlogPage() {
	const { items, loading } = useBlogIndex()
	const { isRead } = useReadArticles()

	// Group by year and sort
	const groupedItems = items
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.reduce(
			(acc, item) => {
				const year = dayjs(item.date).format('YYYY')
				if (!acc[year]) {
					acc[year] = []
				}
				acc[year].push(item)
				return acc
			},
			{} as Record<string, BlogIndexItem[]>
		)

	const years = Object.keys(groupedItems).sort((a, b) => Number(b) - Number(a))

	if (items && items.length > 0)
		return (
			<div className='flex flex-col items-center justify-center gap-6 px-6 pt-32 pb-12 max-sm:pt-28'>
				<>
					{years.map((year, index) => (
						<motion.div
							key={year}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: INIT_DELAY + ANIMATION_DELAY * index }}
							className='card relative w-full max-w-[840px] space-y-6'>
							<div className='mb-3 flex items-center gap-3 text-base'>
								<div className='w-[44px] font-medium'>{year}</div>

								<div className='h-2 w-2 rounded-full bg-[#D9D9D9]'></div>

								<div className='text-secondary text-sm'>{groupedItems[year].length} 篇文章</div>
							</div>
							<div>
								{groupedItems[year].map(it => {
									const hasRead = isRead(it.slug)
									return (
										<Link href={`/blog/${it.slug}`} key={it.slug} className='group flex h-10 cursor-pointer items-center gap-3 py-3'>
											<span className='text-secondary w-[44px] shrink-0 text-sm font-medium'>{dayjs(it.date).format('MM-DD')}</span>

											<div className='relative flex h-2 w-2 items-center justify-center'>
												<div className='bg-secondary group-hover:bg-brand h-[5px] w-[5px] rounded-full transition-all group-hover:h-4'></div>
												<ShortLineSVG className='absolute bottom-4' />
											</div>
											<div className='group-hover:text-brand flex-1 truncate text-sm font-medium transition-all group-hover:translate-x-2'>
												{it.title || it.slug}
												{hasRead && <span className='text-secondary ml-2 text-xs'>[已阅读]</span>}
											</div>
											<div className='flex flex-wrap items-center gap-2 max-sm:hidden'>
												{(it.tags || []).map(t => (
													<span key={t} className='text-secondary text-sm'>
														#{t}
													</span>
												))}
											</div>
										</Link>
									)
								})}
							</div>
						</motion.div>
					))}
					{items.length > 0 && (
						<div className='text-center'>
							<motion.a
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								href='https://juejin.cn/user/2427311675422382/posts'
								target='_blank'
								className='card text-secondary static inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs'>
								<JuejinSVG className='h-4 w-4' />
								更多
							</motion.a>
						</div>
					)}
					{!loading && items.length === 0 && <div className='text-secondary py-6 text-center text-sm'>暂无文章</div>}
					{loading && <div className='text-secondary py-6 text-center text-sm'>加载中...</div>}
				</>
			</div>
		)

	return null
}
