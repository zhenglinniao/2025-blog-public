'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { SiteContent } from '../../stores/config-store'

type SocialButtonType = 'github' | 'juejin' | 'email' | 'link'

interface SocialButtonConfig {
	id: string
	type: SocialButtonType
	value: string
	label?: string
	order: number
}

interface SocialButtonsSectionProps {
	formData: SiteContent
	setFormData: React.Dispatch<React.SetStateAction<SiteContent>>
}

export function SocialButtonsSection({ formData, setFormData }: SocialButtonsSectionProps) {
	const buttons = (formData.socialButtons || []) as SocialButtonConfig[]

	const handleAddButton = () => {
		const newId = `button-${Date.now()}`
		const newButton = {
			id: newId,
			type: 'link' as const,
			value: '',
			label: '',
			order: buttons.length + 1
		}
		setFormData(prev => ({
			...prev,
			socialButtons: [...(prev.socialButtons || []), newButton]
		}))
	}

	const handleUpdateButton = (id: string, updates: Partial<SocialButtonConfig>) => {
		setFormData(prev => ({
			...prev,
			socialButtons: (prev.socialButtons || []).map(btn => (btn.id === id ? { ...btn, ...updates, label: updates.label ?? btn.label ?? '' } : btn))
		}))
	}

	const handleRemoveButton = (id: string) => {
		setFormData(prev => ({
			...prev,
			socialButtons: (prev.socialButtons || []).filter(btn => btn.id !== id)
		}))
	}

	const handleMoveButton = (id: string, direction: 'up' | 'down') => {
		const currentIndex = buttons.findIndex(btn => btn.id === id)
		if (currentIndex === -1) return

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
		if (newIndex < 0 || newIndex >= buttons.length) return

		const newButtons = [...buttons]
		;[newButtons[currentIndex], newButtons[newIndex]] = [newButtons[newIndex], newButtons[currentIndex]]

		const updatedButtons = newButtons.map((btn, index) => ({
			...btn,
			order: index + 1,
			label: btn.label ?? ''
		}))

		setFormData(prev => ({
			...prev,
			socialButtons: updatedButtons
		}))
	}

	const sortedButtons = [...buttons].sort((a, b) => a.order - b.order)

	return (
		<div>
			<label className='mb-2 block text-sm font-medium'>社交按钮</label>
			{buttons.length === 0 && <p className='mb-2 text-xs text-gray-500'>暂未配置社交按钮，点击下方「+」添加。</p>}
			<div className='space-y-2'>
				{sortedButtons.map((button, index) => (
					<div key={button.id} className='flex items-center gap-2'>
						<select
							value={button.type}
							onChange={e => handleUpdateButton(button.id, { type: e.target.value as SocialButtonType })}
							className='bg-secondary/10 w-24 rounded-lg border px-2 py-1.5 text-xs'>
							<option value='github'>Github</option>
							<option value='juejin'>掘金</option>
							<option value='email'>邮箱</option>
							<option value='link'>链接</option>
						</select>
						<input
							type={button.type === 'email' ? 'email' : 'url'}
							value={button.value}
							onChange={e => handleUpdateButton(button.id, { value: e.target.value })}
							placeholder={button.type === 'email' ? 'example@email.com' : 'https://example.com'}
							className='bg-secondary/10 flex-1 rounded-lg border px-3 py-1.5 text-xs'
						/>
						{button.type !== 'email' && (
							<input
								type='text'
								value={button.label || ''}
								onChange={e => handleUpdateButton(button.id, { label: e.target.value })}
								placeholder='标签文本（可选）'
								className='bg-secondary/10 w-32 rounded-lg border px-3 py-1.5 text-xs'
							/>
						)}
						<input
							type='number'
							value={button.order}
							onChange={e => {
								const order = parseInt(e.target.value, 10)
								if (!isNaN(order) && order > 0) {
									handleUpdateButton(button.id, { order })
								}
							}}
							min={1}
							placeholder='顺序'
							className='bg-secondary/10 w-16 rounded-lg border px-2 py-1.5 text-xs'
						/>
						<div className='flex gap-1'>
							<button
								type='button'
								onClick={() => handleMoveButton(button.id, 'up')}
								disabled={index === 0}
								className='rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300'>
								↑
							</button>
							<button
								type='button'
								onClick={() => handleMoveButton(button.id, 'down')}
								disabled={index === sortedButtons.length - 1}
								className='rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300'>
								↓
							</button>
							<button type='button' onClick={() => handleRemoveButton(button.id)} className='rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50'>
								删除
							</button>
						</div>
					</div>
				))}
				<button
					type='button'
					onClick={handleAddButton}
					className='hover:border-brand/60 flex w-full items-center justify-center rounded-xl border border-dashed py-2 text-sm text-gray-400 hover:bg-gray-50'>
					+ 添加按钮
				</button>
			</div>
		</div>
	)
}
