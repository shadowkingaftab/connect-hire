import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, LogOut, Briefcase, Plus, Eye, MapPin, DollarSign } from 'lucide-react';
import CreateJobForm from '@/components/CreateJobForm';
import ViewApplicants from '@/components/ViewApplicants';

interface Job {
  id: string;
  title: string;
  job_type: string | null;
  location: string | null;
  salary_range: string | null;
  is_active: boolean | null;
  created_at: string;
  company: { name: string } | null;
  _count?: { applications: number };
}

interface Stats {
  activeJobs: number;
  totalApplications: number;
}

export default function EmployerDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ activeJobs: 0, totalApplications: 0 });
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [viewApplicantsOpen, setViewApplicantsOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== 'employer')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);

    // Fetch employer's jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, job_type, location, salary_range, is_active, created_at, company:companies(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!jobsError && jobsData) {
      setJobs(jobsData);
      setStats(prev => ({ ...prev, activeJobs: jobsData.filter(j => j.is_active).length }));
    }

    // Fetch total applications count
    const { count } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .in('job_id', jobsData?.map(j => j.id) || []);

    setStats(prev => ({ ...prev, totalApplications: count || 0 }));
    setLoadingData(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleJobActive = async (jobId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: !currentActive })
      .eq('id', jobId);

    if (!error) {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, is_active: !currentActive } : job
        )
      );
      setStats(prev => ({
        ...prev,
        activeJobs: prev.activeJobs + (!currentActive ? 1 : -1),
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-foreground bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">JobConnect</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" onClick={handleSignOut} className="border-2 gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Employer Dashboard</h2>
            <p className="text-muted-foreground">Manage your job listings and applications</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setCreateJobOpen(true)} 
              className="border-2 border-foreground gap-2"
            >
              <Plus className="h-4 w-4" />
              Post Job
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setViewApplicantsOpen(true)} 
              className="border-2 gap-2"
            >
              <Eye className="h-4 w-4" />
              View Applicants
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setCreateJobOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Post New Job</CardTitle>
                  <CardDescription>Create a job listing</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setViewApplicantsOpen(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>View Applicants</CardTitle>
                  <CardDescription>Review applications</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-foreground shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Coming soon</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-foreground text-center p-6">
            <div className="text-4xl font-bold mb-2">{stats.activeJobs}</div>
            <div className="text-muted-foreground">Active Jobs</div>
          </Card>
          <Card className="border-2 border-foreground text-center p-6">
            <div className="text-4xl font-bold mb-2">{stats.totalApplications}</div>
            <div className="text-muted-foreground">Total Applications</div>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Your Job Postings</h3>
          
          {loadingData ? (
            <Card className="border-2 border-foreground p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </Card>
          ) : jobs.length === 0 ? (
            <Card className="border-2 border-foreground p-8 text-center bg-secondary">
              <h3 className="text-xl font-bold mb-2">Get Started</h3>
              <p className="text-muted-foreground mb-4">
                Post your first job to start receiving applications.
              </p>
              <Button 
                onClick={() => setCreateJobOpen(true)} 
                className="border-2 border-foreground"
              >
                Post Your First Job
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="border-2 border-foreground">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {job.title}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            job.is_active ? 'bg-green-100 text-green-800' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {job.company.name}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="px-2 py-0.5 border border-foreground bg-secondary">
                              {job.job_type}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          {job.salary_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {job.salary_range}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobActive(job.id, job.is_active ?? true)}
                        className="border-2 shrink-0"
                      >
                        {job.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateJobForm
        open={createJobOpen}
        onOpenChange={setCreateJobOpen}
        onSuccess={fetchData}
      />

      <ViewApplicants
        open={viewApplicantsOpen}
        onOpenChange={setViewApplicantsOpen}
      />
    </div>
  );
}
