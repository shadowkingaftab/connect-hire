import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, User, Calendar, Briefcase, ExternalLink } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: { name: string } | null;
}

interface Applicant {
  id: string;
  applicant_name: string | null;
  age: number | null;
  experience_years: number | null;
  resume_url: string | null;
  status: string | null;
  created_at: string;
}

interface ViewApplicantsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewApplicants({
  open,
  onOpenChange,
}: ViewApplicantsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchEmployerJobs();
    }
  }, [open, user]);

  const fetchEmployerJobs = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company:companies(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs(data || []);
    }
  };

  const fetchApplicants = async (jobId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('job_applications')
      .select('id, applicant_name, age, experience_years, resume_url, status, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching applicants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load applicants',
      });
    } else {
      setApplicants(data || []);
    }
    setLoading(false);
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    fetchApplicants(jobId);
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    const { error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status',
      });
    } else {
      setApplicants(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
      toast({
        title: 'Status Updated',
        description: `Application marked as ${status}`,
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-2 border-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Applicants</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Job Posting</label>
            <Select value={selectedJobId} onValueChange={handleJobSelect}>
              <SelectTrigger className="border-2">
                <SelectValue placeholder="Choose a job to view applicants" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} {job.company ? `- ${job.company.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading applicants...
            </div>
          )}

          {!loading && selectedJobId && applicants.length === 0 && (
            <Card className="border-2 border-foreground p-8 text-center">
              <p className="text-muted-foreground">No applications received yet.</p>
            </Card>
          )}

          {!loading && applicants.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
              </p>
              
              {applicants.map((applicant) => (
                <Card key={applicant.id} className="border-2 border-foreground">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-foreground bg-secondary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {applicant.applicant_name || 'Unknown'}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {applicant.age && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {applicant.age} years old
                              </span>
                            )}
                            {applicant.experience_years !== null && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {applicant.experience_years} years exp.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(applicant.status)}`}>
                        {applicant.status || 'pending'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      {applicant.resume_url && (
                        <a
                          href={applicant.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Resume
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(applicant.id, 'reviewed')}
                          className="border-2"
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(applicant.id, 'interviewed')}
                          className="border-2"
                        >
                          Interviewed
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateApplicationStatus(applicant.id, 'hired')}
                          className="border-2 border-foreground bg-green-600 hover:bg-green-700"
                        >
                          Hire
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateApplicationStatus(applicant.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
