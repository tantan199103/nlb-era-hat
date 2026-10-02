-- Durable audit trail for every 1688 image-search attempt.
-- A search result is evidence for review only; it never publishes a product
-- by itself. The existing products.source_1688_status gate remains the final
-- sellability check.

create table if not exists public.source_1688_search_runs (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  provider text not null default '1688_IMAGE_SEARCH',
  image_url text not null,
  image_sha256 text not null default '',
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'SEARCHED', 'BLOCKED', 'ERROR')),
  candidates jsonb not null default '[]'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, provider, image_sha256)
);

create index if not exists source_1688_search_runs_product_idx
  on public.source_1688_search_runs(product_id, created_at desc);

create index if not exists source_1688_search_runs_status_idx
  on public.source_1688_search_runs(status, created_at);

alter table public.source_1688_search_runs enable row level security;

drop policy if exists "Admins manage 1688 search runs" on public.source_1688_search_runs;
create policy "Admins manage 1688 search runs"
  on public.source_1688_search_runs
  for all
  using (public.is_store_admin())
  with check (public.is_store_admin());

grant select, insert, update, delete on public.source_1688_search_runs to authenticated;

create or replace function public.touch_source_1688_search_run()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists source_1688_search_runs_touch on public.source_1688_search_runs;
create trigger source_1688_search_runs_touch
before update on public.source_1688_search_runs
for each row execute function public.touch_source_1688_search_run();

