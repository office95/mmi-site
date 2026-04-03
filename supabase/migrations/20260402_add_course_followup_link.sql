alter table public.courses
  add column if not exists source_course_id uuid references public.courses(id) on delete set null;

create index if not exists idx_courses_source_course_id on public.courses(source_course_id);
