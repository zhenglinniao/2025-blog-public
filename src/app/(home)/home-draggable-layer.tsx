'use client'

import { useRef, useCallback } from 'react'
import { useCenterStore } from '@/hooks/use-center'
import { useLayoutEditStore } from './stores/layout-edit-store'
import type { CardStyles } from './stores/config-store'

type CardKey = keyof CardStyles

interface HomeDraggableLayerProps {
	cardKey: CardKey
	x: number
	y: number
	width?: number
	height?: number
	children: React.ReactNode
}

interface DragState {
	dragging: boolean
	startX: number
	startY: number
	initialOffsetX: number
	initialOffsetY: number
}

export function HomeDraggableLayer({ cardKey, x, y, width, height, children }: HomeDraggableLayerProps) {
	const editing = useLayoutEditStore(state => state.editing)
	const setOffset = useLayoutEditStore(state => state.setOffset)
	const center = useCenterStore()
	const dragStateRef = useRef<DragState>({
		dragging: false,
		startX: 0,
		startY: 0,
		initialOffsetX: 0,
		initialOffsetY: 0
	})

	const handleMouseMove = useCallback(
		(event: MouseEvent) => {
			const state = dragStateRef.current
			if (!state.dragging) return

			const dx = event.clientX - state.startX
			const dy = event.clientY - state.startY

			const nextOffsetX = Math.round(state.initialOffsetX + dx)
			const nextOffsetY = Math.round(state.initialOffsetY + dy)

			setOffset(cardKey, nextOffsetX, nextOffsetY)
		},
		[cardKey, setOffset]
	)

	const handleTouchMove = useCallback(
		(event: TouchEvent) => {
			const touch = event.touches[0]
			if (!touch) return

			const state = dragStateRef.current
			if (!state.dragging) return

			const dx = touch.clientX - state.startX
			const dy = touch.clientY - state.startY

			const nextOffsetX = Math.round(state.initialOffsetX + dx)
			const nextOffsetY = Math.round(state.initialOffsetY + dy)

			setOffset(cardKey, nextOffsetX, nextOffsetY)
		},
		[cardKey, setOffset]
	)

	const handleEnd = useCallback(() => {
		dragStateRef.current.dragging = false
		window.removeEventListener('mousemove', handleMouseMove)
		window.removeEventListener('mouseup', handleEnd)
		window.removeEventListener('touchmove', handleTouchMove)
		window.removeEventListener('touchend', handleEnd)
		window.removeEventListener('touchcancel', handleEnd)
	}, [handleMouseMove, handleTouchMove])

	const startDrag = useCallback(
		(clientX: number, clientY: number) => {
			if (!editing) return

			const initialOffsetX = x - center.x
			const initialOffsetY = y - center.y

			dragStateRef.current = {
				dragging: true,
				startX: clientX,
				startY: clientY,
				initialOffsetX,
				initialOffsetY
			}

			window.addEventListener('mousemove', handleMouseMove)
			window.addEventListener('mouseup', handleEnd)
			window.addEventListener('touchmove', handleTouchMove)
			window.addEventListener('touchend', handleEnd)
			window.addEventListener('touchcancel', handleEnd)
		},
		[editing, x, y, center.x, center.y, handleMouseMove, handleEnd, handleTouchMove]
	)

	const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = event => {
		event.preventDefault()
		startDrag(event.clientX, event.clientY)
	}

	const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = event => {
		const touch = event.touches[0]
		if (!touch) return
		startDrag(touch.clientX, touch.clientY)
	}

	return (
		<>
			{editing && (
				<div
					className='border-brand/70 bg-brand/5 pointer-events-auto absolute z-40 cursor-move rounded-[40px] border border-dashed'
					style={{ left: x, top: y, width, height }}
					onMouseDown={handleMouseDown}
					onTouchStart={handleTouchStart}>
					<div className='pointer-events-none h-full w-full' />
				</div>
			)}
			{children}
		</>
	)
}
