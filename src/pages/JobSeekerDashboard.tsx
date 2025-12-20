import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Monitor, Heart, DollarSign, GraduationCap, Megaphone, Factory,
  ArrowLeft, MapPin, Briefcase, LogOut, Building2, ChevronRight
} from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Company {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  job_type: string | null;
  location: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  DollarSign: <DollarSign className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Megaphone: <Megaphone className="h-6 w-6" />,
  Factory: <Factory className="h-6 w-6" />,
};

export default function JobSeekerDashboard() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || role !== 'job_seeker')) {
      navigate('/auth');
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    fetchDomains();
    if (user) {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from('job_domains')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load domains' });
    } else {
      setDomains(data || []);
    }
    setLoading(false);
  };

  const fetchCompanies = async (domainId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('domain_id', domainId)
      .order('name');
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load companies' });
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const fetchJobs = async (companyId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load jobs' });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const fetchAppliedJobs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('user_id', user.id);
    
    if (data) {
      setAppliedJobs(new Set(data.map(app => app.job_id)));
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        toast({ variant: 'destructive', title: 'Already Applied', description: 'You have already applied for this job' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit application' });
      }
    } else {
      setAppliedJobs(prev => new Set([...prev, jobId]));
      toast({ title: 'Application Submitted!', description: 'Your application has been sent to the employer' });
    }
  };

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain);
    setSelectedCompany(null);
    setJobs([]);
    fetchCompanies(domain.id);
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    fetchJobs(company.id);
  };

  const handleBack = () => {
    if (selectedCompany) {
      setSelectedCompany(null);
      setJobs([]);
    } else if (selectedDomain) {
      setSelectedDomain(null);
      setCompanies([]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
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
          <div className="flex items-center gap-4">
            {(selectedDomain || selectedCompany) && (
              <Button variant="outline" size="icon" onClick={handleBack} className="border-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
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

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => { setSelectedDomain(null); setSelectedCompany(null); setCompanies([]); setJobs([]); }} className="hover:text-foreground">
            Domains
          </button>
          {selectedDomain && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button onClick={() => { setSelectedCompany(null); setJobs([]); }} className="hover:text-foreground">
                {selectedDomain.name}
              </button>
            </>
          )}
          {selectedCompany && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{selectedCompany.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!selectedDomain && (
          <>
            <h2 className="text-3xl font-bold mb-6">Browse by Domain</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.map((domain) => (
                <Card 
                  key={domain.id} 
                  className="border-2 border-foreground shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => handleDomainClick(domain)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 border-2 border-foreground bg-secondary">
                        {domain.icon && iconMap[domain.icon] ? iconMap[domain.icon] : <Briefcase className="h-6 w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{domain.name}</CardTitle>
                        <CardDescription>{domain.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </>
        )}

        {selectedDomain && !selectedCompany && (
          <>
            <h2 className="text-3xl font-bold mb-6">Companies in {selectedDomain.name}</h2>
            {companies.length === 0 ? (
              <Card className="border-2 border-foreground p-8 text-center">
                <p className="text-muted-foreground">No companies found in this domain yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <Card 
                    key={company.id} 
                    className="border-2 border-foreground shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 border-2 border-foreground bg-secondary">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{company.name}</CardTitle>
                          {company.location && (
                            <CardDescription className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {company.location}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {company.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{company.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {selectedCompany && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold">{selectedCompany.name}</h2>
              {selectedCompany.location && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedCompany.location}
                </p>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Available Positions</h3>
            
            {jobs.length === 0 ? (
              <Card className="border-2 border-foreground p-8 text-center">
                <p className="text-muted-foreground">No open positions at this company right now.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="border-2 border-foreground shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            {job.job_type && (
                              <span className="px-2 py-1 border border-foreground bg-secondary">
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
                          onClick={() => handleApply(job.id)}
                          disabled={appliedJobs.has(job.id)}
                          className="border-2 border-foreground shadow-sm hover:shadow-md shrink-0"
                        >
                          {appliedJobs.has(job.id) ? 'Applied' : 'Apply Now'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {job.description && (
                        <div>
                          <h4 className="font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">{job.description}</p>
                        </div>
                      )}
                      {job.requirements && (
                        <div>
                          <h4 className="font-semibold mb-1">Requirements</h4>
                          <p className="text-sm text-muted-foreground">{job.requirements}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
