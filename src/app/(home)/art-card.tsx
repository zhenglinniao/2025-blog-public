import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { styles as hiCardStyles } from './hi-card'
import { CARD_SPACING } from '@/consts'

export const styles = {
	width: 360,
	height: 200,
	order: 3
}

export default function ArtCard() {
	const center = useCenterStore()

	return (
		<Card
			className='-translate-1/2 p-2 max-sm:static max-sm:translate-0'
			order={styles.order}
			width={styles.width}
			height={styles.height}
			x={center.x}
			y={center.y - hiCardStyles.height / 2 - styles.height / 2 - CARD_SPACING}>
			<img src='/images/art/cat.png' alt='wall art' className='h-full w-full rounded-[32px] object-cover' />
		</Card>
	)
}
