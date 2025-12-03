'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useCenterInit, useCenterStore } from '@/hooks/use-center'
import { Picture } from '../page'
import { cn, rand } from '@/lib/utils'
import siteContent from '@/config/site-content.json'

interface RandomLayoutProps {
	pictures: Picture[]
	isEditMode?: boolean
	onDeleteSingle?: (pictureId: string, imageIndex: number | 'single') => void
	onDeleteGroup?: (picture: Picture) => void
}

type PositionedItem = {
	x: number
	y: number
	rotation: number
}

type OriginalSize = {
	width: number
	height: number
}

interface FloatingImageProps {
	url: string
	index: number
	position: PositionedItem
	description?: string
	uploadedAt?: string
	pictureId: string
	imageIndex: number | 'single'
	isEditMode?: boolean
	onDeleteSingle?: (pictureId: string, imageIndex: number | 'single') => void
	onDeleteGroup?: () => void
}

type UrlItem = {
	url: string
	description?: string
	uploadedAt?: string
	pictureId: string
	imageIndex: number | 'single'
}

const buildUrlList = (pictures: Picture[]): UrlItem[] => {
	const result: UrlItem[] = []

	for (const picture of pictures) {
		if (picture.image) {
			result.push({
				url: picture.image,
				description: picture.description,
				uploadedAt: picture.uploadedAt,
				pictureId: picture.id,
				imageIndex: 'single'
			})
		}

		if (picture.images && picture.images.length > 0) {
			result.push(
				...picture.images.map((url, index) => ({
					url,
					description: picture.description,
					uploadedAt: picture.uploadedAt,
					pictureId: picture.id,
					imageIndex: index
				}))
			)
		}
	}

	return result
}

let lastZIndex = 10
const TOP_Z_INDEX = 9999

