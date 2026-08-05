import Link from 'next/link'

const legalLinks = [
	{ href: '/terms', label: '服务条款' },
	{ href: '/privacy', label: '隐私政策' }
]

export default function LegalLinks() {
	return (
		<nav
			aria-label='法律信息'
			className='text-secondary fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-white/35 px-4 py-2 text-xs shadow-sm backdrop-blur-md max-sm:static max-sm:mx-auto max-sm:mt-8 max-sm:mb-8 max-sm:w-fit max-sm:translate-x-0'>
			{legalLinks.map((link, index) => (
				<span key={link.href} className='flex items-center gap-3'>
					{index > 0 && <span aria-hidden='true' className='h-3 w-px bg-current opacity-30' />}
					<Link
						href={link.href}
						className='transition-colors hover:text-[var(--color-brand)] focus-visible:text-[var(--color-brand)] focus-visible:outline-none'>
						{link.label}
					</Link>
				</span>
			))}
		</nav>
	)
}
