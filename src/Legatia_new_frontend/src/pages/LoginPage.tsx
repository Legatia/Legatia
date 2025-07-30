import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { LoadingSpinner } from '../components/layout/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth';
import { Users, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loading, login, mockLogin, error } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/families" replace />;
  }

  const handleLogin = async () => {
    try {
      await login();
      toast.success('Successfully logged in!');
    } catch (err) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleMockLogin = async () => {
    try {
      await mockLogin();
      toast.success('Successfully logged in with mock identity!');
    } catch (err) {
      toast.error('Mock login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Legatia</h1>
          <p className="text-gray-600">
            Your digital family tree on the Internet Computer
          </p>
        </div>

        {/* Login card */}
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with Internet Identity to access your family trees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Sign in with Internet Identity
                </>
              )}
            </Button>

            {authService.isLocalDevelopment() && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Development Mode
                </p>
                <Button 
                  onClick={handleMockLogin}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <TestTube className="mr-2 h-5 w-5" />
                      Mock Login (Demo)
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Don't have an Internet Identity?
              </p>
              <Button variant="link" className="text-sm p-0 h-auto" asChild>
                <a 
                  href="https://identity.ic0.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Create one here →
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>✨ Secure decentralized storage</p>
          <p>🔒 Privacy-first family trees</p>
          <p>🌍 Accessible from anywhere</p>
        </div>
      </div>
    </div>
  );
};