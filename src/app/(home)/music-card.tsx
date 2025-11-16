import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { styles as hiCardStyles } from './hi-card'
import { CARD_SPACING } from '@/consts'
import { styles as clockCardStyles } from './clock-card'
import { styles as calendarCardStyles } from './calendar-card'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'

export const styles = {
	width: 293,
	height: 66,
	offset: 120,
	order: 6
}

export default function MusicCard() {
	const center = useCenterStore()

	return (
		<Card
			order={styles.order}
			width={styles.width}
			height={styles.height}
			x={center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset}
			y={center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING}
			className='flex items-center gap-3'>
			<MusicSVG className='h-8 w-8' />

			<div className='flex-1'>
				<div className='text-secondary text-sm'>随机音乐</div>

				<div className='mt-1 h-2 rounded-full bg-white/60'>
					<div className='bg-linear h-full w-1/2 rounded-full' />
				</div>
			</div>

			<button className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
				<PlaySVG className='ml-1 h-4 w-4' />
			</button>
		</Card>
	)
}
