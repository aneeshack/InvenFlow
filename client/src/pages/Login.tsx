import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CLIENT_API } from '@/util/Axios';


const Login: React.FC = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/'); // Redirect to home page
      // const response = await CLIENT_API.post('/login', { email, password });
      
      // console.log('Login response:', response);
      // if (response.status === 200 && response.data.success) {
      //   console.log('Login successful, token:', response.data.token);

      // } else {
      //   console.error('Unexpected response:', response.data);
      //   toast.error(response.data.error || 'Login failed: Unexpected response');
      // }
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-invenflow-blue/5 to-invenflow-purple/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-card border border-border/50 p-8 animate-fadeIn">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Box className="h-7 w-7 text-invenflow-purple" />
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-invenflow-blue to-invenflow-purple bg-clip-text text-transparent">
                InvenFlow
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">Smart Inventory Management</p>
          </div>
          
          <h2 className="text-xl font-medium text-center mb-6">Login to your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="form-input w-full"
                required
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input w-full"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Demo credentials are pre-filled. Just click Sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
