'use client'

import { motion } from 'motion/react'
import { projects } from './list'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import Link from 'next/link'

export default function Page() {
	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12'>
			<div className='grid w-full max-w-[1200px] grid-cols-2 gap-6 max-md:grid-cols-1'>
				{projects.map((project, index) => (
					<motion.div
						key={project.name}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: INIT_DELAY + ANIMATION_DELAY * index }}
						className='card relative flex flex-col gap-4'>
						<div className='flex items-start gap-4'>
							<img src={project.image} alt={project.name} className='h-16 w-16 shrink-0 rounded-xl object-cover' />
							<div className='flex-1'>
								<div className='flex items-center gap-2'>
									<h3 className='text-lg font-semibold'>{project.name}</h3>
									<span className='text-secondary text-sm'>{project.year}</span>
								</div>
								<div className='mt-2 flex flex-wrap gap-2'>
									{project.tags.map(tag => (
										<span key={tag} className='text-secondary rounded-lg bg-white/50 px-2 py-1 text-xs'>
											{tag}
										</span>
									))}
								</div>
							</div>
						</div>

						<p className='text-secondary text-sm leading-relaxed'>{project.description}</p>

						<div className='flex flex-wrap gap-2'>
							<Link
								href={project.url}
								target='_blank'
								rel='noopener noreferrer'
								className='rounded-lg border bg-white/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/80'>
								Website
							</Link>
							{project.github && (
								<Link
									href={project.github}
									target='_blank'
									rel='noopener noreferrer'
									className='rounded-lg border bg-white/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/80'>
									GitHub
								</Link>
							)}
							{project.npm && (
								<Link
									href={project.npm}
									target='_blank'
									rel='noopener noreferrer'
									className='rounded-lg border bg-white/50 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/80'>
									NPM
								</Link>
							)}
						</div>
					</motion.div>
				))}
			</div>
		</div>
	)
}
