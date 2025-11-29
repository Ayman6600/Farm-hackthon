import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Sprout, Droplets, AlertTriangle, BarChart3, ArrowRight, Check } from 'lucide-react';

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const showSignedInButtons = isLoaded && isSignedIn;

  const features = [
    {
      icon: <Sprout className="w-6 h-6" />,
      title: 'Smart Crop Management',
      description: 'Track and manage your crops with real-time data and insights'
    },
    {
      icon: <Droplets className="w-6 h-6" />,
      title: 'Irrigation Monitoring',
      description: 'Optimize water usage with intelligent irrigation recommendations'
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Risk Alerts',
      description: 'Get instant notifications about pests, diseases, and weather risks'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Reports',
      description: 'Comprehensive reports to track your farm\'s performance'
    }
  ];

  const benefits = [
    'Real-time soil health monitoring',
    'Automated weed risk assessment',
    'Smart irrigation recommendations',
    'Monthly performance reports',
    'Voice-enabled action logging',
    'Crop comparison tools'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sprout className="w-8 h-8 text-green-600" />
          <span className="text-2xl font-bold text-green-700">AgroGig</span>
        </div>
        <div className="flex items-center space-x-4">
          {showSignedInButtons ? (
            <Link
              to="/dashboard"
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-6 py-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Grow Smarter, Not Harder
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Transform your farming with AI-powered insights, real-time monitoring, and smart recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showSignedInButtons ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link
              to="/auth"
              className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600">
            Powerful tools designed for modern farmers
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose AgroGig?
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of farmers who are already growing smarter
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start your free trial today and experience the future of farming
          </p>
          {showSignedInButtons ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sprout className="w-6 h-6 text-green-400" />
              <span className="text-xl font-bold text-white">AgroGig</span>
            </div>
            <p className="text-sm">
              © 2025 AgroGig. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

