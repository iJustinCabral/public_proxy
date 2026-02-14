-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Political profile built from questionnaire answers
CREATE TABLE IF NOT EXISTS political_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  -- Scores from -1.0 (left/libertarian) to 1.0 (right/authoritarian)
  economic_score REAL DEFAULT 0,       -- left (-1) to right (1)
  social_score REAL DEFAULT 0,         -- progressive (-1) to conservative (1)
  foreign_policy_score REAL DEFAULT 0, -- non-interventionist (-1) to interventionist (1)
  environment_score REAL DEFAULT 0,    -- strong regulation (-1) to deregulation (1)
  healthcare_score REAL DEFAULT 0,     -- universal (-1) to market-based (1)
  immigration_score REAL DEFAULT 0,    -- open (-1) to restrictive (1)
  gun_policy_score REAL DEFAULT 0,     -- strict control (-1) to gun rights (1)
  education_score REAL DEFAULT 0,      -- public investment (-1) to school choice (1)
  -- Raw questionnaire answers stored as JSON
  questionnaire_answers TEXT DEFAULT '{}',
  -- Free-text values and priorities from the user
  core_values TEXT DEFAULT '',
  top_priorities TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Bills synced from Congress.gov
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  congress INTEGER NOT NULL,
  bill_type TEXT NOT NULL,        -- hr, s, hjres, sjres, etc.
  bill_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  short_title TEXT,
  summary TEXT,                    -- Official summary from Congress.gov
  ai_summary TEXT,                 -- AI-generated plain-English summary
  latest_action_text TEXT,
  latest_action_date TEXT,
  introduced_date TEXT,
  sponsor_name TEXT,
  sponsor_party TEXT,
  sponsor_state TEXT,
  policy_area TEXT,
  subjects TEXT DEFAULT '[]',      -- JSON array of subject tags
  full_text_url TEXT,
  congress_url TEXT,
  status TEXT DEFAULT 'introduced', -- introduced, passed_house, passed_senate, enacted, vetoed
  synced_at TEXT DEFAULT (datetime('now')),
  UNIQUE(congress, bill_type, bill_number)
);

-- AI agent votes on behalf of users
CREATE TABLE IF NOT EXISTS agent_votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  bill_id TEXT NOT NULL REFERENCES bills(id),
  vote TEXT NOT NULL CHECK(vote IN ('yea', 'nay', 'abstain')),
  confidence REAL NOT NULL DEFAULT 0.5,  -- 0.0 to 1.0 how confident the agent is
  reasoning TEXT NOT NULL,                -- AI explanation of why it voted this way
  key_factors TEXT DEFAULT '[]',          -- JSON array of factors that influenced the vote
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, bill_id)
);

-- Aggregated representative view (district/state-level)
CREATE TABLE IF NOT EXISTS representative_tallies (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id),
  total_yea INTEGER DEFAULT 0,
  total_nay INTEGER DEFAULT 0,
  total_abstain INTEGER DEFAULT 0,
  consensus_vote TEXT,             -- majority result
  consensus_reasoning TEXT,        -- AI-aggregated reasoning
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(bill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bills_congress ON bills(congress);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_agent_votes_user ON agent_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_votes_bill ON agent_votes(bill_id);
CREATE INDEX IF NOT EXISTS idx_political_profiles_user ON political_profiles(user_id);
