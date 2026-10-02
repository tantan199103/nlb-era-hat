-- Guest order tracking needs a narrowly scoped lookup.  The normal orders
-- SELECT policy intentionally hides guest rows from an anonymous browser, so
-- exposing the table directly would either break tracking or weaken RLS.
-- This SECURITY DEFINER function returns one row only when both the order
-- reference and checkout email match exactly (case-insensitive).

create or replace function public.lookup_order_for_tracking(
  p_order_number text,
  p_email text
)
returns table (
  order_number text,
  status text,
  customer_email text,
  tracking_number text,
  shipping_address jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    o.order_number,
    o.status,
    o.customer_email,
    o.tracking_number,
    o.shipping_address,
    o.created_at,
    o.updated_at
  from public.orders o
  where upper(trim(o.order_number)) = upper(trim(p_order_number))
    and lower(trim(coalesce(o.customer_email, ''))) = lower(trim(coalesce(p_email, '')))
  limit 1;
$$;

revoke all on function public.lookup_order_for_tracking(text, text) from public;
grant execute on function public.lookup_order_for_tracking(text, text) to anon, authenticated;
