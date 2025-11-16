import LikeButton from '@/components/like-button'
import { styles as hiCardStyles } from './hi-card'
import { styles as socialButtonsStyles } from './social-buttons'
import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import { motion } from 'motion/react'
import { useCenterStore } from '@/hooks/use-center'
import { styles as musicCardStyles } from './music-card'
import { styles as shareCardStyles } from './share-card'

export const styles = {
	order: 8
}

export default function LikePosition() {
	const center = useCenterStore()
	const left = center.x + hiCardStyles.width / 2 - socialButtonsStyles.width + shareCardStyles.width + CARD_SPACING
	const top = center.y + hiCardStyles.height / 2 + CARD_SPACING + socialButtonsStyles.height + CARD_SPACING + musicCardStyles.height + CARD_SPACING

	return (
		<motion.div className='absolute max-sm:static' initial={{ left, top }} animate={{ left, top }}>
			<LikeButton delay={styles.order * ANIMATION_DELAY * 1000} />
		</motion.div>
	)
}
