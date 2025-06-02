'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">🤖 ClaimBot</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="ghost"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Internal Claims & Overtime
            <span className="block text-blue-600">Management System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your expense claims and overtime requests with our modern, 
            digital workflow. Say goodbye to Excel spreadsheets and embrace 
            efficiency, transparency, and complete auditability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
              onClick={() => router.push('/auth/register')}
            >
              Start Claiming Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/dashboard')}
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {/* Staff Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-blue-600 text-3xl mb-4">👤</div>
            <h3 className="text-xl font-semibold mb-3">For Staff</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Submit expense claims with receipts</li>
              <li>• Request overtime compensation</li>
              <li>• Track submission status in real-time</li>
              <li>• View complete submission history</li>
            </ul>
          </div>

          {/* Manager Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-green-600 text-3xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-semibold mb-3">For Managers</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Review pending submissions</li>
              <li>• Approve or reject with comments</li>
              <li>• View detailed submission information</li>
              <li>• Centralized approval dashboard</li>
            </ul>
          </div>

          {/* Admin Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-3">For Administrators</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Manage user accounts and roles</li>
              <li>• Configure rates and settings</li>
              <li>• View comprehensive audit logs</li>
              <li>• Generate monthly reports</li>
            </ul>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose ClaimBot?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Improved Accuracy</h3>
              <p className="text-gray-600">Automated calculations with configurable rates</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👁️</div>
              <h3 className="font-semibold mb-2">Enhanced Transparency</h3>
              <p className="text-gray-600">Real-time status tracking and audit trails</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Reduced Workload</h3>
              <p className="text-gray-600">Streamlined approval workflows</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold mb-2">Complete Auditability</h3>
              <p className="text-gray-600">Comprehensive logging of all actions</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Built with Modern Technology</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Frontend:</span>
              <span>Next.js 15 + TypeScript</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Backend:</span>
              <span>Next.js API Routes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Database:</span>
              <span>MongoDB Atlas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Auth:</span>
              <span>Clerk Authentication</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-blue-600 rounded-lg text-white p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Join your team in modernizing expense and overtime management
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              onClick={() => router.push('/auth/register')}
            >
              Create Your Account
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 ClaimBot - Internal Claims & Overtime Management System
          </p>
          <p className="text-gray-500 mt-2">
            Built with ❤️ for modern workplace efficiency
          </p>
        </div>
      </footer>
    </div>
  );
}
