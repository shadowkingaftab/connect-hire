-- Add email column to job_applications for sending emails
ALTER TABLE public.job_applications 
ADD COLUMN applicant_email TEXT;