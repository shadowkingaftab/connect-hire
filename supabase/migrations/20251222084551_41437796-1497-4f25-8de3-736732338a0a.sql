-- Allow employers to update application status for their jobs
CREATE POLICY "Employers can update applications for their jobs" 
ON public.job_applications FOR UPDATE 
USING (public.is_job_owner(auth.uid(), job_id))
WITH CHECK (public.is_job_owner(auth.uid(), job_id));