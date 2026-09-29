# 2025 Blog

> 最新引导说明：https://www.yysuni.com/blog/readme

该项目使用 Github App 管理项目内容，请保管好后续创建的 **Private key**，不要上传到公开网上。

## 1. 安装

使用该项目可以先不做本地开发，直接部署然后配置环境变量。具体变量名请看下列大写变量

```ts
export const GITHUB_CONFIG = {
	OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'yysuni',
	REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || '2025-blog-public',
	BRANCH: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
	APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID || '-'
} as const
```

也可以自己手动先调整安装，可自行 `pnpm i`

## 2. 部署

我这里熟悉 Vercel 部署，就以 Vercel 部署为例子。创建 Project => Import 这个项目

![](https://www.yysuni.com/blogs/readme/730266f17fab9717.png)

无需配置，直接点部署

![](https://www.yysuni.com/blogs/readme/95dee9a69154d0d0.png)

大约 60 秒会部署完成，有一个直接 vercel 域名，如：https://2025-blog-public.vercel.app/

到这里部署网站已经完成了，下一步创建 Github App

## 3. 创建 Github App 链接仓库

在 github 个人设置里面，找到最下面的 Developer Settings ，点击进入

![](https://www.yysuni.com/blogs/readme/0abb3b592cbedad6.png)

进入开发者页面，点击 **New Github App**

_GitHub App name_ 和 _Homepage URL_ , 输入什么都不影响。Webhook 也关闭，不需要。

![](https://www.yysuni.com/blogs/readme/71dcd9cf8ec967c0.png)

只需要注意设置一个仓库 write 权限，其它不用。

![](https://www.yysuni.com/blogs/readme/2be290016e56cd34.png)

点击创建，谁能安装这个仓库这个选择无所谓。直接创建。

![](https://www.yysuni.com/blogs/readme/aa002e6805ab2d65.png)

### 创建密钥

创建好 Github App 后会提示必须创建一个 **Private Key**，直接创建，会自动下载（不见了也不要紧，后面自己再创建再下载就行）。页面上有个 **App ID** 需要复制一下

再切换到安装页面

![](https://www.yysuni.com/blogs/readme/c122b1585bb7a46a.png)

这里一定要只**授权当前项目**。

![](https://www.yysuni.com/blogs/readme/2cf1cee3b04326f1.png)

点击安装，就完成了 Github App 管理该仓库的权限设置了。下一步就是让前端知道推送那个项目，就是最开始提到的环境变量。（如果你不会设置环境变量，直接改仓库文件 `src/consts.ts` 也行。因为是公开的，所以环境变量意义也不大）

直接输入这几个环境变量值就行，一般只用设置 OWNER 和 APP_ID。其它配置不用管，直接输入创建就行。

![](https://www.yysuni.com/blogs/readme/c5a049d737848abf.png)

设置完成后，需要手动再部署一次，让环境变量生效。

- 可以直接 push 一次仓库代码会触发部署
- 也可以手动选择创建一次部署
  ![](https://www.yysuni.com/blogs/readme/59a802ed8d1c3a13.png)

## 4. 完成

现在，部署的这个网站就可以开始使用前端改内容了。比如更改一个分享内容。

**提示**，网站前端页面删改完提示成功之后，你需要等待后台的部署完成，再刷新页面才能完成服务器内容的更新哦。

## 5. 删除

使用这个项目应该第一件事需要删除我的 blog，单独删除，批量删除已完成。

## 6. 配置

大部分页面右上角都会有一个编辑按钮，意味着你可以使用 **private key** 进行配置部署。

### 6.1 网站配置

首页有一个不显眼的配置按钮，点击就能看到现在可以配置的内容。

![](https://www.yysuni.com/blogs/readme/cddb4710e08a5069.png)

## 7. 写 blog

写 blog 的图片管理，可能会有疑惑。图片管理推荐逻辑是先点击 **+ 号** 添加图片，（推荐先压缩好，尺寸推荐宽度不超过 1200）。然后将上传好的图片直接拖入文案编辑区，这就已经添加好了，点击右上角预览就可以看到效果。

### 7.1 同步到 CSDN / 稀土掘金

写作页右上角的「多平台」按钮会生成平台适配的 Markdown：

- 自动将相对图片和链接改为博客公网地址
- 自动附加原文链接和首发说明
- 复制标题、标签和正文，并打开目标平台编辑器

同步后请先在目标平台保存为草稿，检查图片、代码块、分类和封面后再公开发布。

默认博客地址为 `https://web.zlnblog.asia`。如果使用其他域名，请在 Vercel 配置：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

站点同时在 `/rss.xml` 提供包含全文和绝对图片地址的 RSS，可用于 CSDN 站外博客导入。转换器单元测试：

```bash
pnpm test:crosspost
```

### 7.1 自动同步到 CSDN 和掘金草稿箱

仓库内置了自动同步任务。`main` 分支中的 `public/blogs/{slug}/index.md` 或 `config.json` 发生变化后，自托管 GitHub Actions Runner 会自动创建或更新两边的原草稿，不需要再复制粘贴。

安全约束：

- 默认且目前仅支持保存草稿，不会点击平台的“发布”按钮。
- 登录 Cookie 只保存在 Runner 用户目录的 `.blog-crosspost/auth`，不会提交到 Git。
- 本地状态文件记录 `slug`、平台草稿编号和内容哈希，内容未变化时自动跳过，避免重复草稿。
- 平台登录失效、页面改版或保存后校验不一致时，任务会失败退出，不会把失败误报为成功。

第一次使用时，在作为发布机的 Windows 电脑上安装 Node.js、pnpm 和 Microsoft Edge，然后执行：

```bash
pnpm install
pnpm crosspost:login -- --platform csdn
pnpm crosspost:login -- --platform juejin
```

浏览器打开后分别完成登录，确认进入文章编辑器，再回到终端按回车。可以先用指定文章测试：

```bash
pnpm crosspost:sync -- --slug pnpm-upgrade --platform all --force
pnpm crosspost:status
```

然后在 GitHub 仓库的 `Settings → Actions → Runners` 添加 Windows 自托管 Runner，并给它增加 `blog-publisher` 标签。仓库中的 `.github/workflows/crosspost.yml` 会在文章提交到 `main` 后运行，也可以在 Actions 页面手动输入 slug 重试。

运行参数和平台开关位于 `.crosspostrc.json`。如果发布机使用其他 Chromium 浏览器，可以通过 `CROSSPOST_BROWSER_CHANNEL` 指定 Playwright channel；Windows 默认使用系统自带的 Microsoft Edge。

## 8. 写给非前端

非前端配置内容，还是需要一个文件指引。下面写一些更细致的代码配置。

### 8.1 移除 Liquid Grass

进入 `src/layout/index.tsx` 文件，删除两行代码，然后提交代码到你的 github

```tsx
const LiquidGrass = dynamic(() => import('@/components/liquid-grass'), { ssr: false })
// 中间省略...
<LiquidGrass /> // 第 53 行
```

![](https://www.yysuni.com/blogs/readme/f70ff3fe3a77f193.png)

### 8.2 配置首页内容

首页的内容现在只能前端配置一部分，所以代码更改在 `src/app/(home)` 目录，这个目录代表首页所有文件。首页的具体文件为 `src/app/(home)/page.tsx`

![](https://www.yysuni.com/blogs/readme/011679cd9bf73602.png)

这里可以看到有很多 `Card` 文件，需要改那个首页 Card 内容就可以点入那个具体文件修改。

比如中间的内容，为 `HiCard`，点击 `hi-card.tsx` 文件，即可更改其内容。

![](https://www.yysuni.com/blogs/readme/20b0791d012163ee.png)

## 9. 互助群

对于完全不是**程序员**的用户，确实会对于更新代码后，如何同步，如何**合并代码**手足无措。我创建了一个 **QQ群**（加群会简单点），或者 vx 群还是 tg 群会好一点可以 issue 里面说下就行。

QQ 群：[https://qm.qq.com/q/spdpenr4k2](https://qm.qq.com/q/spdpenr4k2)

> 不好意思，之前的那个qq群ID（1021438316），不知道为啥搜不到😂

微信群：刚建好了一个微信群，没有 qq 的可以用这个微信群
![](https://www.yysuni.com/blogs/readme/343f2c62035b8e23.webp)

tg 群：1月1号，才创建的 tg 群 https://t.me/public_blog_2025

应该主要是我自己亲自帮助你们遇到问题怎么办。（后续看看有没有好心人）

希望多多的非程序员加入 blogger 行列，web blog 还是很好玩的，属于自己的 blog 世界。

游戏资产不一定属于你的，你只有**使用权**，但这个 blog **网站、内容、仓库一定是属于你的**

#### 特殊的导航 Card

因为这个 Card 是全局都在的，所以放在了 `src/components` 目录

![](https://www.yysuni.com/blogs/readme/9780c38f886322fd.png)

## Star History

<a href="https://www.star-history.com/#YYsuni/2025-blog-public&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=YYsuni/2025-blog-public&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=YYsuni/2025-blog-public&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=YYsuni/2025-blog-public&type=date&legend=top-left" />
 </picture>
</a>
