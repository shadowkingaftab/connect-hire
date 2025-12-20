import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Building2, ArrowRight } from 'lucide-react';

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'employer') {
        navigate('/employer-dashboard');
      } else {
        navigate('/job-seeker-dashboard');
      }
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-foreground bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">JobConnect</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-2 border-foreground">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Find Your
            <br />
            <span className="relative inline-block">
              Dream Job
              <div className="absolute -bottom-2 left-0 w-full h-4 bg-secondary border-2 border-foreground -z-10" />
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Connect with top employers across various industries. Browse thousands of job opportunities or find the perfect candidate for your company.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="border-2 border-foreground shadow-md hover:shadow-lg transition-shadow gap-2 text-lg px-8">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="border-2 border-foreground p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 border-2 border-foreground bg-secondary w-fit mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">For Job Seekers</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Browse jobs by industry domain</li>
              <li>• Explore companies in your field</li>
              <li>• Apply with one click</li>
              <li>• Track your applications</li>
            </ul>
          </div>
          <div className="border-2 border-foreground p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 border-2 border-foreground bg-secondary w-fit mb-4">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">For Employers</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Post unlimited job listings</li>
              <li>• Manage your company profile</li>
              <li>• Review applications easily</li>
              <li>• Find the best talent</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center border-t-2 border-foreground">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-muted-foreground mb-6">
            Create an account and begin your journey today.
          </p>
          <Link to="/auth">
            <Button size="lg" className="border-2 border-foreground shadow-md">
              Create Account
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 JobConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
