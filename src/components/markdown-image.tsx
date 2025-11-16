'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

type MarkdownImageProps = {
	src: string
	alt?: string
	title?: string
}

export function MarkdownImage({ src, alt = '', title = '' }: MarkdownImageProps) {
	const [display, setDisplay] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (display) {
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					setDisplay(false)
				}
			}
			window.addEventListener('keydown', handleEsc)
			document.body.style.overflow = 'hidden'
			return () => {
				window.removeEventListener('keydown', handleEsc)
				document.body.style.overflow = ''
			}
		}
	}, [display])

	return (
		<>
			<img src={src} alt={alt} title={title} loading='lazy' onClick={() => setDisplay(true)} className='cursor-pointer transition-opacity hover:opacity-80' />
			{mounted &&
				createPortal(
					<AnimatePresence>
						{display && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className='fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-6 backdrop-blur-xl'
								onClick={() => setDisplay(false)}>
								<motion.img
									src={src}
									alt={alt}
									initial={{ scale: 0.9 }}
									animate={{ scale: 1 }}
									exit={{ scale: 0.9 }}
									transition={{ duration: 0.2 }}
									className='max-h-full max-w-full rounded-2xl object-contain'
									onClick={e => e.stopPropagation()}
								/>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body
				)}
		</>
	)
}
