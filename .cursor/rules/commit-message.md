# Git Commit Message Rules

## 提交代码规范

当用户说"提交代码"、"commit"、"git commit" 或类似请求时，必须遵守以下规范：

### Commitlint 规范

所有 Git commit 消息必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

**必须使用以下之一**：

- `feat`: 新功能 (feature)
- `fix`: 修复 bug
- `docs`: 仅文档变更
- `style`: 代码格式变更（不影响代码含义的变化，如空格、格式化、缺少分号等）
- `refactor`: 代码重构（既不是新功能也不是修复bug）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `build`: 构建系统或外部依赖的变更（如 webpack、npm）
- `ci`: CI 配置文件和脚本的变更
- `chore`: 其他不修改源代码或测试文件的变更
- `revert`: 回退之前的 commit

### Scope 范围（可选）

表示 commit 影响的范围，例如：

- `component`: 组件
- `theme`: 主题
- `config`: 配置
- `article`: 文章
- `style`: 样式
- `layout`: 布局
- 等等...

### Subject 主题

- 使用简洁的英文描述
- 首字母小写
- 不要以句号结尾
- 使用祈使句（如 "add" 而不是 "added" 或 "adds"）
- 限制在 50 个字符以内

### 示例

✅ **正确示例**：

```bash
feat: add grid background pattern
feat(theme): add smooth scrollbar styling
fix: resolve hydration mismatch in article list
fix(article): correct image path in markdown
docs: update README with preview command
style(layout): adjust content wrapper padding
refactor: optimize articles data loader
perf: add secondary sort key for stable ordering
chore: update .gitignore with editor files
```

❌ **错误示例**：

```bash
添加格子背景            # 不能使用中文
Add grid background    # type 缺失
add grid background    # 首字母应小写
feat:add background    # 冒号后缺少空格
feat: Added background # 不应使用过去式
feat: add background.  # 不应有句号结尾
```

### 提交流程

1. 运行 `git diff` 查看所有改动
2. 运行 `git status` 查看文件状态
3. 分析变更内容，确定合适的 type 和 scope
4. 编写符合规范的 commit message
5. 执行 `git add .`（或指定文件）
6. 执行 `git commit -m "type(scope): subject"`

### 注意事项

- 每次 commit 应该只包含一个逻辑变更
- 如果变更涉及多个功能，应该拆分成多个 commit
- Commit message 必须是英文
- 不要提交包含敏感信息的文件（.env, credentials 等）
