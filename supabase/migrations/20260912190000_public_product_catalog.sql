-- Approved public ClarionPrep catalogue. Customer-facing access is 30 days or the
-- stated usage limit, whichever is reached first. CAT remains a per-attempt product.
insert into public.clarion_products
  (code,display_name,amount_paise,currency,duration_days,usage_limit,usage_label,launch_url,is_active,sort_order,updated_at)
values
  ('CAT_SIMULATOR','CAT Simulator',59900,'INR',30,1,'attempt','https://cat.clarionprep.com/',true,10,now()),
  ('WCT','Workplace Communication Test',650000,'INR',30,1200,'AI-active minutes','/workplace-communication-test/',true,20,now()),
  ('PI_PRACTICE','PI Practice',500000,'INR',30,1200,'AI-active minutes','/ascent/practice.html?quick=interview&paid=1',true,30,now()),
  ('GD_PRACTICE','GD Practice',700000,'INR',30,1200,'AI-active minutes','/ascent/practice.html?quick=gd&paid=1',true,40,now()),
  ('PI_LAB','PI Lab',800000,'INR',30,1200,'AI-active minutes','/pi-lab/',true,50,now()),
  ('GD_LAB','GD Lab',800000,'INR',30,1200,'AI-active minutes','/gd-lab/',true,60,now()),
  ('DIALOGUE_LAB','Dialogue Lab',850000,'INR',30,1200,'AI-active minutes','/dialogue-lab/',true,70,now()),
  ('PCL','PCL',850000,'INR',30,1200,'AI-active minutes','https://pcl-professional-communication-lab.pages.dev/',true,80,now()),
  ('LIVE_MOCK','Live Mock Interview',1200000,'INR',30,1200,'AI-active minutes','/live-mock/',true,90,now())
on conflict (code) do update set
  display_name=excluded.display_name,
  amount_paise=excluded.amount_paise,
  currency=excluded.currency,
  duration_days=excluded.duration_days,
  usage_limit=excluded.usage_limit,
  usage_label=excluded.usage_label,
  launch_url=excluded.launch_url,
  is_active=excluded.is_active,
  sort_order=excluded.sort_order,
  updated_at=now();