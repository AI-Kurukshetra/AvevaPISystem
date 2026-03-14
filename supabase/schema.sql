create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  auth_user_id uuid references auth.users(id) on delete cascade,
  avatar_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table users add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table users add column if not exists avatar_url text;
alter table users add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_users_auth_user_id_unique on users(auth_user_id) where auth_user_id is not null;

create or replace function set_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_users_set_updated_at'
  ) then
    create trigger trg_users_set_updated_at
    before update on users
    for each row
    execute function set_users_updated_at();
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_public_read'
  ) then
    create policy profile_images_public_read
      on storage.objects
      for select
      using (bucket_id = 'profile-images');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_user_insert'
  ) then
    create policy profile_images_user_insert
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_user_update'
  ) then
    create policy profile_images_user_update
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'profile-images'
        and owner = auth.uid()
      )
      with check (
        bucket_id = 'profile-images'
        and owner = auth.uid()
      );
  end if;
end
$$;

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists production_lines (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  production_line_id uuid not null references production_lines(id) on delete cascade,
  name text not null,
  status text not null default 'RUNNING',
  created_at timestamptz not null default now()
);

create table if not exists sensors (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  tag_name text not null,
  unit text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists sensor_data (
  id uuid primary key default gen_random_uuid(),
  sensor_id uuid not null references sensors(id) on delete cascade,
  timestamp timestamptz not null,
  value numeric(12,3) not null,
  is_anomaly boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_sensor_data_sensor_time on sensor_data(sensor_id, timestamp desc);

create table if not exists alarms (
  id uuid primary key default gen_random_uuid(),
  sensor_id uuid not null references sensors(id) on delete cascade,
  operator text not null check (operator in ('>', '<')),
  threshold numeric(12,3) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  sensor_id uuid references sensors(id) on delete set null,
  alert_type text not null check (alert_type in ('THRESHOLD', 'ANOMALY')),
  message text not null,
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'sensor_data'
  ) then
    alter publication supabase_realtime add table sensor_data;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'alerts'
  ) then
    alter publication supabase_realtime add table alerts;
  end if;
end
$$;
