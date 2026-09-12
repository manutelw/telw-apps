create or replace function public.clarion_finalize_product_payment(
  p_order_id uuid,
  p_user_id uuid,
  p_payment_id text,
  p_provider_response jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.clarion_product_payment_orders%rowtype;
  v_product public.clarion_products%rowtype;
  v_entitlement public.clarion_product_entitlements%rowtype;
  v_expiry timestamptz;
  v_limit integer;
begin
  select * into v_order
  from public.clarion_product_payment_orders
  where id = p_order_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'PAYMENT_ORDER_NOT_FOUND';
  end if;

  if v_order.payment_status = 'PAID' then
    select * into v_entitlement
    from public.clarion_product_entitlements
    where user_id = p_user_id and product_code = v_order.product_code;
    return jsonb_build_object('already_verified', true, 'entitlement', to_jsonb(v_entitlement));
  end if;

  select * into strict v_product
  from public.clarion_products
  where code = v_order.product_code;

  select * into v_entitlement
  from public.clarion_product_entitlements
  where user_id = p_user_id and product_code = v_order.product_code
  for update;

  v_expiry := greatest(coalesce(v_entitlement.expires_at, now()), now())
    + make_interval(days => v_product.duration_days);
  v_limit := case
    when v_product.usage_limit is null then null
    else v_product.usage_limit + greatest(0, coalesce(v_entitlement.usage_limit, 0) - coalesce(v_entitlement.usage_used, 0))
  end;

  insert into public.clarion_product_entitlements
    (user_id, product_code, status, starts_at, expires_at, usage_limit, usage_used, source, updated_at)
  values
    (p_user_id, v_order.product_code, 'ACTIVE', now(), v_expiry, v_limit, 0, 'RAZORPAY', now())
  on conflict (user_id, product_code) do update set
    status = 'ACTIVE', starts_at = now(), expires_at = excluded.expires_at,
    usage_limit = excluded.usage_limit, usage_used = 0, source = 'RAZORPAY', updated_at = now()
  returning * into v_entitlement;

  update public.clarion_product_payment_orders
  set payment_status = 'PAID', razorpay_payment_id = p_payment_id,
      paid_at = now(), provider_response = p_provider_response, updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('already_verified', false, 'entitlement', to_jsonb(v_entitlement));
end;
$$;

revoke all on function public.clarion_finalize_product_payment(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.clarion_finalize_product_payment(uuid, uuid, text, jsonb) to service_role;
