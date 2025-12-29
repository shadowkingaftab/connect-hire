import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { FileText, User, Calendar, Briefcase, ExternalLink, Filter, Loader2, Send, Mail } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: { name: string } | null;
}

interface Applicant {
  id: string;
  applicant_name: string | null;
  applicant_email: string | null;
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filtering state
  const [minExperience, setMinExperience] = useState<string>('');
  const [maxExperience, setMaxExperience] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Send to Boss modal state
  const [sendToBossOpen, setSendToBossOpen] = useState(false);
  const [bossEmail, setBossEmail] = useState('');
  const [optionalMessage, setOptionalMessage] = useState('');
  const [sendingToBoss, setSendingToBoss] = useState(false);

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
      .select('id, applicant_name, applicant_email, age, experience_years, resume_url, status, created_at')
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
    const job = jobs.find(j => j.id === jobId) || null;
    setSelectedJob(job);
    fetchApplicants(jobId);
    setMinExperience('');
    setMaxExperience('');
    setStatusFilter('all');
  };

  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const exp = applicant.experience_years ?? 0;
      const minExp = minExperience ? parseInt(minExperience) : 0;
      const maxExp = maxExperience ? parseInt(maxExperience) : Infinity;
      
      if (exp < minExp || exp > maxExp) return false;
      
      if (statusFilter !== 'all') {
        const applicantStatus = applicant.status || 'pending';
        if (applicantStatus !== statusFilter) return false;
      }
      
      return true;
    });
  }, [applicants, minExperience, maxExperience, statusFilter]);

  const shortlistedApplicants = useMemo(() => {
    return filteredApplicants.filter(a => a.status === 'shortlisted');
  }, [filteredApplicants]);

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
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  const handleSendToBoss = async () => {
    if (!bossEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Boss email is required',
      });
      return;
    }

    if (!selectedJob) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a job first',
      });
      return;
    }

    const applicantsToSend = shortlistedApplicants.length > 0 
      ? shortlistedApplicants 
      : filteredApplicants;

    if (applicantsToSend.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No applicants to send',
      });
      return;
    }

    setSendingToBoss(true);

    try {
      // Generate signed URLs for resumes
      const applicantsWithSignedUrls = await Promise.all(
        applicantsToSend.map(async (applicant) => {
          let signedResumeUrl: string | null = null;
          
          if (applicant.resume_url) {
            // Extract the path from the resume URL
            const urlParts = applicant.resume_url.split('/resumes/');
            if (urlParts.length > 1) {
              const filePath = urlParts[1];
              const { data } = await supabase.storage
                .from('resumes')
                .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry
              signedResumeUrl = data?.signedUrl || applicant.resume_url;
            } else {
              signedResumeUrl = applicant.resume_url;
            }
          }

          return {
            name: applicant.applicant_name || 'Unknown',
            age: applicant.age,
            experienceYears: applicant.experience_years,
            resumeUrl: signedResumeUrl,
          };
        })
      );

      const { error } = await supabase.functions.invoke('send-to-boss', {
        body: {
          bossEmail: bossEmail.trim(),
          jobTitle: selectedJob.title,
          companyName: selectedJob.company?.name || 'Our Company',
          optionalMessage: optionalMessage.trim() || undefined,
          shortlistedApplicants: applicantsWithSignedUrls,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email Sent!',
        description: `Shortlisted candidates sent to ${bossEmail}`,
      });

      setSendToBossOpen(false);
      setBossEmail('');
      setOptionalMessage('');
    } catch (error) {
      console.error('Error sending to boss:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send',
        description: 'Could not send email to boss. Please check Resend configuration.',
      });
    } finally {
      setSendingToBoss(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl border-2 border-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Applicants</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Job Posting</Label>
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

            {/* Filters */}
            {selectedJobId && (
              <Card className="border-2 border-foreground bg-secondary/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter Applicants</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Min Experience (years)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={minExperience}
                        onChange={(e) => setMinExperience(e.target.value)}
                        placeholder="0"
                        className="border-2 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Experience (years)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={maxExperience}
                        onChange={(e) => setMaxExperience(e.target.value)}
                        placeholder="Any"
                        className="border-2 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="border-2 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Send to Boss Button */}
            {selectedJobId && filteredApplicants.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setSendToBossOpen(true)}
                  className="border-2 border-foreground bg-primary"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Boss ({shortlistedApplicants.length > 0 ? shortlistedApplicants.length : filteredApplicants.length} candidates)
                </Button>
              </div>
            )}

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

            {!loading && selectedJobId && applicants.length > 0 && filteredApplicants.length === 0 && (
              <Card className="border-2 border-foreground p-8 text-center">
                <p className="text-muted-foreground">No applicants match your filters.</p>
              </Card>
            )}

            {!loading && filteredApplicants.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredApplicants.length} of {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
                  {shortlistedApplicants.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({shortlistedApplicants.length} shortlisted)
                    </span>
                  )}
                </p>
                
                {filteredApplicants.map((applicant) => (
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
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {applicant.applicant_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {applicant.applicant_email}
                                </span>
                              )}
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
                      <div className="flex flex-col gap-4">
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
                        
                        <div className="flex flex-wrap gap-2">
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
                            onClick={() => updateApplicationStatus(applicant.id, 'shortlisted')}
                            className="border-2 border-foreground bg-blue-600 hover:bg-blue-700"
                          >
                            Shortlist
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => updateApplicationStatus(applicant.id, 'selected')}
                            className="border-2 border-foreground bg-green-600 hover:bg-green-700"
                          >
                            Select
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

      {/* Send to Boss Modal */}
      <Dialog open={sendToBossOpen} onOpenChange={setSendToBossOpen}>
        <DialogContent className="sm:max-w-md border-2 border-foreground">
          <DialogHeader>
            <DialogTitle>Send Shortlisted Candidates to Boss</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-lg text-sm">
              <strong>{shortlistedApplicants.length > 0 ? shortlistedApplicants.length : filteredApplicants.length}</strong> candidate(s) will be included:
              <ul className="mt-2 space-y-1">
                {(shortlistedApplicants.length > 0 ? shortlistedApplicants : filteredApplicants).slice(0, 5).map(a => (
                  <li key={a.id} className="text-muted-foreground">
                    • {a.applicant_name || 'Unknown'} ({a.experience_years ?? 0} years exp.)
                  </li>
                ))}
                {(shortlistedApplicants.length > 0 ? shortlistedApplicants : filteredApplicants).length > 5 && (
                  <li className="text-muted-foreground">
                    ...and {(shortlistedApplicants.length > 0 ? shortlistedApplicants.length : filteredApplicants.length) - 5} more
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bossEmail">Boss Email *</Label>
              <Input
                id="bossEmail"
                type="email"
                placeholder="boss@company.com"
                value={bossEmail}
                onChange={(e) => setBossEmail(e.target.value)}
                className="border-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionalMessage">Optional Message</Label>
              <Textarea
                id="optionalMessage"
                placeholder="Add a note for the boss..."
                value={optionalMessage}
                onChange={(e) => setOptionalMessage(e.target.value)}
                className="border-2 min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSendToBoss}
              disabled={sendingToBoss || !bossEmail.trim()}
              className="w-full border-2 border-foreground"
            >
              {sendingToBoss ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email to Boss
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
