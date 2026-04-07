# 🚀 如何高效使用 Claude Code 写代码

要想让 Claude Code 输出高质量代码，主要依赖于以下**三大支柱**：

1.  **提示词工程 (Prompt Engineering)**：精准的表达。
2.  **大模型能力 (LLM)**：模型本身的基础素质。
3.  **上下文管理 (Context Management)**：**这是开发者最能掌控且优化空间最大的方向。**

---

## 🧠 深度理解上下文 (Context)

### 什么是上下文？
上下文是大模型对操作记录的“短期记忆”。模型通过查看之前的对话、读取的文件和报错信息来决定下一步动作。

### 为什么容量有限？
模型都有上下文窗口限制（如 200K 或 1M token）。当对话过长达到上限后，模型会产生**“AI 幻觉”**——开始虚构数据或忘记早期的核心需求。因此，主动管理上下文是 Claude Code 优化的核心。

![A futuristic brain with glowing connections, representing the AI's limited short-term memory or context window.](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop)

---

## 🛠️ 上下文管理实战策略

### 1. 拒绝直接写码，先切“计划模式”

不要一上来就简单描述需求让 AI 写代码。这会导致代码不满足需求，且可读性低、冗余复杂。

* **正确做法**：按 `Shift + Tab` 切换到 **Plan Mode**。
* **流程**：理清思路 → 输出完整计划（改哪些文件、步骤顺序、潜在风险）→ 人工审查计划 → 切回开发模式执行。

![A close-up of a developer's hands using a mechanical keyboard, with focus on pressing Shift+Tab. A clean desk with a notebook and a pen nearby, implying planning.](https://images.unsplash.com/photo-1587440871875-191322ee64b0?q=80&w=600&auto=format&fit=crop)

---

### 2. 使用子代理处理 Bug 或测试

Claude 在调查问题时会读取大量文件和日志，这会迅速填满主代理的上下文空间，导致后续写代码时空间不足。

* **技巧**：在调研任务后加一句 `"use subagents"`。
* **效果**：子代理在独立的窗口干活，汇报结果但不占用主会话的白板空间，保持主白板清爽。

![A team of diverse, small, stylized robots collaborating on a large complex data structure. The main 'agent' robot stands back observing the report from 'subagent' robots.](https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=600&auto=format&fit=crop)

---

### 3. 利用好、维护好 `CLAUDE.md` 规则文件

`CLAUDE.md` 是 Claude 每次启动必读的“宪法”。在这里沉淀你的编码风格和习惯，避免每次会话都要重复强调。

* **核心技巧**：每次 Claude 犯错被你纠正后，最后加一句：**“更新 `CLAUDE.md` 以免再犯这个错误。”**
* **注意**：保持精简。超过 500 行会分散模型注意力。

![A close-up photograph of a vintage fountain pen resting on a thick leather-bound notebook with 'CLAUDE.md' embossed on the cover, on a polished wooden table, representing rules and long-term memory.](https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop)

---

### 4. 让 Claude Code 自我检查

不要做唯一的质检员。在提示词中内置验证标准，让 Claude 自我检验。

* **例子**：要求写函数时，同时给出测试案例并要求其执行测试；修改 UI 后要求其截图对比。

![A developer leaning back, observing two code snippets side-by-side on a large monitor, with a prominent checkmark overlay, symbolizing automated review.](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop)

---

### 5. 写提示词，要像写技术文档一样具体

模糊的指令（如“加个测试”）会带来模糊的结果。模型读不懂你的心思。

* **具体化**：说明覆盖的边缘情况、禁止使用的库、参考的 Git 历史等。
* **对比**：
    * ❌ 模糊：“给 auth.py 加测试”
    * ✅ 具体：“写 auth.py 的测试，覆盖用户请求中途会话过期的情况。不允许用 mocks。重点测试令牌看似有效但实际过期的边缘情况。”

![A blurred shot of a software architecture diagram on a white board with precise technical terms and connections highlighted in sharp focus in the foreground.](https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop)

---

### 6. 定期重置上下文 (每 30-45 分钟)

会话过长会导致“上下文污染”，表现为模型回答质量下降、重复啰嗦、忘记早期规则。

* **操作方法**：先让 Claude 总结当前进度与剩余任务，然后开启新会话并粘贴总结继续。
* **核心**：一个臃肿的上下文不如一份精炼的总结。

![An hourglass in the foreground with sand flowing, with a clean, empty white room in the background, signifying a fresh start or reset.](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop)

---

### 7. 并行会话 + Git Worktree

利用多个独立工作副本同时开启多条会话。

* **协同工作**：会话 A 写代码，会话 B 负责审计 A 的产出。一个写，一个审，互不干扰，质量更高。

![A developer in a home office using three monitors simultaneously, each displaying different code files or application views, representing parallel workflows.](https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop)

---

### 8. 把重复操作封装成 Skill

如果一个操作每天重复两次以上，就该把它变成 Skill（自定义命令）。Skill 本质是保存好的工作流程。

* **案例**：封面生成、图片压缩、部署流程等，从手动输入完整提示词变成一条命令搞定。

![A close-up of a macro keypad with small custom labeled buttons, representing shortcut skills and automated workflows.](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop)

---

### 9. 给真实数据，而不是你的猜测

不要用语言描述 Bug，直接把报错日志、Docker 输出、真实的错误截图喂给它。

* **核心**：Claude 极其擅长分析分布式系统日志，精准追踪故障点。

![A stylized magnifying glass hovering over a dense wall of scrolling system logs with several lines highlighted in red, indicating a pinpointed error.](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop)

---

## 📋 最佳实践 Check-list

| 阶段 | 关键动作 |
| :--- | :--- |
| **任务开始前** | 检查 `CLAUDE.md` 是否需要更新；决定是否需要计划模式 |
| **执行中** | 复杂调研 → 扔给子代理；写代码 → 具体提示词 + 自我验证；代码审查 → 开第二会话 |
| **每 30-45 分钟** | 让 Claude 总结进度并开启新会话（重置） |
| **任务完成后** | 总结教训 → 更新 `CLAUDE.md`；重复操作 → 封装为 Skill |