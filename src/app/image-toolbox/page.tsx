'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'

type ConvertedMeta = {
	url: string
	size: number
}

type SelectedImage = {
	file: File
	preview: string
	converted?: ConvertedMeta
	converting?: boolean
}

const MAX_NAME_LENGTH = 32

function getFileExtension(name: string) {
	const idx = name.lastIndexOf('.')
	return idx >= 0 ? name.slice(idx) : ''
}

function formatFileName(name: string) {
	if (name.length <= MAX_NAME_LENGTH) return name
	const ext = getFileExtension(name)
	if (!ext) {
		return `${name.slice(0, MAX_NAME_LENGTH - 3)}...`
	}
	const maxBaseLength = Math.max(1, MAX_NAME_LENGTH - ext.length - 3)
	return `${name.slice(0, maxBaseLength)}...${ext}`
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes.toFixed(0)} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function fileToWebp(file: File, quality: number) {
	const bitmap = await createImageBitmap(file)
	const canvas = document.createElement('canvas')
	canvas.width = bitmap.width
	canvas.height = bitmap.height
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('无法初始化画布')
	ctx.drawImage(bitmap, 0, 0)
	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			result => {
				if (result) resolve(result)
				else reject(new Error('无法生成 WEBP 文件'))
			},
			'image/webp',
			quality
		)
	})
	return blob
}

