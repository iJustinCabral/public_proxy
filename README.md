# democraic — AI-Powered Direct Democracy

Your AI agent reads every bill in Congress, understands your values, and votes on your behalf.

## What is this?

democraic is a direct democracy platform where AI agents represent citizens. Instead of relying on elected representatives who may not share your views, you create an AI agent that:

1. **Learns your political values** through a questionnaire covering economy, healthcare, environment, social issues, immigration, gun policy, education, and foreign policy
2. **Reads real bills** pulled directly from the official [Congress.gov API](https://api.congress.gov/)
3. **Votes on your behalf** by analyzing each bill against your stated values, with full transparency into its reasoning and confidence level
4. **Aggregates into "The People's Vote"** — showing what legislation would look like if every citizen had a direct say

## Getting Started

### Prerequisites

- Node.js 18+
- A [Congress.gov API key](https://api.congress.gov/sign-up/) (free)
- An [Anthropic API key](https://console.anthropic.com/) (for AI analysis)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── onboarding/        # Political questionnaire
│   ├── bills/             # Browse & view bills
│   ├── dashboard/         # User's agent dashboard
│   ├── representatives/   # Aggregated "People's Vote"
│   └── api/               # API routes
│       ├── onboarding/    # Create user + political profile
│       ├── bills/         # List bills + sync from Congress.gov
│       ├── agent/         # AI analysis + voting
│       ├── profile/       # User profile + vote history
│       └── representatives/ # Aggregated tallies
├── lib/
│   ├── db/                # SQLite database + queries
│   ├── congress/          # Congress.gov API client
│   ├── ai/                # AI bill analysis + voting engine
│   └── questionnaire.ts   # Political profile questions + scoring
```

### Tech Stack

- **Next.js 14** — React framework with API routes
- **SQLite** (better-sqlite3) — Zero-config database
- **Congress.gov API** — Official source for all legislation
- **Anthropic Claude** — AI engine for bill analysis and agent voting

## How the AI Agent Works

1. **Political Profile**: Users answer 14 questions across 8 policy dimensions. Each answer maps to a score from -1.0 to 1.0 on each axis. Users also provide free-text values and priorities.

2. **Bill Sync**: Bills are pulled from the Congress.gov API with full metadata — sponsors, summaries, subjects, status, and text links.

3. **Bill Analysis**: Claude generates a plain-English summary of each bill that any citizen can understand.

4. **Agent Voting**: When a user's agent votes, Claude receives the user's full political profile and the bill details. It returns:
   - A vote (yea/nay/abstain)
   - A confidence score (0.0-1.0)
   - Reasoning written directly to the user
   - Key factors that influenced the decision

5. **Aggregation**: All agent votes are tallied into "The People's Vote" — a direct representation of what citizens actually want.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding` | Create user + political profile |
| GET | `/api/bills` | List synced bills |
| POST | `/api/bills/sync` | Sync bills from Congress.gov |
| GET | `/api/bills/[id]` | Get bill detail + tally |
| POST | `/api/agent/vote` | Have agent vote on a bill |
| POST | `/api/agent/analyze` | Get AI analysis of a bill |
| GET | `/api/profile?user_id=` | Get user profile + vote history |
| GET | `/api/representatives` | Get aggregated People's Vote tallies |
