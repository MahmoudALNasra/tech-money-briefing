-- Admin audit trail for credit adjustments and refunds

create table if not exists public.business_data_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  target_user_id uuid not null,
  action_type text not null,
  credit_delta integer not null default 0,
  stripe_refund_id text,
  stripe_session_id text,
  ledger_entry_id uuid,
  report_job_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_data_admin_actions_target_created_idx
  on public.business_data_admin_actions (target_user_id, created_at desc);

create index if not exists business_data_admin_actions_admin_created_idx
  on public.business_data_admin_actions (admin_user_id, created_at desc);

create unique index if not exists business_data_admin_actions_operation_refund_unique
  on public.business_data_admin_actions (target_user_id, report_job_id)
  where action_type = 'operation_credit_refund' and report_job_id is not null;

create unique index if not exists business_data_admin_actions_stripe_refund_unique
  on public.business_data_admin_actions (ledger_entry_id)
  where action_type = 'stripe_refund' and ledger_entry_id is not null;

alter table public.business_data_admin_actions enable row level security;
