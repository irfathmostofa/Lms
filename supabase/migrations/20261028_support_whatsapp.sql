insert into public.settings (group_name, key, value, value_type, is_public)
values ('general', 'support_whatsapp', '+8801700000000', 'text', true)
on conflict (key) do nothing;
