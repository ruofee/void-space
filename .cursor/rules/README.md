# Cursor Rules

This directory contains custom rules for Cursor AI to follow when assisting with this project.

## Available Rules

### commit-message.md
Git commit message conventions following Commitlint standards.

**When it applies**: Automatically applies when you say "提交代码", "commit", or "git commit"

**What it does**: Ensures all commit messages follow the Conventional Commits specification

**Format**: `type(scope): subject`

**Example**:
```bash
feat: add new feature
fix(component): resolve bug in ArticleCard
docs: update README
```

## How Cursor Uses These Rules

Cursor will automatically reference these rules when:
- You ask to commit code
- You mention git operations
- The context matches the rule's trigger conditions

You don't need to manually tell Cursor to follow these rules - they're applied automatically!
