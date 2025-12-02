'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useCenterInit, useCenterStore } from '@/hooks/use-center'
import { Picture } from '../page'
import { cn, rand } from '@/lib/utils'
import siteContent from '@/config/site-content.json'

interface RandomLayoutProps {
	pictures: Picture[]
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
}

type UrlItem = {
	url: string
	description?: string
	uploadedAt?: string
}

const buildUrlList = (pictures: Picture[]): UrlItem[] => {
	const result: UrlItem[] = []

	for (const picture of pictures) {
		if (picture.image) {
			result.push({
				url: picture.image,
				description: picture.description,
				uploadedAt: picture.uploadedAt
			})
		}

		if (picture.images && picture.images.length > 0) {
			result.push(
				...picture.images.map(url => ({
					url,
					description: picture.description,
					uploadedAt: picture.uploadedAt
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

const FloatingImage = ({ url, index, position, description, uploadedAt }: FloatingImageProps) => {
	const { centerX, centerY, width, height } = useCenterStore()
	const bodyRef = useRef(document.body)
	const mouseDownTimeRef = useRef<number | null>(null)
	const [zIndex, setZIndex] = useState(index)
	const [show, setShow] = useState(false)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
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
			<motion.img
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
					width: displaySize.width,
					height: displaySize.height,
					borderWidth: 8,
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
								width: zoomedSize.width,
								height: zoomedSize.height,
								borderWidth: 24,
								scale: 1,
								opacity: 1,
								x: 0,
								y: 0
							}
						: {
								zIndex,
								scale: 1,
								opacity: 1,
								width: displaySize.width,
								height: displaySize.height,
								left: centerX + position.x,
								top: centerY + position.y,
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
				className={'pointer-events-auto absolute -translate-1/2 cursor-pointer rounded border-8 object-cover shadow-xl select-none'}
			/>

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

export const RandomLayout = ({ pictures }: RandomLayoutProps) => {
	useCenterInit()
	const { width, height } = useCenterStore()
	const [show, setShow] = useState(false)

	useEffect(() => {
		setTimeout(() => {
			setShow(true)
		}, 1000)
	}, [])

	const urls = useMemo(() => buildUrlList(pictures), [pictures])
	const positions = useMemo(() => {
		if (!width || !height || !urls.length) return []

		const maxRadius = Math.min(width, height) / 2 - 100
		const goldenAngle = Math.PI * (3 - Math.sqrt(5))

		lastZIndex = urls.length + 11

		return urls.map((_, index) => {
			const t = (index + 1) / urls.length
			const radius = Math.pow(t, 0.8) * maxRadius
			const angle = index * goldenAngle

			const baseX = radius * Math.cos(angle)
			const baseY = radius * Math.sin(angle)

			const jitterRadius = 12
			const jitterX = rand(-jitterRadius, jitterRadius)
			const jitterY = rand(-jitterRadius, jitterRadius)

			const rotation = rand(-30, 30)

			return {
				x: baseX + jitterX,
				y: baseY + jitterY,
				rotation
			}
		})
	}, [urls, width, height])

	if (!urls.length || !width || !height) {
		return null
	}

	if (!show) return null

	return (
		<>
			{urls.map((item, index) => (
				<FloatingImage
					key={`${item.url}-${index}`}
					url={item.url}
					index={index}
					position={positions[index]}
					description={item.description}
					uploadedAt={item.uploadedAt}
				/>
			))}
		</>
	)
}
