-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('job_seeker', 'employer');

-- Create user_roles table for storing user roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create job_domains table
CREATE TABLE public.job_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_domains
ALTER TABLE public.job_domains ENABLE ROW LEVEL SECURITY;

-- Everyone can view job domains
CREATE POLICY "Anyone can view job domains" 
ON public.job_domains 
FOR SELECT 
USING (true);

-- Create companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain_id UUID NOT NULL REFERENCES public.job_domains(id) ON DELETE CASCADE,
    logo_url TEXT,
    description TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Everyone can view companies
CREATE POLICY "Anyone can view companies" 
ON public.companies 
FOR SELECT 
USING (true);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    job_type TEXT DEFAULT 'Full-time',
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active jobs
CREATE POLICY "Anyone can view active jobs" 
ON public.jobs 
FOR SELECT 
USING (is_active = true);

-- Create job_applications table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (job_id, user_id)
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create their own applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert sample job domains
INSERT INTO public.job_domains (name, description, icon) VALUES
('Technology', 'Software, IT, and Tech companies', 'Monitor'),
('Healthcare', 'Hospitals, clinics, and medical services', 'Heart'),
('Finance', 'Banking, insurance, and financial services', 'DollarSign'),
('Education', 'Schools, universities, and e-learning', 'GraduationCap'),
('Marketing', 'Advertising, PR, and digital marketing', 'Megaphone'),
('Manufacturing', 'Production and industrial companies', 'Factory');

-- Insert sample companies
INSERT INTO public.companies (name, domain_id, description, location) 
SELECT 'TechCorp Inc.', id, 'Leading software development company', 'San Francisco, CA'
FROM public.job_domains WHERE name = 'Technology';

INSERT INTO public.companies (name, domain_id, description, location) 
SELECT 'DataFlow Systems', id, 'Big data and analytics solutions', 'New York, NY'
FROM public.job_domains WHERE name = 'Technology';

INSERT INTO public.companies (name, domain_id, description, location) 
SELECT 'HealthFirst Medical', id, 'Premier healthcare provider', 'Boston, MA'
FROM public.job_domains WHERE name = 'Healthcare';

INSERT INTO public.companies (name, domain_id, description, location) 
SELECT 'GlobalBank', id, 'International banking services', 'Chicago, IL'
FROM public.job_domains WHERE name = 'Finance';

INSERT INTO public.companies (name, domain_id, description, location) 
SELECT 'EduTech Academy', id, 'Online education platform', 'Austin, TX'
FROM public.job_domains WHERE name = 'Education';

-- Insert sample jobs
INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Senior Software Engineer', c.id, 'Build scalable web applications', '5+ years experience in React/Node.js', '$120k - $160k', 'Full-time', 'San Francisco, CA'
FROM public.companies c WHERE c.name = 'TechCorp Inc.';

INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Frontend Developer', c.id, 'Create beautiful user interfaces', '3+ years experience in React', '$90k - $120k', 'Full-time', 'Remote'
FROM public.companies c WHERE c.name = 'TechCorp Inc.';

INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Data Analyst', c.id, 'Analyze large datasets for insights', 'Experience with SQL and Python', '$80k - $110k', 'Full-time', 'New York, NY'
FROM public.companies c WHERE c.name = 'DataFlow Systems';

INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Registered Nurse', c.id, 'Provide patient care', 'RN license required', '$70k - $90k', 'Full-time', 'Boston, MA'
FROM public.companies c WHERE c.name = 'HealthFirst Medical';

INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Financial Analyst', c.id, 'Analyze financial data and trends', 'CFA preferred', '$85k - $115k', 'Full-time', 'Chicago, IL'
FROM public.companies c WHERE c.name = 'GlobalBank';

INSERT INTO public.jobs (title, company_id, description, requirements, salary_range, job_type, location)
SELECT 'Course Developer', c.id, 'Create engaging online courses', 'Experience in instructional design', '$65k - $85k', 'Full-time', 'Austin, TX'
FROM public.companies c WHERE c.name = 'EduTech Academy';