const formatUploadedAt = (uploadedAt?: string) => {
	if (!uploadedAt) return ''
	const date = new Date(uploadedAt)
	if (Number.isNaN(date.getTime())) return uploadedAt

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${year}-${month}-${day} ${hours}:${minutes}`
}

const FloatingImage = ({
	url,
	index,
	position,
	description,
	uploadedAt,
	pictureId,
	imageIndex,
	isEditMode,
	onDeleteSingle,
	onDeleteGroup
}: FloatingImageProps) => {
	const { centerX, centerY, width, height } = useCenterStore()
	const bodyRef = useRef(document.body)
	const mouseDownTimeRef = useRef<number | null>(null)
	const [zIndex, setZIndex] = useState(index)
	const [show, setShow] = useState(false)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [isHovered, setIsHovered] = useState(false)
	useEffect(() => {
		setTimeout(() => {
			setShow(true)
		}, 200 * index)
	}, [])

	const [originalSize, setOriginalSize] = useState<OriginalSize | null>(null)

	const displaySize = useMemo(() => {
		if (!originalSize) {
			return { width: 200, height: 200 }
		}

		const ratio = originalSize.width / originalSize.height
		const minRatio = 2 / 3
		const maxRatio = 3 / 2
		const clampedRatio = Math.min(Math.max(ratio, minRatio), maxRatio)

		const baseWidth = 200

		return {
			width: baseWidth,
			height: baseWidth / clampedRatio
		}
	}, [originalSize])

	const zoomedSize = useMemo(() => {
		if (!originalSize) {
			return { width: 200, height: 200 }
		}

		if (typeof window === 'undefined') {
			return originalSize
		}

		const padding = 24
		const maxWidth = window.innerWidth - padding * 2
		const maxHeight = window.innerHeight - padding * 2

		const scale = Math.min(maxWidth / originalSize.width, maxHeight / originalSize.height, 1)

		return {
			width: originalSize.width * scale,
			height: originalSize.height * scale
		}
	}, [originalSize])

	const [isZoomed, setIsZoomed] = useState(false)
	const dragStartOffsetRef = useRef({ x: 0, y: 0 })

	if (!position || !show) return null

	return (
		<>
			{isZoomed && (
				<motion.div
					onClick={() => {
						setIsZoomed(false)
					}}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					style={{ zIndex: TOP_Z_INDEX }}
					className='bg-card fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl'
				/>
			)}
			<motion.div
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				drag={!isZoomed}
				dragConstraints={bodyRef}
				dragMomentum={false}
				onDragStart={() => {
					if (!isZoomed) {
						dragStartOffsetRef.current = { ...dragOffset }
					}
				}}
				onDragEnd={(_, info) => {
					if (!isZoomed) {
						setDragOffset({
							x: dragStartOffsetRef.current.x + info.offset.x,
							y: dragStartOffsetRef.current.y + info.offset.y
						})
					}
				}}
				initial={{
					zIndex,
					left: centerX + position.x,
					top: centerY + position.y,
					rotate: position.rotation,
					scale: 0.6,
					opacity: 0,
					x: 0,
					y: 0
				}}
				animate={
					isZoomed
						? {
								zIndex: TOP_Z_INDEX,
								left: centerX,
								top: centerY,
								rotate: 0,
								scale: 1,
								opacity: 1,
								x: 0,
								y: 0
							}
						: {
								zIndex,
								scale: 1,
								opacity: 1,
								left: centerX + position.x,
								top: centerY + position.y,
								rotate: position.rotation,
								x: dragOffset.x,
								y: dragOffset.y
							}
				}
				transition={
					isZoomed
						? {
								rotate: { type: 'tween', ease: 'easeOut' },
								x: { type: 'tween', ease: 'easeOut' },
								y: { type: 'tween', ease: 'easeOut' }
							}
						: {
								x: { type: 'tween', ease: 'easeOut' },
								y: { type: 'tween', ease: 'easeOut' }
							}
				}
				className='pointer-events-auto absolute -translate-1/2'>
				<motion.img
					initial={{
						width: displaySize.width,
						height: displaySize.height,
						borderWidth: 8
					}}
					animate={
						isZoomed
							? {
									width: zoomedSize.width,
									height: zoomedSize.height,
									borderWidth: 24
								}
							: {
									width: displaySize.width,
									height: displaySize.height,
									borderWidth: 8
								}
					}
					src={url}
					onLoad={event => {
						const img = event.currentTarget
						setOriginalSize({ width: img.naturalWidth, height: img.naturalHeight })
					}}
					onMouseDown={event => {
						lastZIndex = lastZIndex + 1
						setZIndex(lastZIndex)
						mouseDownTimeRef.current = event.timeStamp
					}}
					onMouseUp={event => {
						if (mouseDownTimeRef.current !== null) {
							const duration = event.timeStamp - mouseDownTimeRef.current
							if (duration <= 150) {
								setIsZoomed(true)
							}
						}
						mouseDownTimeRef.current = null
					}}
					draggable={false}
					className='cursor-pointer rounded border-8 object-cover shadow-xl select-none'
				/>
				{isEditMode && isHovered && !isZoomed && (
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={e => {
							e.stopPropagation()
							onDeleteSingle?.(pictureId, imageIndex)
						}}
						className='absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 shadow-lg transition-colors hover:bg-red-600'
						style={{ zIndex: 1 }}>
						<svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
						</svg>
					</motion.button>
				)}
			</motion.div>

			{isZoomed && description && (
				<motion.div
					drag
					dragConstraints={bodyRef}
					dragMomentum={false}
					className='fixed min-h-[150px] w-[200px] cursor-pointer p-6 shadow'
					style={{
						backgroundColor: siteContent.backgroundColors[index % siteContent.backgroundColors.length],
						zIndex: TOP_Z_INDEX + 1,
						right: centerX / 3,
						top: centerY
					}}
					initial={{ opacity: 0, scale: 0.4 }}
					animate={{ opacity: 1, scale: 1 }}>
					<div className='text-secondary mb-2 text-xs'>{formatUploadedAt(uploadedAt)}</div>
					<div className='text-sm'>{description}</div>
				</motion.div>
			)}
		</>
	)
}

// 使用 ref 存储稳定的位置映射
const positionCacheRef = new Map<string, PositionedItem>()

// 基于唯一标识生成稳定的位置
const getStablePosition = (uniqueId: string, totalCount: number, width: number, height: number): PositionedItem => {
	// 如果已有缓存，直接返回
	if (positionCacheRef.has(uniqueId)) {
		return positionCacheRef.get(uniqueId)!
	}

	// 使用 uniqueId 的哈希值来生成稳定的索引
	let hash = 0
	for (let i = 0; i < uniqueId.length; i++) {
		const char = uniqueId.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	const stableIndex = Math.abs(hash) % 10000

	const maxRadius = Math.min(width, height) / 2 - 100
	const goldenAngle = Math.PI * (3 - Math.sqrt(5))

	// 使用稳定索引来计算位置，而不是数组索引
	const t = (stableIndex % 1000) / 1000
	const radius = Math.pow(t, 0.8) * maxRadius
	const angle = stableIndex * goldenAngle

	const baseX = radius * Math.cos(angle)
	const baseY = radius * Math.sin(angle)

	// 使用 uniqueId 生成稳定的 jitter，确保每次都是相同的位置
	const jitterSeed = Math.abs(hash) % 1000
	const jitterRadius = 12
	const jitterX = (jitterSeed % (jitterRadius * 2)) - jitterRadius
	const jitterY = ((jitterSeed * 7) % (jitterRadius * 2)) - jitterRadius

	const rotation = ((jitterSeed * 13) % 60) - 30

	const position = {
		x: baseX + jitterX,
		y: baseY + jitterY,
		rotation
	}

	// 缓存位置
	positionCacheRef.set(uniqueId, position)
	return position
}

export const RandomLayout = ({ pictures, isEditMode = false, onDeleteSingle, onDeleteGroup }: RandomLayoutProps) => {
	useCenterInit()
	const { width, height } = useCenterStore()
	const [show, setShow] = useState(false)

	useEffect(() => {
		setTimeout(() => {
			setShow(true)
		}, 1000)
	}, [])

	const urls = useMemo(() => buildUrlList(pictures), [pictures])

	// 清理已删除图片的位置缓存
	useEffect(() => {
		const currentIds = new Set(urls.map(item => `${item.pictureId}::${item.imageIndex}`))
		for (const key of positionCacheRef.keys()) {
			if (!currentIds.has(key)) {
				positionCacheRef.delete(key)
			}
		}
	}, [urls])

	const pictureMap = useMemo(() => {
		const map = new Map<string, Picture>()
		pictures.forEach(picture => {
			map.set(picture.id, picture)
		})
		return map
	}, [pictures])

	if (!urls.length || !width || !height) {
		return null
	}

	if (!show) return null

	lastZIndex = urls.length + 11

	return (
		<>
			{urls.map((item, index) => {
				const picture = pictureMap.get(item.pictureId)
				const uniqueId = `${item.pictureId}::${item.imageIndex}`
				const position = getStablePosition(uniqueId, urls.length, width, height)

				return (
					<FloatingImage
						key={uniqueId}
						url={item.url}
						index={index}
						position={position}
						description={item.description}
						uploadedAt={item.uploadedAt}
						pictureId={item.pictureId}
						imageIndex={item.imageIndex}
						isEditMode={isEditMode}
						onDeleteSingle={onDeleteSingle}
						onDeleteGroup={picture ? () => onDeleteGroup?.(picture) : undefined}
					/>
				)
			})}
		</>
	)
}
