import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Fuel, Zap, MapPin, Clock, Shield, TrendingUp, Menu, X, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: MapPin,
      title: 'Real-Time Station Locator',
      description: 'Find nearby fuel stations with live availability and queue information',
      color: 'bg-blue-500',
    },
    {
      icon: Clock,
      title: 'Smart Reservations',
      description: 'Book your fuel in advance and skip the queue with guaranteed availability',
      color: 'bg-green-500',
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Secure payments via Telebirr and Chapa with instant confirmation',
      color: 'bg-purple-500',
    },
    {
      icon: Shield,
      title: 'Verified Stations',
      description: 'All stations are verified and monitored for quality assurance',
      color: 'bg-orange-500',
    },
  ];

  const benefits = [
    'Save time with real-time queue information',
    'Guarantee fuel availability with reservations',
    'Track your fuel spending and history',
    'Get notifications for price changes',
    'Access 24/7 customer support',
    'Earn rewards on every purchase',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickFuel</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
              <Button onClick={() => navigate('/login')} variant="outline" className="border-gray-300">
                Sign In
              </Button>
              <Button onClick={() => navigate('/register/driver')} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-gray-900 py-2">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">How It Works</a>
              <a href="#benefits" className="block text-gray-600 hover:text-gray-900 py-2">Benefits</a>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full border-gray-300">
                Sign In
              </Button>
              <Button onClick={() => navigate('/register/driver')} className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Skip the Queue,
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Fuel Up Faster
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              QuickFuel helps you locate fuel stations with real-time availability, book your fuel in advance, and skip the long queues. Save time and fuel smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/register/driver')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6"
              >
                Start Saving Time
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">800K+</p>
                <p className="text-sm text-gray-600 mt-1">Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600 mt-1">Stations</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">2M+</p>
                <p className="text-sm text-gray-600 mt-1">Reservations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose QuickFuel?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of fuel management with our comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to save time and avoid queues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Find a Station',
                description: 'Browse nearby fuel stations with real-time availability and queue status',
                icon: MapPin,
              },
              {
                step: '2',
                title: 'Make a Reservation',
                description: 'Select your fuel type, quantity, and time slot. Pay securely online',
                icon: Clock,
              },
              {
                step: '3',
                title: 'Collect Your Fuel',
                description: 'Show your QR code or pickup code at the station and fuel up instantly',
                icon: Fuel,
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Experience the Benefits
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of satisfied drivers who have transformed their fueling experience with QuickFuel.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/register/driver')}
                size="lg"
                className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Get Started Today
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time Saved This Month</p>
                      <p className="text-2xl font-bold text-gray-900">4.5 hours</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Fuel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Money Saved</p>
                      <p className="text-2xl font-bold text-gray-900">ETB 2,350</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Through smart fuel planning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Fueling Experience?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join QuickFuel today and never wait in line again
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/register/driver')}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Sign Up Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Already Have an Account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">QuickFuel</span>
              </div>
              <p className="text-gray-400 text-sm">
                Making fuel management smarter, faster, and more convenient for everyone.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#benefits" className="hover:text-white">Benefits</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 QuickFuel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
