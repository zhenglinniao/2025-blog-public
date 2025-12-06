import { MetadataRoute } from 'next'

// 定义文章索引的结构
type BlogIndexItem = {
  slug: string
  title: string
  date: string
  summary?: string
  cover?: string
  tags?: string[]
}

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --------------------------------------------------------------------------
  // 1. 配置区域：优先读取环境变量
  // --------------------------------------------------------------------------
  
  // 域名配置：
  // 1. 优先使用 SITE_URL (你在 Vercel 手动设置的正式域名)
  // 2. 其次尝试 VERCEL_URL (Vercel 自动生成的预览域名，通常不带 https://)
  // 3. 最后回退到本地开发地址
  const baseUrl = process.env.SITE_URL 
    ? process.env.SITE_URL 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

  // GitHub 仓库配置：
  const ghOwner = process.env.NEXT_PUBLIC_GITHUB_OWNER      // GitHub 用户名
  const ghRepo = process.env.NEXT_PUBLIC_GITHUB_REPO || '2025-blog-public'   // 仓库名
  const ghBranch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'           // 分支名

  // 构造 Raw 文件地址
  const githubIndexUrl = `https://raw.githubusercontent.com/${ghOwner}/${ghRepo}/${ghBranch}/public/blogs/index.json`

  console.log(`[Sitemap] Generating for: ${baseUrl}`)
  console.log(`[Sitemap] Fetching from: ${githubIndexUrl}`)

  // --------------------------------------------------------------------------
  // 2. 数据获取与生成逻辑
  // --------------------------------------------------------------------------
  
  let posts: BlogIndexItem[] = []

  try {
    const res = await fetch(githubIndexUrl, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`GitHub Responded: ${res.status}`)
    posts = await res.json()
  } catch (error) {
    console.error('Sitemap Error: Failed to fetch blog index', error)
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  return [...staticEntries, ...postEntries]
}
