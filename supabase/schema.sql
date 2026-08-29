-- ============================================================
-- GitHub Insights — Supabase database schema
-- Run this in the Supabase SQL editor to set up the database.
-- ============================================================

-- profiles
-- Linked 1-to-1 with auth.users via the id foreign key.
-- Created automatically when a new user signs up via the trigger below.
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text not null,
  role                text not null default 'user' check (role in ('user', 'admin')),
  stripe_customer_id  text,
  subscription_status text not null default 'free'
                        check (subscription_status in ('free', 'active', 'past_due', 'canceled')),
  created_at          timestamptz not null default now()
);

-- Row Level Security: users can only read/update their own profile.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Automatically create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
