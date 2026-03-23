# OWL — Outstanding Wealth Ledger

A personal finance manager with an AI chat interface and Telegram bot. Log expenses by chatting, get insights, set up recurring transactions, and receive daily reminders — all self-hosted.

---

## What's inside

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **MongoDB Atlas** — stores transactions, recurring schedules, chat history, users
- **OpenRouter** — LLM API for intent classification and chat responses (free tier available)
- **Telegram Bot** — add transactions and receive daily reminders via Telegram
- **JWT auth** — single-user, cookie-based session

---

## Services you need before setup

| Service | Purpose | Free tier |
|---|---|---|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | Yes (512 MB) |
| [OpenRouter](https://openrouter.ai) | LLM API | Yes (free models available) |
| [Telegram](https://t.me/BotFather) | Bot for transaction logging + reminders | Yes |
| [Vercel](https://vercel.com) *(optional)* | Hosting | Yes |

Set these up and have their credentials ready before proceeding.

---

## 1. MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for Vercel)
4. Get your connection string from **Connect → Drivers**:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/owlx
   ```

---

## 2. OpenRouter

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Generate an API key under **Keys**
3. Pick your models — free options work fine:
   ```
   nvidia/nemotron-3-super-120b-a12b:free
   ```
   Browse available free models at [openrouter.ai/models](https://openrouter.ai/models?q=free)

---

## 3. Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts — you'll get a **bot token**
3. Start a chat with your new bot, send any message
4. Find your **chat ID** by visiting:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   Look for `"chat":{"id":XXXXXXXXX}` in the response

> **Two bots recommended:** one for production, one for local dev. BotFather → `/newbot` twice.

---

## 4. Local setup

### Clone and install

```bash
git clone https://github.com/thefullstackalchemist/owlx.git
cd owlx
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/owlx

# Auth — generate with: openssl rand -base64 32
JWT_SECRET=replace-with-a-long-random-string

# OpenRouter
OPENROUTER_KEY=sk-or-v1-...
MODEL_MICROBRAIN=nvidia/nemotron-3-super-120b-a12b:free
MODEL_MACROBRAIN=nvidia/nemotron-3-super-120b-a12b:free

# First user (auto-created on first boot)
FIRST_USER=your.username
FIRST_PASSWORD=your-secure-password

# Telegram (dev bot)
TELEGRAM_BOT_TOKEN=your-dev-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Leave TELEGRAM_WEBHOOK_URL unset in dev — uses polling automatically
```

> **Password tip:** If your password contains `#`, wrap it in quotes:
> `FIRST_PASSWORD="My#SecurePass"` — unquoted `#` is treated as a comment.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with your `FIRST_USER` / `FIRST_PASSWORD`. The account is created automatically on first boot.

The Telegram bot starts polling automatically in dev — message your bot and check the terminal for:
```
[telegram] chat_id=XXXXXXXXX text="..."
```

---

## 5. Production deploy (Vercel)

### Deploy

```bash
# Push to GitHub then import at vercel.com/new
# — or —
npx vercel --prod
```

### Environment variables

Add all vars from `.env.local` to your Vercel project settings, then add:

```env
TELEGRAM_BOT_TOKEN=your-prod-bot-token     # use a separate prod bot
TELEGRAM_CHAT_ID=your-telegram-chat-id
TELEGRAM_WEBHOOK_URL=https://your-app.vercel.app/api/telegram
```

Setting `TELEGRAM_WEBHOOK_URL` switches the bot to **webhook mode** — no polling needed on serverless.

### Register the webhook

Run this once after deploying (replace with your actual token):

```bash
curl "https://api.telegram.org/bot<YOUR_PROD_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

On the next deploy, OWL will also auto-register the webhook on startup.

---

## Environment variable reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for signing session cookies |
| `OPENROUTER_KEY` | Yes | OpenRouter API key |
| `MODEL_MICROBRAIN` | Yes | Model for intent classification (fast) |
| `MODEL_MACROBRAIN` | Yes | Model for analysis responses (capable) |
| `FIRST_USER` | Yes | Username for the auto-seeded account |
| `FIRST_PASSWORD` | Yes | Password for the auto-seeded account |
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Your Telegram chat ID (only you can use the bot) |
| `TELEGRAM_WEBHOOK_URL` | Prod only | Full URL to `/api/telegram` — enables webhook mode |

---

## Telegram bot usage

Once set up, message your bot to log transactions:

```
Spent ₹500 Zomato biryani today
Coffee 80 this morning
Amazon 1500 pants yesterday
Salary 50000 credited
```

The bot will confirm the details — reply **yes** to save or **no** to cancel. You can also correct it inline: _"change amount to 450"_.

Daily reminders arrive at **10:00 AM** and **10:00 PM IST** automatically.

> Spend insights and queries are disabled on Telegram for privacy. Use the web app for analytics.

---

## Architecture

```
Browser (Next.js)
  └── /api/chat          → classifyIntent → OpenRouter → stream response
  └── /api/transactions  → MongoDB CRUD
  └── /api/recurring     → recurring schedule CRUD + manual run

Telegram Bot
  Dev  → polling (node-telegram-bot-api)
  Prod → POST /api/telegram (webhook)
  Both → telegramOrchestrator → classifyIntent → confirm/save flow

Cron (node-cron, runs in-process)
  10:00 AM IST → morning reminder via notify()
  10:00 PM IST → evening reminder via notify()
```

---

## Development tips

- All models default to free OpenRouter tiers — no cost to run
- The first user is auto-upserted on every boot (safe to change credentials and restart)
- Chat history is stored in MongoDB with a `source` field (`web` or `telegram`) — Telegram messages are visible in the web UI but excluded from the web LLM context
- Recurring transactions must be run manually from the UI or via `POST /api/recurring/:id/run`

---

## License

MIT — fork it, self-host it, make it yours.
