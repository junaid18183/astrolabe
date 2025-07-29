---

title: "AI-Augmented Issue-Driven Workflow"
description: "Optimized for GitHub Copilot Agent Mode with MCP"
applyTo: "\*\*/\*"
alwaysApply: true
version: 1.1
agentSupport: true
copilotCompatible: true
-----------------------

# AI-Augmented Issue-Driven Development Workflow

This guide outlines a Copilot Agent-compatible workflow for managing software development using:

* GitHub Issues (issue-centric branching)
* [Github MCP Server](https://github.com/github/github-mcp-server) for live documentation & memory context
* [Memory MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) for planning and task orchestration
* [Context7 MCP Server](https://github.com/upstash/context7) Up-to-date Code Docs For Any Prompt

This version is optimized for **GitHub Copilot Agent Mode**. It allows agents to:

* Detect user intent (branch creation, PRD writing, risky refactors)
* Initiate context tagging
* Query MCP/Memory
* Up-to-date Code Docs using context7
* Automate Github Issue and Branch management steps

---

## 🚀 Copilot Agent Mode Setup

To enable agent interaction, install and start the Memory,context7 and Github MCP Servers.

Copilot Agent will automatically detect:

* GitHub issues with issues , branches etc
* `.vscode/mcp.json` for memory and Context7

Once active, agent can assist with:

* Branch-based context tracking
* Issue parsing and creating the development plan out of it
* Memory summaries and diff analysis

---

## Standard Dev Workflow (Agent-Optimized)

### 1. Start Work on GitHub Issue

```bash
git checkout main
git pull origin main
git checkout -b issue-<number>-<short-description>
```

> Copilot will detect this and ask: *"Shall I create a corresponding task tag?"*

### 2. Plan & Document in Memory

```bash
mcp memory add --key="issue-<number>-plan" --value="Plan, steps, links to docs"
```

> Copilot will surface this when you start editing related files.

### 3. Query Docs

```bash
mcp context7 query --prompt="OAuth callback handling"
```

### 4. Code with Context

```bash
mcp memory query --key="issue-<number>-plan"
```

### 5. Finalize Work

```bash
git commit -am "feat(issue-<number>): added OAuth callback logic"
git push -u origin issue-<number>-short
```

### 6. Clean Up

```bash
mcp memory remove --key="issue-<number>-plan"
```

---

## 🤖 Pattern Recognition (Agent Mode)

<!-- copilot:action:start -->

### 🧭 Feature Branch Detected

**Trigger**: `git checkout -b feature/auth`

**Action**:

```bash
task-master add-tag feature-auth --from-branch
```

**Prompt**:

> "Want a task context for `feature/auth`? It’ll keep tasks isolated."

<!-- copilot:action:end -->

### 👥 Team Collaboration

**Trigger**: Mentions of teammates ("Alice is handling DB")

**Action**:

```bash
task-master add-tag my-auth-work --copy-from-current --description="Auth changes by Juned"
```

### 🧪 Experiment or Refactor

**Trigger**: Mentions risky changes ("try Zustand")

**Action**:

```bash
task-master add-tag experiment-zustand --description="Trying Zustand for state"
```

### 🧱 Large Feature or Epic

**Trigger**: User describes multi-part feature ("dashboard with analytics")

**Action Flow**:

```bash
task-master add-tag feature-dashboard --description="Analytics Dashboard"
echo "Title: Dashboard
Details: 1. Analytics
2. User MGMT..." > .taskmaster/docs/feature-dashboard-prd.txt
task-master parse-prd .taskmaster/docs/feature-dashboard-prd.txt --tag=feature-dashboard
```

---

## 🧠 Copilot Agent Prompt Template

```copilot-actions
suggestion:
  type: prompt
  context: new_branch_created
  message: |
    I see you've created a branch 'feature/auth'.
    Shall I create a task tag to isolate this work?
  action: task-master add-tag feature-auth --from-branch
```

---

## 🗂️ Summary Table for Copilot Agent

| Event                | Agent Trigger | Suggested Action                       |
| -------------------- | ------------- | -------------------------------------- |
| `git checkout -b`    | New branch    | Offer tag creation                     |
| `.prd.txt` created   | Detected PRD  | Offer parsing & task generation        |
| `mcp memory add`     | Memory saved  | Add `--tag` to tie to task             |
| `git push`           | PR created    | Offer task cleanup, set status to done |
| `task-master expand` | New PRD       | Research complexity & log plan         |

---

