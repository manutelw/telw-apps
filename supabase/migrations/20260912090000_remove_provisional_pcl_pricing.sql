-- PCL pricing has not been approved. Remove the provisional catalogue entry
-- while preserving the generic subscription and entitlement infrastructure.
delete from public.clarion_products p
where p.code = 'PCL'
  and not exists (
    select 1 from public.clarion_product_payment_orders o where o.product_code = p.code
  )
  and not exists (
    select 1 from public.clarion_product_entitlements e where e.product_code = p.code
  );
