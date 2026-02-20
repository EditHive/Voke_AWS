-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_questions table
CREATE TABLE IF NOT EXISTS public.company_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    frequency FLOAT,
    acceptance_rate FLOAT,
    url TEXT,
    topics TEXT[],
    period TEXT, -- "30 Days", "6 Months", etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, title, period) -- Prevent duplicates for same period
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow read to everyone, write only to service_role or admin if needed)
CREATE POLICY "Allow public read access on companies"
ON public.companies FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access on company_questions"
ON public.company_questions FOR SELECT
TO public
USING (true);
