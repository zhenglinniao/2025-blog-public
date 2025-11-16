'use client'
import { PropsWithChildren } from 'react'
import { useCenterInit } from '@/hooks/use-center'
import BlurredBubblesBackground from './backgrounds/blurred-bubbles'
import NavCard from '@/components/nav-card'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSizeInit } from '@/hooks/use-size'

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useSizeInit()

	return (
		<>
			<Toaster
				position='bottom-right'
				richColors
				// closeButton
				icons={{
					success: <CircleCheckIcon className='size-4' />,
					info: <InfoIcon className='size-4' />,
					warning: <TriangleAlertIcon className='size-4' />,
					error: <OctagonXIcon className='size-4' />,
					loading: <Loader2Icon className='size-4 animate-spin' />
				}}
				style={
					{
						'--border-radius': '12px'
					} as React.CSSProperties
				}
			/>
			<BlurredBubblesBackground />
			<main className='relative z-10 h-full'>
				{children}
				<NavCard />
			</main>
		</>
	)
}
