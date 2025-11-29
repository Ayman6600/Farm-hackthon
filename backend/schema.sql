-- =========================
-- ENUM TYPES
-- =========================

-- Soil types
create type soil_type_enum as enum ('sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky', 'unknown');

-- Irrigation types
create type irrigation_type_enum as enum ('drip', 'flood', 'sprinkler', 'rainfed', 'other');

-- Crop stage
create type crop_stage_enum as enum ('seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested', 'unknown');

-- Alert types
create type alert_type_enum as enum ('pest_risk', 'fungal_risk', 'water_stress', 'weed_risk', 'other');

-- Alert severity
create type alert_severity_enum as enum ('low', 'medium', 'high');

-- Water need level
create type water_need_level_enum as enum ('low', 'medium', 'high');

-- Rewards tier
create type rewards_tier_enum as enum ('none', 'bronze', 'silver', 'gold');

-- =========================
-- PROFILES (linked to auth.users)
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  region text,
  preferred_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_email on public.profiles (email);

-- =========================
-- FARMS
-- =========================

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  location_text text,
  primary_crops jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_farms_user_id on public.farms (user_id);

-- =========================
-- FIELDS
-- =========================

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null,
  area_hectares numeric(10, 2),
  soil_type soil_type_enum default 'unknown',
  irrigation_type irrigation_type_enum default 'other',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_fields_farm_id on public.fields (farm_id);

-- =========================
-- CROPS (per field)
-- =========================

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  name text not null,
  variety text,
  sowing_date date,
  expected_harvest_date date,
  current_stage crop_stage_enum default 'unknown',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_crops_field_id on public.crops (field_id);

-- =========================
-- ACTIONS (logged gigs)
-- =========================

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  field_id uuid references public.fields (id) on delete set null,
  crop_id uuid references public.crops (id) on delete set null,
  action_type text not null, -- e.g. irrigation, fertilization, weeding, pesticide, scouting
  action_timestamp timestamptz not null default now(),
  quantity numeric,
  unit text, -- e.g. liters, kg, hours
  notes text,
  voice_transcript text,
  raw_voice_file_url text,
  created_at timestamptz default now()
);

create index if not exists idx_actions_user_id on public.actions (user_id);
create index if not exists idx_actions_farm_field_crop on public.actions (farm_id, field_id, crop_id);
create index if not exists idx_actions_action_timestamp on public.actions (action_timestamp);

-- =========================
-- SENSOR READINGS
-- =========================

create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms (id) on delete cascade,
  field_id uuid references public.fields (id) on delete cascade,
  timestamp timestamptz not null default now(),
  soil_moisture numeric,
  soil_ph numeric,
  temperature numeric,
  humidity numeric,
  other_metrics jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_sensor_readings_farm_field on public.sensor_readings (farm_id, field_id);
create index if not exists idx_sensor_readings_timestamp on public.sensor_readings (timestamp);

-- =========================
-- SCORES (per day or per action)
-- =========================

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  field_id uuid references public.fields (id) on delete set null,
  crop_id uuid references public.crops (id) on delete set null,
  action_id uuid references public.actions (id) on delete set null,
  date date not null default current_date,
  soil_health_score integer check (soil_health_score between 0 and 100),
  smart_irrigation_score integer check (smart_irrigation_score between 0 and 100),
  sustainability_score integer check (sustainability_score between 0 and 100),
  weed_risk_score integer check (weed_risk_score between 0 and 100),
  created_at timestamptz default now()
);

create index if not exists idx_scores_user_date on public.scores (user_id, date);
create index if not exists idx_scores_farm_field_crop on public.scores (farm_id, field_id, crop_id);

-- =========================
-- ALERTS
-- =========================

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  field_id uuid references public.fields (id) on delete set null,
  crop_id uuid references public.crops (id) on delete set null,
  type alert_type_enum not null,
  severity alert_severity_enum not null,
  risk_score integer check (risk_score between 0 and 100),
  message text not null,
  suggested_action text,
  created_at timestamptz default now(),
  acknowledged boolean default false
);

create index if not exists idx_alerts_user_created on public.alerts (user_id, created_at);
create index if not exists idx_alerts_type_severity on public.alerts (type, severity);

-- =========================
-- MONTHLY REPORTS
-- =========================

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  farm_id uuid references public.farms (id) on delete set null,
  month text not null, -- e.g. '2025-11'
  summary_json jsonb not null,
  rewards_tier rewards_tier_enum default 'none',
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, farm_id, month)
);

create index if not exists idx_monthly_reports_user_month on public.monthly_reports (user_id, month);

-- =========================
-- CROP REFERENCE (static-ish metadata)
-- =========================

create table if not exists public.crop_reference (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_profit_per_hectare numeric,
  base_risk_level integer check (base_risk_level between 0 and 100),
  water_need_level water_need_level_enum,
  soil_preference jsonb, -- e.g. { "loamy": 80, "clay": 60 }
  created_at timestamptz default now()
);

create unique index if not exists idx_crop_reference_name on public.crop_reference (name);

-- =========================
-- MARKET PRICES
-- =========================

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  market_location text,
  date date not null,
  price_per_quintal numeric,
  created_at timestamptz default now()
);

create index if not exists idx_market_prices_crop_date on public.market_prices (crop_name, date);

-- =========================
-- BASIC RLS (optional but recommended)
-- =========================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.fields enable row level security;
alter table public.crops enable row level security;
alter table public.actions enable row level security;
alter table public.scores enable row level security;
alter table public.alerts enable row level security;
alter table public.monthly_reports enable row level security;

-- Profiles: users can see/update only their own profile
create policy "Profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Farms, fields, crops, actions, scores, alerts, reports:
-- restrict to rows belonging to current user
create policy "Farms: owner access" on public.farms
  for all using (user_id = auth.uid());

create policy "Fields: owner access" on public.fields
  for all using (farm_id in (select id from public.farms where user_id = auth.uid()));

create policy "Crops: owner access" on public.crops
  for all using (field_id in (
    select id from public.fields
    where farm_id in (select id from public.farms where user_id = auth.uid())
  ));

create policy "Actions: owner access" on public.actions
  for all using (user_id = auth.uid());

create policy "Scores: owner access" on public.scores
  for all using (user_id = auth.uid());

create policy "Alerts: owner access" on public.alerts
  for all using (user_id = auth.uid());

create policy "Reports: owner access" on public.monthly_reports
  for all using (user_id = auth.uid());
