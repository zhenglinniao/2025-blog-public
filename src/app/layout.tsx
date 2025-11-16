import '@/styles/globals.css'

import type { Metadata } from 'next'
import Layout from '@/layout'
import Head from '@/layout/head'

const title = 'YYsuni',
	description = 'YYsuni 的个人博客，分享前端开发、React、TypeScript、动画效果等技术文章。基于 Next.js 构建的现代化博客系统，所有内容托管在 Github。'

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description
	},
	twitter: {
		title,
		description
	}
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<Head />

			<body style={{ cursor: 'url(/images/cursor.svg) 2 1, auto' }}>
				<script
					dangerouslySetInnerHTML={{
						__html: `
						if (window && /windows|win32/i.test(navigator.userAgent)) {
							setTimeout(() => document.documentElement.classList.add('windows'), 0)			
						}
			      `
					}}
				/>

				<Layout>{children}</Layout>
			</body>
		</html>
	)
}
