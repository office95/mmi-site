-- Region-Spalten für Meta-Tabellen (optional), NULL = global/ALL
ALTER TABLE public.course_categories ADD COLUMN IF NOT EXISTS region text CHECK (region IN ('AT','DE'));
ALTER TABLE public.course_types ADD COLUMN IF NOT EXISTS region text CHECK (region IN ('AT','DE'));
ALTER TABLE public.course_formats ADD COLUMN IF NOT EXISTS region text CHECK (region IN ('AT','DE'));
ALTER TABLE public.course_languages ADD COLUMN IF NOT EXISTS region text CHECK (region IN ('AT','DE'));

CREATE INDEX IF NOT EXISTS idx_course_categories_region ON public.course_categories(region);
CREATE INDEX IF NOT EXISTS idx_course_types_region ON public.course_types(region);
CREATE INDEX IF NOT EXISTS idx_course_formats_region ON public.course_formats(region);
CREATE INDEX IF NOT EXISTS idx_course_languages_region ON public.course_languages(region);
