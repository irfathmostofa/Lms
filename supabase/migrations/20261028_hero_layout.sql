insert into public.settings (group_name, key, value, value_type, is_public) values
  ('website','hero_layout','text','text',true)
on conflict (key) do nothing;
