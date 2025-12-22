import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
}

interface CreateJobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateJobForm({
  open,
  onOpenChange,
  onSuccess,
}: CreateJobFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [minimumExperience, setMinimumExperience] = useState('0');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setCompanies(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyId) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('jobs').insert({
        title,
        company_id: companyId,
        user_id: user.id,
        job_type: jobType,
        location: location || null,
        salary_range: salaryRange || null,
        minimum_experience: parseInt(minimumExperience),
        description: description || null,
        requirements: requirements || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: 'Job Posted!',
        description: 'Your job listing is now live',
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create job posting. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCompanyId('');
    setJobType('Full-time');
    setLocation('');
    setSalaryRange('');
    setMinimumExperience('0');
    setDescription('');
    setRequirements('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-2 border-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Posting</DialogTitle>
          <DialogDescription>
            Fill in the details to post a new job opening
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select value={companyId} onValueChange={setCompanyId} required>
              <SelectTrigger className="border-2">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type *</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Min. Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="30"
                value={minimumExperience}
                onChange={(e) => setMinimumExperience(e.target.value)}
                className="border-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $80k - $120k"
                className="border-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role and responsibilities..."
              rows={3}
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="List the skills and qualifications required..."
              rows={3}
              className="border-2"
            />
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
              disabled={loading || !title || !companyId}
              className="flex-1 border-2 border-foreground"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
