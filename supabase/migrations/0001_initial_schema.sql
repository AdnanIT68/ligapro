-- LigaPro initial schema: competitions, teams, players, matches and match events.
-- Organizers own competitions; everything inside a competition is public to read
-- (the public league page needs no login) and writable only by its organizer.

create extension if not exists "pgcrypto";

create type competition_format as enum ('league', 'knockout');
create type match_status as enum ('scheduled', 'live', 'finished', 'postponed');
create type match_event_type as enum ('goal', 'own_goal', 'yellow_card', 'red_card');

create table competitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  sport text not null default 'futsal',
  format competition_format not null default 'league',
  season text,
  points_win smallint not null default 3,
  points_draw smallint not null default 1,
  points_loss smallint not null default 0,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  short_name text check (char_length(short_name) <= 5),
  color text check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  shirt_number smallint check (shirt_number between 0 and 99),
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  round smallint not null check (round > 0),
  home_team_id uuid not null references teams (id) on delete cascade,
  away_team_id uuid not null references teams (id) on delete cascade,
  kickoff_at timestamptz,
  venue text,
  status match_status not null default 'scheduled',
  home_score smallint check (home_score >= 0),
  away_score smallint check (away_score >= 0),
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create table match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  player_id uuid references players (id) on delete set null,
  team_id uuid not null references teams (id) on delete cascade,
  type match_event_type not null,
  minute smallint check (minute between 0 and 200),
  created_at timestamptz not null default now()
);

create index on teams (competition_id);
create index on players (team_id);
create index on matches (competition_id, round);
create index on match_events (match_id);

-- Standings are derived, never stored, so they can't drift from the results.
create view standings with (security_invoker = true) as
with results as (
  select m.competition_id, m.home_team_id as team_id, m.home_score as gf, m.away_score as ga
  from matches m where m.status = 'finished'
  union all
  select m.competition_id, m.away_team_id, m.away_score, m.home_score
  from matches m where m.status = 'finished'
)
select
  t.competition_id,
  t.id as team_id,
  t.name as team_name,
  count(r.team_id)::int as played,
  count(*) filter (where r.gf > r.ga)::int as won,
  count(*) filter (where r.gf = r.ga)::int as drawn,
  count(*) filter (where r.gf < r.ga)::int as lost,
  coalesce(sum(r.gf), 0)::int as goals_for,
  coalesce(sum(r.ga), 0)::int as goals_against,
  (coalesce(sum(r.gf), 0) - coalesce(sum(r.ga), 0))::int as goal_difference,
  (count(*) filter (where r.gf > r.ga) * c.points_win
   + count(*) filter (where r.gf = r.ga) * c.points_draw
   + count(*) filter (where r.gf < r.ga) * c.points_loss)::int as points
from teams t
join competitions c on c.id = t.competition_id
left join results r on r.team_id = t.id
group by t.competition_id, t.id, t.name, c.points_win, c.points_draw, c.points_loss;

create view top_scorers with (security_invoker = true) as
select
  m.competition_id,
  p.id as player_id,
  p.full_name,
  e.team_id,
  count(*)::int as goals
from match_events e
join matches m on m.id = e.match_id
join players p on p.id = e.player_id
where e.type = 'goal'
group by m.competition_id, p.id, p.full_name, e.team_id;

-- Row level security: public read, organizer write.
alter table competitions enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;

create function is_competition_owner(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from competitions where id = cid and owner_id = auth.uid());
$$;

create policy "competitions are public" on competitions for select using (true);
create policy "owners create competitions" on competitions for insert with check (owner_id = auth.uid());
create policy "owners update competitions" on competitions for update using (owner_id = auth.uid());
create policy "owners delete competitions" on competitions for delete using (owner_id = auth.uid());

create policy "teams are public" on teams for select using (true);
create policy "owners manage teams" on teams for all
  using (is_competition_owner(competition_id)) with check (is_competition_owner(competition_id));

create policy "players are public" on players for select using (true);
create policy "owners manage players" on players for all
  using (is_competition_owner((select competition_id from teams where id = team_id)))
  with check (is_competition_owner((select competition_id from teams where id = team_id)));

create policy "matches are public" on matches for select using (true);
create policy "owners manage matches" on matches for all
  using (is_competition_owner(competition_id)) with check (is_competition_owner(competition_id));

create policy "match events are public" on match_events for select using (true);
create policy "owners manage match events" on match_events for all
  using (is_competition_owner((select competition_id from matches where id = match_id)))
  with check (is_competition_owner((select competition_id from matches where id = match_id)));
