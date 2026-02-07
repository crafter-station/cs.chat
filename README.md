![hero](public/og.png)

<h1 align="center">
  C3.chat
  <br />
</h1>

<p align="center">
  One chat, every AI model
  <br />
  <br />
  <a href="https://cs.chat">Website</a>
  ·
  <a href="https://github.com/crafter-station/cs.chat/issues">Issues</a>
</p>

<p align="center">
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  </a>
  <a href="https://react.dev">
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  </a>
  <a href="https://sdk.vercel.ai">
    <img src="https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel AI SDK" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

<p align="center">
  <sub>
    Built by
    <br />
    <a href="https://crafterstation.com">
      <img src="https://raw.githubusercontent.com/Railly/crafter-station/main/public/logo.png" alt="Crafter Station" width="16" valign="middle" /> Crafter Station
    </a>
  </sub>
</p>

## About

C3.chat is an open-source AI chat interface that lets you talk to multiple AI models from a single place. Switch between GPT-4o, Claude, Gemini, DeepSeek, Grok, and more — all through one clean, fast UI.

## Features

**Multi-Model Support**: Chat with 13+ models from OpenAI, Anthropic, Google, Meta, DeepSeek, xAI, Perplexity, and Mistral — switch mid-conversation.<br/>
**Reasoning Display**: See the model's chain-of-thought when using reasoning models like DeepSeek R1.<br/>
**Citations & Sources**: Inline citations with source links for grounded responses.<br/>
**Streaming Responses**: Real-time token streaming with smooth scroll-to-bottom behavior.<br/>
**Thread Management**: Persistent conversation threads with auto-generated titles.<br/>
**Keyboard Shortcuts**: `Cmd+Shift+O` to start a new conversation instantly.<br/>
**Rate Limiting**: Built-in per-user rate limiting with Upstash Redis.<br/>
**Authentication**: Clerk-powered auth with anonymous guest access and usage tiers.<br/>

## Get Started

### Prerequisites

- [Bun](https://bun.sh) 1.1+
- A [Neon](https://neon.tech) Postgres database
- [Upstash](https://upstash.com) Redis instance
- [Clerk](https://clerk.com) application
- AI Gateway API key

### Installation

```bash
# Clone the repository
git clone https://github.com/crafter-station/cs.chat.git
cd cs.chat

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local

# Push the database schema
bun run db:push

# Start the development server
bun run dev
```

## Tech Stack

### Core

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### AI & Backend

- Vercel AI SDK (`ai` + `@ai-sdk/react`)
- AI Gateway for multi-provider routing
- Drizzle ORM + Neon Postgres
- Upstash Redis (rate limiting)

### Auth & Analytics

- Clerk (authentication)
- Vercel Analytics

### UI

- shadcn/ui
- AI Elements (composable chat components)
- Radix UI primitives
- Motion (animations)

## Project Structure

```
cs.chat/
├── app/
│   ├── api/chat/        # Streaming chat API route
│   ├── layout.tsx       # Root layout with sidebar
│   ├── page.tsx         # Main chat interface
│   └── globals.css      # Theme & custom CSS variables
├── components/
│   ├── ai-elements/     # Chat UI components (conversation, message, prompt-input, model-selector)
│   ├── ui/              # shadcn/ui base components
│   └── logos/           # Brand logos
├── hooks/               # Custom React hooks (threads, usage, title generation)
├── lib/                 # Utilities (rate limiting, caching, user service)
└── public/              # Static assets & OG images
```

## Contributing

We welcome contributions! Open an [issue](https://github.com/crafter-station/cs.chat/issues) or submit a pull request.

---

<p align="center">
  Built with love by <a href="https://crafterstation.com">crafterstation.com</a>
</p>
