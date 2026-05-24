import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Fuel, Menu, X, ChevronRight, Users, Building, Zap, Shield,
  CheckCircle, BookOpen, Code, Database, Smartphone, CreditCard,
  MapPin, Clock, QrCode, BarChart, FileText, Download, Play,
  Star, Target, TrendingUp, Award, Headphones, Mail
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function AboutUs() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">QuickFuel</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Home
              </button>
              <button onClick={() => navigate('/about')} className="text-blue-600 font-semibold">
                About Us
              </button>
              <Button onClick={() => navigate('/login')} variant="outline" className="border-blue-200 hover:border-blue-400">
                Sign In
              </Button>
              <Button onClick={() => navigate('/login')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                Get Started
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-3">
              <button onClick={() => navigate('/')} className="block w-full text-left text-gray-600 hover:text-blue-600 py-2 font-medium">
                Home
              </button>
              <button onClick={() => navigate('/about')} className="block w-full text-left text-blue-600 py-2 font-semibold">
                About Us
              </button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Sign In
              </Button>
              <Button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Complete System Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            About
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              QuickFuel
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Ethiopia's first smart fuel reservation platform solving the fuel queue crisis with technology and innovation.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 bg-white p-2 rounded-xl shadow-sm mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Features
              </TabsTrigger>
              <TabsTrigger value="how-to-use" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                How to Use
              </TabsTrigger>
              <TabsTrigger value="technical" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Technical
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Support
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Target className="w-8 h-8 text-blue-600" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg text-gray-700 space-y-4">
                  <p>
                    QuickFuel was created to solve one of Ethiopia's most pressing daily challenges: the fuel shortage crisis and the hours wasted in fuel station queues.
                  </p>
                  <p>
                    Every day, thousands of drivers spend 2-4 hours waiting in line for fuel, not knowing if the station will run out before they reach the pump. This wastes time, fuel, and economic productivity.
                  </p>
                  <p className="font-semibold text-blue-700">
                    Our mission is to bring order, efficiency, and fairness to Ethiopia's fuel distribution system through smart technology.
                  </p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-green-600" />
                      What Makes Us Different
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Real-Time System:</strong> Live fuel availability across all stations</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Fair Distribution:</strong> Weekly quotas prevent hoarding</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Time Savings:</strong> Book in advance, skip queues</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Digital Payment:</strong> Secure online transactions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Complete Ecosystem:</strong> Connects drivers, stations, and administrators</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-600" />
                      Who We Serve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1">Drivers</h4>
                        <p className="text-gray-600">Save time and fuel by reserving in advance</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-700 mb-1">Station Owners</h4>
                        <p className="text-gray-600">Manage inventory and operations efficiently</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-1">Operators</h4>
                        <p className="text-gray-600">Streamline daily fuel dispensing workflow</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-700 mb-1">Administrators</h4>
                        <p className="text-gray-600">Monitor and manage the entire system</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-blue-600" />
                    Impact & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">45 min</div>
                      <div className="text-gray-700 font-medium">Average Time Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                      <div className="text-gray-700 font-medium">Fuel Availability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                      <div className="text-gray-700 font-medium">Booking Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">Zero</div>
                      <div className="text-gray-700 font-medium">Queue Waiting</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    role: 'Driver',
                    icon: Users,
                    color: 'blue',
                    features: [
                      'Find nearby stations on interactive map',
                      'Check real-time fuel availability',
                      'Make reservations with time slot selection',
                      'Pay securely online',
                      'Get QR code for quick pickup',
                      'Track weekly fuel quota',
                      'View reservation history',
                      'Request refunds for cancelled reservations'
                    ]
                  },
                  {
                    role: 'Station Owner',
                    icon: Building,
                    color: 'green',
                    features: [
                      'Manage multiple station locations',
                      'Update fuel inventory in real-time',
                      'Set fuel prices',
                      'Add and manage operators',
                      'View reservation analytics',
                      'Request fuel deliveries',
                      'Process refund requests',
                      'Monitor station performance'
                    ]
                  },
                  {
                    role: 'Operator',
                    icon: Zap,
                    color: 'orange',
                    features: [
                      'View today\'s reservations',
                      'Verify pickup codes (QR or manual)',
                      'Mark fuel dispensing status',
                      'Manage queue in real-time',
                      'Update reservation status',
                      'View driver details',
                      'Track daily completions',
                      'Receive notifications'
                    ]
                  },
                  {
                    role: 'Administrator',
                    icon: Shield,
                    color: 'purple',
                    features: [
                      'Approve station registrations',
                      'Manage vehicle classes and quotas',
                      'Set system-wide fuel prices',
                      'Create and manage all user types',
                      'View comprehensive analytics',
                      'Monitor system activity',
                      'Approve refund requests',
                      'Generate platform reports'
                    ]
                  }
                ].map((section) => (
                  <Card key={section.role} className="border-2 shadow-lg">
                    <CardHeader className={`bg-${section.color}-50 border-b-2 border-${section.color}-100`}>
                      <CardTitle className="flex items-center gap-3">
                        <section.icon className={`w-6 h-6 text-${section.color}-600`} />
                        {section.role} Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-2">
                        {section.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className={`w-4 h-4 text-${section.color}-500 mt-0.5 flex-shrink-0`} />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* How to Use Tab */}
            <TabsContent value="how-to-use" className="space-y-8">
              {[
                {
                  title: 'For Drivers: Reserve Fuel in 5 Easy Steps',
                  icon: Smartphone,
                  color: 'blue',
                  steps: [
                    { number: 1, title: 'Create Account', desc: 'Register with your vehicle details and license number' },
                    { number: 2, title: 'Find Stations', desc: 'View nearby stations on the map with real-time fuel availability' },
                    { number: 3, title: 'Make Reservation', desc: 'Select station, fuel type, quantity, and preferred time slot' },
                    { number: 4, title: 'Pay Online', desc: 'Complete secure payment with credit card or mobile money' },
                    { number: 5, title: 'Pickup Fuel', desc: 'Show QR code at station at your reserved time and fuel up in minutes' }
                  ]
                },
                {
                  title: 'For Station Owners: Setup & Management',
                  icon: Building,
                  color: 'green',
                  steps: [
                    { number: 1, title: 'Register Station', desc: 'Create account and add station details including location and hours' },
                    { number: 2, title: 'Wait for Approval', desc: 'Admin will verify your station registration' },
                    { number: 3, title: 'Add Operators', desc: 'Create operator accounts for your station staff' },
                    { number: 4, title: 'Update Inventory', desc: 'Keep fuel stock levels and prices up to date' },
                    { number: 5, title: 'Monitor Operations', desc: 'View reservations, analytics, and manage refunds' }
                  ]
                },
                {
                  title: 'For Operators: Daily Workflow',
                  icon: QrCode,
                  color: 'orange',
                  steps: [
                    { number: 1, title: 'Login', desc: 'Access operator dashboard at start of shift' },
                    { number: 2, title: 'View Schedule', desc: 'Check today\'s reservations and time slots' },
                    { number: 3, title: 'Verify Pickup', desc: 'Scan QR code or enter 6-digit pickup code' },
                    { number: 4, title: 'Dispense Fuel', desc: 'Mark as "in progress" while fueling the vehicle' },
                    { number: 5, title: 'Complete', desc: 'Mark reservation as completed after fueling' }
                  ]
                },
                {
                  title: 'For Administrators: System Management',
                  icon: BarChart,
                  color: 'purple',
                  steps: [
                    { number: 1, title: 'Review Stations', desc: 'Approve or reject new station registration requests' },
                    { number: 2, title: 'Configure System', desc: 'Set vehicle classes, weekly quotas, and fuel prices' },
                    { number: 3, title: 'Create Users', desc: 'Register drivers and other system users as needed' },
                    { number: 4, title: 'Monitor Analytics', desc: 'View platform statistics and performance metrics' },
                    { number: 5, title: 'Handle Issues', desc: 'Process refunds and resolve user disputes' }
                  ]
                }
              ].map((guide, idx) => (
                <Card key={idx} className="border-2 shadow-lg">
                  <CardHeader className={`bg-${guide.color}-50 border-b-2`}>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <guide.icon className={`w-7 h-7 text-${guide.color}-600`} />
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {guide.steps.map((step) => (
                        <div key={step.number} className="flex gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-${guide.color}-500 to-${guide.color}-700 text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                            {step.number}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-1">{step.title}</h4>
                            <p className="text-gray-600">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="space-y-6">
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Code className="w-7 h-7 text-blue-600" />
                    Technology Stack
                  </CardTitle>
                  <CardDescription>Modern, scalable, and secure technologies powering QuickFuel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-3 text-lg">Frontend</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> React 18</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> TypeScript</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Tailwind CSS v4</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> React Router 7</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Radix UI</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Recharts</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-700 mb-3 text-lg">Backend & Database</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> Supabase</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> PostgreSQL</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> Real-time Subscriptions</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> Row Level Security</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> JWT Authentication</li>
                        <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-green-500" /> Edge Functions</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Database className="w-7 h-7 text-purple-600" />
                    System Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">3-Tier Architecture</h4>
                      <p className="text-gray-700">QuickFuel follows a modern 3-tier architecture pattern:</p>
                      <ul className="mt-2 space-y-1 ml-4">
                        <li className="text-gray-600">• <strong>Presentation Layer:</strong> React components and UI</li>
                        <li className="text-gray-600">• <strong>Application Layer:</strong> Business logic and API</li>
                        <li className="text-gray-600">• <strong>Data Layer:</strong> PostgreSQL database</li>
                      </ul>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Security</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• JWT authentication</li>
                          <li>• Row Level Security</li>
                          <li>• HTTPS encryption</li>
                          <li>• Password hashing</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">Performance</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Database indexing</li>
                          <li>• Query optimization</li>
                          <li>• Real-time updates</li>
                          <li>• CDN delivery</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2">Scalability</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Cloud infrastructure</li>
                          <li>• Horizontal scaling</li>
                          <li>• Load balancing</li>
                          <li>• Database replication</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <FileText className="w-7 h-7 text-indigo-600" />
                    Database Schema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    QuickFuel uses a normalized relational database with 9 core tables:
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {['users', 'drivers', 'stations', 'operators', 'station_owners', 'fuel_inventory', 'reservations', 'payments', 'vehicle_classes'].map((table) => (
                      <div key={table} className="px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-900 font-mono text-sm">
                        {table}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Complete database schema with SQL migrations is available in the GitHub repository at <code className="px-2 py-1 bg-white rounded text-xs">/docs/database-schema.sql</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-3">
                      <Headphones className="w-6 h-6 text-blue-600" />
                      Get Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                      <a href="mailto:support@quickfuel.app" className="text-blue-600 hover:underline flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        support@quickfuel.app
                      </a>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Response Time</h4>
                      <p className="text-gray-600">We typically respond within 24 hours on business days</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Hours of Operation</h4>
                      <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM EAT<br />Saturday: 9:00 AM - 1:00 PM EAT</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-3">
                      <Download className="w-6 h-6 text-green-600" />
                      Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <button className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all">
                      <span className="font-medium">User Guide (PDF)</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all">
                      <span className="font-medium">API Documentation</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all">
                      <span className="font-medium">Database Schema</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all">
                      <span className="font-medium">Quick Start Guide</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-3">
                    <Play className="w-6 h-6 text-purple-600" />
                    Video Tutorials
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      'How to Make Your First Reservation',
                      'Station Owner Setup Guide',
                      'Operator Daily Workflow',
                      'Admin System Configuration',
                      'Managing Fuel Inventory',
                      'Processing Refunds'
                    ].map((title, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Play className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                            <p className="text-xs text-gray-500 mt-1">Duration: 3-5 min</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { q: 'How do I create an account?', a: 'Admins create driver accounts. Contact your local QuickFuel administrator or fuel station to get registered.' },
                    { q: 'What if I need to cancel my reservation?', a: 'You can cancel reservations up to 1 hour before your scheduled time through the app and request a refund.' },
                    { q: 'How is my weekly fuel quota calculated?', a: 'Quotas are based on your vehicle class (Taxi, Private Car, Bus, etc.) as set by the system administrator.' },
                    { q: 'Is my payment information secure?', a: 'Yes, we use industry-standard encryption and secure payment gateways. We never store your full payment details.' },
                    { q: 'What happens if the station runs out of fuel?', a: 'Reservations guarantee your fuel allocation. If inventory is updated and insufficient, you will be notified immediately.' }
                  ].map((faq, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Save Time and Skip the Queue?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of drivers already using QuickFuel
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-6 shadow-xl"
            >
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">QuickFuel</span>
          </div>
          <p className="text-gray-400 mb-6">
            Solving Ethiopia's fuel crisis, one reservation at a time
          </p>
          <div className="text-sm text-gray-500">
            © 2026 QuickFuel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
