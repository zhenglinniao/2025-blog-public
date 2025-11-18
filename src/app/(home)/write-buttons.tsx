import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import PenSVG from '@/svgs/pen.svg'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { styles as hiCardStyles } from './hi-card'
import { styles as clockCardStyles } from './clock-card'
import { useCenterStore } from '@/hooks/use-center'
import { useRouter } from 'next/navigation'
import { useSize } from '@/hooks/use-size'
import DotsSVG from '@/svgs/dots.svg'
import ConfigDialog from './config-dialog'

const styles = {
	height: 42,
	order: 8
}

export default function WriteButton() {
	const center = useCenterStore()
	const { maxSM } = useSize()
	const router = useRouter()
	const [isConfigOpen, setIsConfigOpen] = useState(false)

	const [show, setShow] = useState(false)
	useEffect(() => {
		setTimeout(() => setShow(true), styles.order * ANIMATION_DELAY * 1000)
	}, [])

	if (maxSM) return null

	if (!show) return null

	return (
		<motion.div
			initial={{
				left: center.x + CARD_SPACING + hiCardStyles.width / 2,
				top: center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height
			}}
			animate={{
				left: center.x + CARD_SPACING + hiCardStyles.width / 2,
				top: center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height
			}}
			className='absolute flex items-center gap-4'>
			<motion.button
				onClick={() => router.push('/write')}
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				style={{ boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)' }}
				className='brand-btn whitespace-nowrap'>
				<PenSVG />
				<span>写文章</span>
			</motion.button>
			<motion.button
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => setIsConfigOpen(true)}
				className='p-2'>
				<DotsSVG className='h-6 w-6' />
			</motion.button>
			<ConfigDialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
		</motion.div>
	)
}
