'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from './stores/config-store'
import { pushSiteContent } from './services/push-site-content'
import type { SiteContent, CardStyles } from './stores/config-store'
import { hashFileSHA256 } from '@/lib/file-utils'

export type FileItem = { type: 'file'; file: File; previewUrl: string; hash?: string } | { type: 'url'; url: string }

interface ConfigDialogProps {
	open: boolean
	onClose: () => void
}

export default function ConfigDialog({ open, onClose }: ConfigDialogProps) {
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent, setSiteContent, cardStyles, setCardStyles, regenerateBubbles } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>(siteContent)
	const [cardStylesData, setCardStylesData] = useState<CardStyles>(cardStyles)
	const [originalData, setOriginalData] = useState<SiteContent>(siteContent)
	const [originalCardStyles, setOriginalCardStyles] = useState<CardStyles>(cardStyles)
	const [isSaving, setIsSaving] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)
	const [faviconItem, setFaviconItem] = useState<FileItem | null>(null)
	const [avatarItem, setAvatarItem] = useState<FileItem | null>(null)
	const faviconInputRef = useRef<HTMLInputElement>(null)
	const avatarInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (open) {
			const current = { ...siteContent }
			const currentCardStyles = { ...cardStyles }
			setFormData(current)
			setCardStylesData(currentCardStyles)
			setOriginalData(current)
			setOriginalCardStyles(currentCardStyles)
			setFaviconItem(null)
			setAvatarItem(null)
		}
	}, [open, siteContent, cardStyles])

	useEffect(() => {
		return () => {
			// Clean up preview URLs on unmount
			if (faviconItem?.type === 'file') {
				URL.revokeObjectURL(faviconItem.previewUrl)
			}
			if (avatarItem?.type === 'file') {
				URL.revokeObjectURL(avatarItem.previewUrl)
			}
		}
	}, [faviconItem, avatarItem])

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushSiteContent(formData, cardStylesData, faviconItem, avatarItem)
			setSiteContent(formData)
			setCardStyles(cardStylesData)
			updateBrandColorVariable(formData.theme?.colorBrand)
			setFaviconItem(null)
			setAvatarItem(null)
			onClose()
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		// Clean up preview URLs
		if (faviconItem?.type === 'file') {
			URL.revokeObjectURL(faviconItem.previewUrl)
		}
		if (avatarItem?.type === 'file') {
			URL.revokeObjectURL(avatarItem.previewUrl)
		}
		// Restore to the state when dialog was opened
		setSiteContent(originalData)
		setCardStyles(originalCardStyles)
		regenerateBubbles()
		// Restore document title and meta if they were changed by preview
		if (typeof document !== 'undefined') {
			document.title = originalData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) {
				metaDescription.setAttribute('content', originalData.meta.description)
			}
		}
		updateBrandColorVariable(originalData.theme?.colorBrand)
		setFaviconItem(null)
		setAvatarItem(null)
		onClose()
	}

	const updateBrandColorVariable = (color?: string) => {
		if (typeof document === 'undefined' || !color) return
		document.documentElement.style.setProperty('--color-brand', color)
		if (document.body) {
			document.body.style.setProperty('--color-brand', color)
		}
	}

	const handlePreview = () => {
		setSiteContent(formData)
		setCardStyles(cardStylesData)
		regenerateBubbles()

		// Update document title
		if (typeof document !== 'undefined') {
			document.title = formData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) {
				metaDescription.setAttribute('content', formData.meta.description)
			}
		}
		updateBrandColorVariable(formData.theme?.colorBrand)

		onClose()
	}

	const handleBrandColorChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			theme: {
				...prev.theme,
				colorBrand: value
			}
		}))
	}

	const handleColorChange = (index: number, value: string) => {
		const newColors = [...formData.backgroundColors]
		newColors[index] = value
		setFormData({ ...formData, backgroundColors: newColors })
	}

	const generateRandomColor = () => {
		const randomChannel = () => Math.floor(Math.random() * 256)
		return `#${[randomChannel(), randomChannel(), randomChannel()]
			.map(channel => channel.toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase()}`
	}

	const handleRandomizeColors = () => {
		const count = Math.floor(Math.random() * 5) + 4 // 4 ~ 8 个颜色
		const backgroundColors = Array.from({ length: count }, () => generateRandomColor())
		const colorBrand = generateRandomColor()

		setFormData(prev => ({
			...prev,
			backgroundColors,
			theme: {
				...prev.theme,
				colorBrand
			}
		}))
	}

	const handleAddColor = () => {
		setFormData({
			...formData,
			backgroundColors: [...formData.backgroundColors, '#EDDD62']
		})
	}

	const handleRemoveColor = (index: number) => {
		if (formData.backgroundColors.length > 1) {
			const newColors = formData.backgroundColors.filter((_, i) => i !== index)
			setFormData({ ...formData, backgroundColors: newColors })
		}
	}

	const handleFaviconFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('请选择图片文件')
			return
		}

		const hash = await hashFileSHA256(file)
		const previewUrl = URL.createObjectURL(file)
		setFaviconItem({ type: 'file', file, previewUrl, hash })
		if (e.currentTarget) e.currentTarget.value = ''
	}

	const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith('image/')) {
			toast.error('请选择图片文件')
			return
		}

		const hash = await hashFileSHA256(file)
		const previewUrl = URL.createObjectURL(file)
		setAvatarItem({ type: 'file', file, previewUrl, hash })
		if (e.currentTarget) e.currentTarget.value = ''
	}

	const handleRemoveFavicon = () => {
		if (faviconItem?.type === 'file') {
			URL.revokeObjectURL(faviconItem.previewUrl)
		}
		setFaviconItem(null)
	}

	const handleRemoveAvatar = () => {
		if (avatarItem?.type === 'file') {
			URL.revokeObjectURL(avatarItem.previewUrl)
		}
		setAvatarItem(null)
	}

	const buttonText = isAuth ? '保存' : '导入密钥'

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<DialogModal open={open} onClose={handleCancel} className='card max-h-[90vh] max-w-2xl overflow-y-auto'>
				<div className='mb-6 flex items-center justify-between'>
					<h2 className='text-xl font-semibold'>站点配置</h2>
					<div className='flex gap-3'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handlePreview}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							预览
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</div>
				</div>

				<div className='space-y-6'>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='mb-2 block text-sm font-medium'>Favicon</label>
							<input ref={faviconInputRef} type='file' accept='image/*' className='hidden' onChange={handleFaviconFileSelect} />
							<div className='group relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border bg-white/60'>
								{faviconItem?.type === 'file' ? (
									<img src={faviconItem.previewUrl} alt='favicon preview' className='h-full w-full object-cover' />
								) : (
									<img src='/favicon.png' alt='current favicon' className='h-full w-full object-cover' />
								)}
								<div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
									<span className='text-xs text-white'>{faviconItem ? '更换' : '上传'}</span>
								</div>
								{faviconItem && (
									<div className='absolute top-1 right-1 hidden group-hover:block'>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={e => {
												e.stopPropagation()
												handleRemoveFavicon()
											}}
											className='rounded-md bg-white/90 px-2 py-1 text-xs text-red-500 shadow hover:bg-white'>
											清除
										</motion.button>
									</div>
								)}
								<div className='absolute inset-0' onClick={() => faviconInputRef.current?.click()} />
							</div>
						</div>

						<div>
							<label className='mb-2 block text-sm font-medium'>Avatar</label>
							<input ref={avatarInputRef} type='file' accept='image/*' className='hidden' onChange={handleAvatarFileSelect} />
							<div className='group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border bg-white/60'>
								{avatarItem?.type === 'file' ? (
									<img src={avatarItem.previewUrl} alt='avatar preview' className='h-full w-full object-cover' />
								) : (
									<img src='/images/avatar.png' alt='current avatar' className='h-full w-full object-cover' />
								)}
								<div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
									<span className='text-xs text-white'>{avatarItem ? '更换' : '上传'}</span>
								</div>
								{avatarItem && (
									<div className='absolute top-1 right-1 hidden group-hover:block'>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={e => {
												e.stopPropagation()
												handleRemoveAvatar()
											}}
											className='rounded-md bg-white/90 px-2 py-1 text-xs text-red-500 shadow hover:bg-white'>
											清除
										</motion.button>
									</div>
								)}
								<div className='absolute inset-0' onClick={() => avatarInputRef.current?.click()} />
							</div>
						</div>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium'>站点标题</label>
						<input
							type='text'
							value={formData.meta.title}
							onChange={e => setFormData({ ...formData, meta: { ...formData.meta, title: e.target.value } })}
							className='w-full rounded-lg border bg-gray-100 px-4 py-2 text-sm'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium'>站点描述</label>
						<textarea
							value={formData.meta.description}
							onChange={e => setFormData({ ...formData, meta: { ...formData.meta, description: e.target.value } })}
							rows={3}
							className='w-full rounded-lg border bg-gray-100 px-4 py-2 text-sm'
						/>
					</div>

					<div>
						<label className='mb-2 block text-sm font-medium'>主题色</label>
						<div className='flex items-center gap-3'>
							<input
								type='color'
								value={formData.theme?.colorBrand ?? '#35bfab'}
								onChange={e => handleBrandColorChange(e.target.value)}
								className='h-10 w-16 cursor-pointer'
							/>
							<input
								type='text'
								value={formData.theme?.colorBrand ?? ''}
								onChange={e => handleBrandColorChange(e.target.value)}
								className='flex-1 rounded-lg border bg-gray-100 px-4 py-2 text-sm'
							/>
						</div>
					</div>

					<div>
						<div className='mb-2 flex items-center justify-between gap-3'>
							<label className='block text-sm font-medium'>背景颜色</label>
							<div className='flex gap-2'>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={handleRandomizeColors}
									className='rounded-lg border bg-white/60 px-3 py-1 text-xs whitespace-nowrap'>
									随机配色
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={handleAddColor}
									className='rounded-lg border bg-white/60 px-3 py-1 text-xs whitespace-nowrap'>
									+ 添加颜色
								</motion.button>
							</div>
						</div>
						<div className='grid grid-cols-2 gap-3'>
							{formData.backgroundColors.map((color, index) => (
								<div key={index} className='flex items-center gap-2'>
									<input type='color' value={color} onChange={e => handleColorChange(index, e.target.value)} className='h-10 w-16 cursor-pointer' />
									<input
										type='text'
										value={color}
										onChange={e => handleColorChange(index, e.target.value)}
										className='flex-1 rounded-lg border bg-white/60 px-4 py-2 text-sm'
									/>
									{formData.backgroundColors.length > 1 && (
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => handleRemoveColor(index)}
											className='rounded-lg border bg-white/60 px-3 py-1 text-xs whitespace-nowrap text-red-500'>
											删除
										</motion.button>
									)}
								</div>
							))}
						</div>
					</div>

					<div>
						<div className='mb-2 flex items-center justify-between gap-3'>
							<label className='block text-sm font-medium'>Card 样式配置</label>
						</div>
						<div className='space-y-4'>
							{Object.entries(cardStylesData).map(([key, cardStyle]: [string, any]) => (
								<div key={key} className='rounded-lg border bg-white/60 p-4'>
									<h3 className='mb-3 text-sm font-medium capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
									<div className='grid grid-cols-2 gap-3'>
										{cardStyle.width !== undefined && (
											<div>
												<label className='mb-1 block text-xs text-gray-600'>Width</label>
												<input
													type='number'
													value={cardStyle.width}
													onChange={e =>
														setCardStylesData(prev => ({
															...prev,
															[key]: { ...prev[key as keyof CardStyles], width: parseInt(e.target.value) || 0 }
														}))
													}
													className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
												/>
											</div>
										)}
										{cardStyle.height !== undefined && (
											<div>
												<label className='mb-1 block text-xs text-gray-600'>Height</label>
												<input
													type='number'
													value={cardStyle.height}
													onChange={e =>
														setCardStylesData(prev => ({
															...prev,
															[key]: { ...prev[key as keyof CardStyles], height: parseInt(e.target.value) || 0 }
														}))
													}
													className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
												/>
											</div>
										)}
										<div>
											<label className='mb-1 block text-xs text-gray-600'>Order</label>
											<input
												type='number'
												value={cardStyle.order}
												onChange={e =>
													setCardStylesData(prev => ({
														...prev,
														[key]: { ...prev[key as keyof CardStyles], order: parseInt(e.target.value) || 0 }
													}))
												}
												className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
											/>
										</div>
										{cardStyle.offset !== undefined && (
											<div>
												<label className='mb-1 block text-xs text-gray-600'>Offset</label>
												<input
													type='number'
													value={cardStyle.offset}
													onChange={e =>
														setCardStylesData(prev => ({
															...prev,
															[key]: { ...prev[key as keyof CardStyles], offset: parseInt(e.target.value) || 0 }
														}))
													}
													className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
												/>
											</div>
										)}
										<div>
											<label className='mb-1 block text-xs text-gray-600'>Offset X</label>
											<input
												type='number'
												value={cardStyle.offsetX ?? ''}
												placeholder='null'
												onChange={e => {
													const value = e.target.value === '' ? null : parseInt(e.target.value) || 0
													setCardStylesData(prev => ({
														...prev,
														[key]: { ...prev[key as keyof CardStyles], offsetX: value }
													}))
												}}
												className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
											/>
										</div>
										<div>
											<label className='mb-1 block text-xs text-gray-600'>Offset Y</label>
											<input
												type='number'
												value={cardStyle.offsetY ?? ''}
												placeholder='null'
												onChange={e => {
													const value = e.target.value === '' ? null : parseInt(e.target.value) || 0
													setCardStylesData(prev => ({
														...prev,
														[key]: { ...prev[key as keyof CardStyles], offsetY: value }
													}))
												}}
												className='w-full rounded-lg border bg-gray-100 px-3 py-1.5 text-sm'
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</DialogModal>
		</>
	)
}
