Database Enumerated Types
status_enum	- complete, incomplete

Database Tables

public.issues (
  id uuid not null default gen_random_uuid (),
  image_id text null,
  group_id bigint null,
  description text null,
  geolocation text null,
  timestamp timestamp with time zone not null,
  status public.status_enum null,
  priority bigint null,
  uid uuid null,
  constraint issues_pkey primary key (id)
)

public.groups (
  id int8 not null default nextval('groups_id_seq'::regclass),
  created_at timestamp with time zone null default now(),
  name text null,
  constraint groups_pkey primary key (id)
)