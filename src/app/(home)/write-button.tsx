import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import PenSVG from '@/svgs/pen.svg'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { styles as hiCardStyles } from './hi-card'
import { styles as clockCardStyles } from './clock-card'
import { useCenterStore } from '@/hooks/use-center'
import { useRouter } from 'next/navigation'
import { useSize } from '@/hooks/use-size'

const styles = {
	height: 42,
	order: 8
}

export default function WriteButton() {
	const center = useCenterStore()
	const { maxSM } = useSize()
	const router = useRouter()

	const [show, setShow] = useState(false)
	useEffect(() => {
		setTimeout(() => setShow(true), styles.order * ANIMATION_DELAY * 1000)
	}, [])

	if (maxSM) return null

	if (!show) return null

	return (
		<motion.button
			onClick={() => router.push('/write')}
			initial={{
				opacity: 0,
				scale: 0.6,
				left: center.x + CARD_SPACING + hiCardStyles.width / 2,
				top: center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height
			}}
			animate={{
				opacity: 1,
				scale: 1,
				left: center.x + CARD_SPACING + hiCardStyles.width / 2,
				top: center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height
			}}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			style={{
				boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)'
			}}
			className='brand-btn absolute'>
			<PenSVG />
			<span>写文章</span>
		</motion.button>
	)
}