export default function Page() {
	const [images, setImages] = useState<SelectedImage[]>([])
	const [quality, setQuality] = useState(0.8)
	const [batchConverting, setBatchConverting] = useState(false)
	const hasImages = images.length > 0
	const hasConvertible = images.length > 0
	const hasConverted = images.some(item => !!item.converted)
	const imagesRef = useRef<SelectedImage[]>([])

	useEffect(() => {
		imagesRef.current = images
	}, [images])

	const handleFiles = useCallback((fileList: FileList | null) => {
		if (!fileList?.length) return
		const nextItems = Array.from(fileList)
			.filter(file => file.type.startsWith('image/'))
			.map(file => ({
				file,
				preview: URL.createObjectURL(file)
			}))

		if (!nextItems.length) return

		setImages(prev => {
			const deduped = [...prev]
			nextItems.forEach(item => {
				const exists = deduped.some(existing => {
					return existing.file.name === item.file.name && existing.file.size === item.file.size && existing.file.lastModified === item.file.lastModified
				})

				if (!exists) {
					deduped.push(item)
				} else {
					URL.revokeObjectURL(item.preview)
				}
			})
			return deduped
		})
	}, [])

	const totalSize = useMemo(() => {
		const bytes = images.reduce((acc, item) => acc + item.file.size, 0)
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`
	}, [images])

	const handleConvertImage = useCallback(
		async (index: number) => {
			const target = images[index]
			if (!target || target.converting) return
			setImages(prev => prev.map((item, idx) => (idx === index ? { ...item, converting: true } : item)))
			try {
				const blob = await fileToWebp(target.file, quality)
				const url = URL.createObjectURL(blob)
				setImages(prev =>
					prev.map((item, idx) => {
						if (idx !== index) return item
						if (item.converted?.url) {
							URL.revokeObjectURL(item.converted.url)
						}
						return {
							...item,
							converting: false,
							converted: {
								url,
								size: blob.size
							}
						}
					})
				)
			} catch (error) {
				console.error(error)
				alert('转换过程中出现问题，请稍后再试')
				setImages(prev => prev.map((item, idx) => (idx === index ? { ...item, converting: false } : item)))
			}
		},
		[images, quality]
	)

	const handleDownloadImage = useCallback(
		(index: number) => {
			const target = images[index]
			if (!target?.converted) return
			const link = document.createElement('a')
			const baseName = target.file.name.replace(/\.[^.]+$/, '')
			link.href = target.converted.url
			link.download = `${baseName}.webp`
			document.body.appendChild(link)
			link.click()
			link.remove()
		},
		[images]
	)

	const handleConvertAll = useCallback(async () => {
		if (!hasImages || batchConverting) return
		setBatchConverting(true)
		try {
			for (let i = 0; i < imagesRef.current.length; i += 1) {
				const current = imagesRef.current[i]
				if (!current) continue
				setImages(prev => prev.map((item, idx) => (idx === i ? { ...item, converting: true } : item)))
				const blob = await fileToWebp(current.file, quality)
				const url = URL.createObjectURL(blob)
				setImages(prev =>
					prev.map((item, idx) => {
						if (idx !== i) return item
						if (item.converted?.url) {
							URL.revokeObjectURL(item.converted.url)
						}
						return {
							...item,
							converting: false,
							converted: {
								url,
								size: blob.size
							}
						}
					})
				)
			}
		} catch (error) {
			console.error(error)
			alert('批量转换过程中出现问题，请稍后再试')
		} finally {
			setBatchConverting(false)
		}
	}, [batchConverting, hasImages, quality])

	const handleDownloadAll = useCallback(() => {
		if (!hasConverted) return
		images.forEach(item => {
			if (!item.converted) return
			const link = document.createElement('a')
			const baseName = item.file.name.replace(/\.[^.]+$/, '')
			link.href = item.converted.url
			link.download = `${baseName}.webp`
			document.body.appendChild(link)
			link.click()
			link.remove()
		})
	}, [images, hasConverted])

	const handleRemoveImage = useCallback((index: number) => {
		setImages(prev => {
			const next = [...prev]
			const removed = next.splice(index, 1)[0]
			if (removed) {
				URL.revokeObjectURL(removed.preview)
				if (removed.converted?.url) {
					URL.revokeObjectURL(removed.converted.url)
				}
			}
			return next
		})
	}, [])

	useEffect(() => {
		return () => {
			imagesRef.current.forEach(item => {
				URL.revokeObjectURL(item.preview)
				if (item.converted?.url) {
					URL.revokeObjectURL(item.converted.url)
				}
			})
		}
	}, [])

	return (
		<div className='relative px-6 pt-32 pb-12 text-sm max-sm:pt-28'>
			<div className='mx-auto flex max-w-3xl flex-col gap-6'>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY }}
					className='space-y-2 text-center'>
					<p className='text-secondary text-xs tracking-[0.2em] uppercase'>Image Toolbox</p>
					<h1 className='text-2xl font-semibold'>PNG / JPG 转 WEBP</h1>
					<p className='text-secondary'>选择图片 → 调整质量 → 一键转换下载</p>
				</motion.div>

				<motion.label
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY }}
					className='group hover:border-brand/20 card relative flex cursor-pointer flex-col items-center justify-center gap-3 text-center transition-colors hover:bg-white/80'>
					<input type='file' accept='image/*' multiple className='hidden' onChange={event => handleFiles(event.target.files)} />
					<div className='bg-brand/10 text-brand/60 group-hover:bg-brand/10 flex h-20 w-20 items-center justify-center rounded-full text-3xl transition'>
						📷
					</div>
					<div>
						<p className='text-base font-medium'>点击或拖拽图片</p>
						<p className='text-secondary text-xs'>支持 PNG、JPG、JPEG、HEIC 等常见格式</p>
					</div>
				</motion.label>

				{hasImages ? (
					<div className='card relative'>
						<div className='text-secondary flex items-center justify-between border-b border-slate-200 pb-3 text-xs tracking-[0.2em] uppercase'>
							<span>已选择 {images.length} 张图片</span>
							<span>{totalSize}</span>
						</div>
						<ul className='divide-y divide-slate-200'>
							{images.map((item, index) => {
								const { file, preview, converted, converting } = item
								return (
									<li key={`${file.name}-${index}`} className='flex items-center gap-4 py-3'>
										<div className='h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50'>
											<img src={preview} alt={file.name} className='h-full w-full object-cover' />
										</div>
										<div className='flex flex-1 flex-col'>
											<p className='font-medium'>{formatFileName(file.name)}</p>
											<p className='text-secondary text-xs'>
												{formatBytes(file.size)}
												{converted ? `（转换后 ${formatBytes(converted.size)}）` : ''}
											</p>
										</div>
										<div className='flex flex-wrap justify-end gap-2 text-xs'>
											<button
												onClick={() => handleConvertImage(index)}
												disabled={!!converting}
												className='rounded-full px-3 py-1 font-medium transition disabled:cursor-not-allowed disabled:text-slate-300'>
												{converting ? '转换中...' : converted ? '重新转换' : '转换'}
											</button>
											{converted ? (
												<button
													onClick={() => handleDownloadImage(index)}
													className='border-brand text-brand hover:bg-brand/10 rounded-full border px-3 py-1 font-semibold transition'>
													下载
												</button>
											) : null}
											<button
												onClick={() => handleRemoveImage(index)}
												className='rounded-full border border-red-200 px-3 py-1 font-medium text-rose-400 transition hover:bg-rose-50'>
												移除
											</button>
										</div>
									</li>
								)
							})}
						</ul>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: INIT_DELAY + 2 * ANIMATION_DELAY }}
						className='text-secondary card relative border-slate-200 text-center'>
						暂无图片，先选择文件开始转换
					</motion.div>
				)}

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: INIT_DELAY + 3 * ANIMATION_DELAY }}
					className='card relative'>
					<div className='flex flex-wrap items-center gap-4'>
						<div className='flex-1'>
							<p className='text-secondary text-xs tracking-[0.2em] uppercase'>质量</p>
							<div className='flex items-center gap-3 pt-2'>
								<input
									type='range'
									min={0.3}
									max={1}
									step={0.05}
									value={quality}
									onChange={event => setQuality(parseFloat(event.target.value))}
									className='range-track'
								/>
								<span className='w-12 text-right text-sm font-medium'>{Math.round(quality * 100)}%</span>
							</div>
							<p className='text-xs text-slate-500'>使用 canvas.toDataURL('image/webp', {quality.toFixed(2)})</p>
						</div>
						<div className='flex flex-wrap gap-2 text-sm'>
							<button
								onClick={handleConvertAll}
								disabled={!hasConvertible || batchConverting}
								className='rounded-full border border-slate-200 px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300'>
								{batchConverting ? '全部转换中…' : '全部转换'}
							</button>
							<button
								onClick={handleDownloadAll}
								disabled={!hasConverted}
								className='border-brand text-brand rounded-full border px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300'>
								全部下载
							</button>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	)
}
