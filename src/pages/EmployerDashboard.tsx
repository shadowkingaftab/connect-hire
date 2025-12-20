import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, LogOut, Briefcase } from 'lucide-react';

export default function EmployerDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== 'employer')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Employer Dashboard</h2>
          <p className="text-muted-foreground">Manage your job listings and applications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Manage your company information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your company details, logo, and description to attract top talent.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Job Listings</CardTitle>
                  <CardDescription>Create and manage job posts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Post new positions, edit existing listings, or close filled roles.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 border-2 border-foreground bg-secondary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>Review candidate applications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage applications from job seekers for your open positions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-2 border-foreground text-center p-6">
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-muted-foreground">Active Jobs</div>
          </Card>
          <Card className="border-2 border-foreground text-center p-6">
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-muted-foreground">Total Applications</div>
          </Card>
          <Card className="border-2 border-foreground text-center p-6">
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-muted-foreground">New This Week</div>
          </Card>
        </div>

        <Card className="mt-8 border-2 border-foreground p-8 text-center bg-secondary">
          <h3 className="text-xl font-bold mb-2">Get Started</h3>
          <p className="text-muted-foreground mb-4">
            Start posting jobs to receive applications from talented professionals.
          </p>
          <Button className="border-2 border-foreground shadow-sm">
            Post Your First Job
          </Button>
        </Card>
      </main>
    </div>
  );
}
