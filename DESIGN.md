# RecordYear.ai — UI/UX Design Standard (2026)

> **How to use this file:** Read this before designing or building any UI/UX in RecordYear.ai — new screens, components, flows, or refactors. It is the single source of truth for how the product should look, feel, and behave. When a design decision is ambiguous, default to whatever this document points toward. The closing **Design Agent Prompt** is the one-line distillation; the rest is the detail behind it.

---

## Core Philosophy

Design software that feels like a highly capable teammate, not a database.

The interface should:

- Reduce cognitive load
- Surface actions before information
- Emphasize outcomes over navigation
- Guide users toward next best actions
- Hide complexity until needed
- Feel calm, premium, and trustworthy

---

## Visual Design Principles

### Clean but not minimal

Avoid empty whitespace for its own sake, oversimplified interfaces, and Dribbble-style concepts. Prefer dense but organized information, clear hierarchy, rich context, and functional elegance. Reference points: Linear, Notion Mail, Granola, Arc, Cursor, Vercel.

### Premium enterprise aesthetic

Use subtle borders, layered surfaces, soft shadows, excellent typography, and a large spacing scale. Avoid heavy gradients, excessive color, neumorphism, and glassmorphism overuse. The interface should feel expensive, fast, serious, and focused.

### Typography first

Typography is the primary design tool. Hierarchy should be obvious without relying on color. Prioritize size, weight, spacing, and alignment. A great SaaS interface should still work in grayscale.

---

## Layout System

### Three-level information architecture

Every screen should answer three questions:

1. **What am I looking at?** — Clear page identity.
2. **What should I do?** — Primary action.
3. **What matters most?** — Key metrics and context.

### Progressive disclosure

Never show everything at once. Show the most important information first, advanced options on demand, and secondary actions only when relevant.

- **Bad SaaS:** 20 filters, 15 buttons, 8 tabs.
- **Great SaaS:** one obvious next step.

---

## AI-Native UX

This is where most products still fail.

### AI is a copilot, not a sidebar

A dedicated `[App] | [AI Chat]` split is already dated. AI should appear directly inside workflows — generate report, summarize account, draft email, analyze pipeline, explain anomaly. The AI appears where the work happens.

### Every object has intelligence

Every major object should support: ask questions, summarize, analyze, explain, take action. For example: a customer can summarize activity; a deal can identify risks; an invoice can explain discrepancies; a project can generate a status update.

### Suggested actions everywhere

The best products increasingly answer "What should I do next?" Example:

```
Potential churn risk detected

Recommended:
✓ Schedule review
✓ Send outreach
✓ Create task
```

---

## Workflow Design

### Action-oriented interfaces

- **Bad:** Dashboard → Report → Detail → Edit
- **Good:** Dashboard → Action

The user should accomplish tasks in fewer clicks.

### Context stays visible

Avoid forcing users into separate pages. Use slideovers, side panels, inline editing, and context panes so users never lose context. This is a major pattern in Linear, Figma, Cursor, and Vercel.

---

## Navigation

### Flat navigation wins

Avoid 7-level menu trees. Prefer a flat set: Workspace, Projects, Customers, Reports, Settings.

### Search as primary navigation

Search is increasingly more important than menus. Users should find records, documents, actions, people, and settings from one universal command bar. Think ⌘K first, navigation second.

---

## Data Visualization

### Insights > charts

Most SaaS products show too many charts. Tell users what matters first, then show the chart.

- **Bad:** "Revenue chart"
- **Good:** "Revenue increased 18%. Main driver: enterprise expansion in healthcare accounts." — then show the chart.

### Narrative analytics

Every dashboard should explain what happened, why it happened, and what to do next. AI makes this possible.

---

## Forms

### Conversational forms

Long forms should feel assisted. Instead of 25 raw fields, use smart defaults, autofill, suggestions, and AI completion. Users should provide intent; the software should fill the details.

---

## Interaction Design

### Fast everywhere

Perceived speed matters more than actual speed. Use optimistic updates, skeleton loading, incremental rendering, and streaming responses. Nothing should feel blocked.

### Microinteractions matter

The best products feel alive: subtle hover states, smooth transitions, streaming AI responses, inline confirmations. Avoid excessive animation. Aim for confidence.

---

## Mobile Philosophy

Don't shrink the desktop — reimagine the workflow. Ask: "What is the one thing users need on mobile?" Focus on approval, review, communication, and monitoring — not full administration.

---

## Design Agent Prompt

> Design interfaces that prioritize **action over information**, **context over navigation**, and **intelligence over configuration**. Every screen should clearly communicate what is happening, why it matters, and what the user should do next. Use typography-driven hierarchy, progressive disclosure, embedded AI assistance, and workflow-centric layouts that minimize cognitive load while maximizing speed to outcome. The experience should feel like working alongside an expert teammate rather than operating a software tool.
