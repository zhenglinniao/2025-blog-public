import Link from 'next/link'

export interface LegalSection {
	title: string
	paragraphs?: string[]
	items?: string[]
}

interface LegalPageProps {
	title: string
	description: string
	updatedAt: string
	sections: LegalSection[]
}

export default function LegalPage({ title, description, updatedAt, sections }: LegalPageProps) {
	return (
		<div className='mx-auto min-h-full w-full max-w-[880px] px-6 pt-28 pb-20 max-sm:px-4 max-sm:pt-24'>
			<header className='mb-8 text-center'>
				<p className='text-brand mb-3 text-sm font-medium tracking-[0.2em]'>LEGAL</p>
				<h1 className='text-primary text-4xl font-bold max-sm:text-3xl'>{title}</h1>
				<p className='text-secondary mx-auto mt-4 max-w-2xl leading-7'>{description}</p>
				<p className='text-secondary mt-3 text-xs'>生效及最近更新日期：{updatedAt}</p>
			</header>

			<article className='bg-article rounded-[40px] border px-10 py-9 shadow backdrop-blur-md max-sm:rounded-3xl max-sm:px-6 max-sm:py-7'>
				<div className='space-y-9'>
					{sections.map((section, index) => (
						<section key={section.title} aria-labelledby={`legal-section-${index}`}>
							<h2 id={`legal-section-${index}`} className='text-primary mb-3 text-xl font-semibold'>
								{index + 1}. {section.title}
							</h2>
							{section.paragraphs?.map(paragraph => (
								<p key={paragraph} className='text-secondary mt-3 text-sm leading-7'>
									{paragraph}
								</p>
							))}
							{section.items && (
								<ul className='text-secondary mt-3 list-disc space-y-2 pl-5 text-sm leading-7'>
									{section.items.map(item => (
										<li key={item}>{item}</li>
									))}
								</ul>
							)}
						</section>
					))}
				</div>
			</article>

			<div className='mt-8 flex justify-center gap-5 text-sm'>
				<Link href='/' className='text-secondary transition-colors hover:text-[var(--color-brand)]'>
					返回首页
				</Link>
				<span aria-hidden='true' className='text-secondary opacity-40'>
					·
				</span>
				<Link href={title === '服务条款' ? '/privacy' : '/terms'} className='text-secondary transition-colors hover:text-[var(--color-brand)]'>
					{title === '服务条款' ? '查看隐私政策' : '查看服务条款'}
				</Link>
			</div>
		</div>
	)
}
