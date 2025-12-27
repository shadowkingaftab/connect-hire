import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

interface JobApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  onSuccess: () => void;
}

export default function JobApplicationForm({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: JobApplicationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data?.full_name) {
      setFullName(data.full_name);
    }
    
    // Set email from user auth
    if (user.email) {
      setEmail(user.email);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please upload a PDF file only',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Resume must be less than 5MB',
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resumeFile) return;

    setLoading(true);

    try {
      // Upload resume to storage
      const fileExt = resumeFile.name.split('.').pop();
      const filePath = `${user.id}/${jobId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Create application
      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          applicant_name: fullName,
          applicant_email: email,
          age: parseInt(age),
          experience_years: parseInt(experienceYears),
          resume_url: urlData.publicUrl,
        });

      if (appError) {
        if (appError.code === '23505') {
          toast({
            variant: 'destructive',
            title: 'Already Applied',
            description: 'You have already applied for this job',
          });
        } else {
          throw appError;
        }
      } else {
        toast({
          title: 'Application Submitted!',
          description: 'Your application has been sent to the employer',
        });
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAge('');
    setExperienceYears('');
    setResumeFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-foreground">
        <DialogHeader>
          <DialogTitle>Apply for Position</DialogTitle>
          <DialogDescription>{jobTitle}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="100"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              max="50"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="Enter years of experience"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF only)</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="resume"
                className="flex-1 flex items-center gap-2 p-3 border-2 border-dashed border-foreground cursor-pointer hover:bg-secondary transition-colors"
              >
                {resumeFile ? (
                  <>
                    <FileText className="h-5 w-5" />
                    <span className="text-sm truncate">{resumeFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload PDF
                    </span>
                  </>
                )}
              </label>
              <input
                id="resume"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !resumeFile}
              className="flex-1 border-2 border-foreground"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
