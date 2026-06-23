-- 1. Ensure the users_profile table exists
create table if not exists public.users_profile (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique,
    full_name text,
    phone text,
    role text not null default 'Viewer',
    created_at timestamptz not null default now()
  );

-- 2. Enable Row Level Security (RLS)
alter table public.users_profile enable row level security;

-- 3. Create RLS Policies for users_profile
-- Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Authenticated users can read profiles" on public.users_profile;
drop policy if exists "Admins can manage profiles" on public.users_profile;

-- Allow all authenticated users to read profiles
create policy "Authenticated users can read profiles"
  on public.users_profile
  for select
  using (auth.role() = 'authenticated');

-- Allow users with Admin role to modify profiles
create policy "Admins can manage profiles"
  on public.users_profile
  for all
  using (
    (select role from public.users_profile where user_id = auth.uid()) = 'Admin'
  );

-- 4. Create trigger to automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_profile (user_id, full_name, phone, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      nullif(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'role', 'Viewer')
    );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to prevent duplicate trigger issues
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Helper function to check user roles in policies
create or replace function public.get_user_role()
returns text as $$
declare
  user_role text;
begin
  select role into user_role
  from public.users_profile
  where user_id = auth.uid()
  limit 1;
  return coalesce(user_role, 'Viewer');
end;
$$ language plpgsql security definer;

-- 6. Add missing UPDATE and DELETE policies for authenticated users based on their roles
-- projects: Admin only
drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects for update
  to authenticated
  using (public.get_user_role() = 'Admin')
  with check (public.get_user_role() = 'Admin');

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete
  to authenticated
  using (public.get_user_role() = 'Admin');

-- project_wbs_master: Admin and Cost Controller
drop policy if exists "Admins and Cost Controllers can update wbs master" on public.project_wbs_master;
create policy "Admins and Cost Controllers can update wbs master"
  on public.project_wbs_master for update
  to authenticated
  using (public.get_user_role() in ('Admin', 'Cost Controller'))
  with check (public.get_user_role() in ('Admin', 'Cost Controller'));

-- project_subcontracts: Admin and Cost Controller
drop policy if exists "Admins and Cost Controllers can update subcontracts" on public.project_subcontracts;
create policy "Admins and Cost Controllers can update subcontracts"
  on public.project_subcontracts for update
  to authenticated
  using (public.get_user_role() in ('Admin', 'Cost Controller'))
  with check (public.get_user_role() in ('Admin', 'Cost Controller'));

-- project_manpower_rates: Admin and Cost Controller
drop policy if exists "Admins and Cost Controllers can update manpower rates" on public.project_manpower_rates;
create policy "Admins and Cost Controllers can update manpower rates"
  on public.project_manpower_rates for update
  to authenticated
  using (public.get_user_role() in ('Admin', 'Cost Controller'))
  with check (public.get_user_role() in ('Admin', 'Cost Controller'));

-- project_material_master: Admin and Cost Controller
drop policy if exists "Admins and Cost Controllers can update material master" on public.project_material_master;
create policy "Admins and Cost Controllers can update material master"
  on public.project_material_master for update
  to authenticated
  using (public.get_user_role() in ('Admin', 'Cost Controller'))
  with check (public.get_user_role() in ('Admin', 'Cost Controller'));
