alter table public.automation_logs
  add column if not exists automation_key text,
  add column if not exists locale text,
  add column if not exists context_type text,
  add column if not exists context_id text,
  add column if not exists html_preview text,
  add column if not exists text_preview text,
  add column if not exists template_version text,
  add column if not exists message_id text;

create index if not exists idx_automation_logs_sent_at on public.automation_logs(sent_at desc);
create index if not exists idx_automation_logs_context on public.automation_logs(context_type, context_id);
create index if not exists idx_automation_logs_recipient on public.automation_logs(recipient);
