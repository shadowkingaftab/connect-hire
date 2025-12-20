import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Briefcase, Users } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signUp, signIn, user, role: userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'employer') {
        navigate('/employer-dashboard');
      } else {
        navigate('/job-seeker-dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, role);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign up failed',
            description: error.message === 'User already registered' 
              ? 'This email is already registered. Please sign in instead.'
              : error.message,
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to JobConnect!',
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
          });
        }
      }
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-foreground shadow-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 border-2 border-foreground bg-primary">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? 'Join JobConnect to find your dream job' : 'Sign in to continue to JobConnect'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-foreground"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-foreground"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="role" className="font-semibold">I am a</Label>
                <Select value={role} onValueChange={(value: 'job_seeker' | 'employer') => setRole(value)}>
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-2 border-foreground">
                    <SelectItem value="job_seeker">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Job Seeker</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="employer">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Employer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full border-2 border-foreground shadow-sm hover:shadow-md transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
