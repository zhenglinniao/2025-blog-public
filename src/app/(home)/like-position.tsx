import LikeButton from '@/components/like-button'
import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import { motion } from 'motion/react'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'

export default function LikePosition() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const hiCardStyles = cardStyles.hiCard
	const socialButtonsStyles = cardStyles.socialButtons
	const musicCardStyles = cardStyles.musicCard
	const shareCardStyles = cardStyles.shareCard

	const left = center.x + hiCardStyles.width / 2 - socialButtonsStyles.width + shareCardStyles.width + CARD_SPACING
	const top = center.y + hiCardStyles.height / 2 + CARD_SPACING + socialButtonsStyles.height + CARD_SPACING + musicCardStyles.height + CARD_SPACING

	return (
		<motion.div className='absolute max-sm:static' initial={{ left, top }} animate={{ left, top }}>
			<LikeButton delay={cardStyles.shareCard.order * ANIMATION_DELAY * 1000} />
		</motion.div>
	)
}
