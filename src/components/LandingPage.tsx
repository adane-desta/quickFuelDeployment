import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Fuel, Zap, MapPin, Clock, Shield, TrendingUp, Menu, X, ChevronRight,
  CheckCircle, FileText, AlertCircle, Users, Building, CalendarCheck,
  Timer, Smartphone, CreditCard, Target, Info
} from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase/client';

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 10,
    totalStations: 7,
    totalReservations: 0,
    avgTimeSaved: 45
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total stations
      const { count: stationsCount } = await supabase
        .from('stations')
        .select('*', { count: 'exact', head: true });

      // Fetch total reservations
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 23,
        totalStations: stationsCount || 7,
        totalReservations: reservationsCount || 102,
        avgTimeSaved: 2 // Average minutes saved per reservation
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const problems = [
    {
      icon: Timer,
      title: 'Long Waiting Queues',
      description: 'Drivers spend hours waiting in fuel station queues, wasting valuable time and fuel',
      stat: '2-3 hours',
      color: 'bg-red-500'
    },
    {
      icon: AlertCircle,
      title: 'Fuel Uncertainty',
      description: 'No way to know if stations have fuel available before arriving, leading to wasted trips',
      stat: '40% empty trips',
      color: 'bg-orange-500'
    },
    {
      icon: Target,
      title: 'No Reservation System',
      description: 'First-come-first-serve creates chaos and unfair distribution of limited fuel resources',
      stat: 'Daily chaos',
      color: 'bg-yellow-500'
    }
  ];

  const solutions = [
    {
      icon: Smartphone,
      title: 'Real-Time Availability',
      description: 'Check fuel availability at nearby stations instantly before you leave',
      color: 'bg-blue-500'
    },
    {
      icon: CalendarCheck,
      title: 'Smart Reservations',
      description: 'Book your fuel in advance with guaranteed availability and time slots',
      color: 'bg-green-500'
    },
    {
      icon: CreditCard,
      title: 'Digital Payments',
      description: 'Pay securely online and skip cash transactions at the station',
      color: 'bg-purple-500'
    },
    {
      icon: Clock,
      title: 'Time Slot Management',
      description: 'Choose your preferred time and avoid peak hours and long queues',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">QuickFuel</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#problem" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Problem</a>
              <a href="#solution" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Solution</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">How It Works</a>
              <button
                onClick={() => navigate('/about')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <Info className="w-4 h-4" />
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
              <a href="#problem" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Problem</a>
              <a href="#solution" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Solution</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">How It Works</a>
              <button
                onClick={() => {
                  navigate('/about');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 py-2 font-medium w-full text-left"
              >
                <Info className="w-4 h-4" />
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
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Ethiopia's First Smart Fuel Reservation Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                End Fuel Queue
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Frustration Forever
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Reserve your fuel online, skip the hours-long queues, and fuel up in minutes.
                <span className="block mt-2 font-semibold text-gray-800">QuickFuel brings order to Ethiopia's fuel distribution system.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all"
                >
                  Reserve Fuel Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-400 text-lg px-10 py-7"
                >
                  See How It Works
                </Button>
              </div>

              {/* Live Stats - Compact on Hero */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}+</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-100">
                  <p className="text-2xl font-bold text-green-600">{stats.avgTimeSaved} hours</p>
                  <p className="text-sm text-gray-600">Time Saved</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Image from Ethiopia */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src='public/fuel-station-addis-abeba-ethiopia-AYY94M.jpg'
                  alt="total fuel station"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm font-medium opacity-90">Busy streets of Addis Ababa</p>
                  <p className="text-xs opacity-75">Photo by Bemnet Mesfin</p>
                </div>
              </div>
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl border-2 border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalStations}+</p>
                    <p className="text-sm text-gray-600">Partner Stations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
              <AlertCircle className="w-4 h-4" />
              The Problem We're Solving
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ethiopia's Fuel Queue Crisis</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every day, millions of Ethiopians waste precious hours waiting in fuel queues.
              <span className="block mt-2 font-semibold text-red-600">This has to stop.</span>
            </p>
          </div>

          {/* Real Images from Ethiopia */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1658750761951-ca89765281bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Traffic and transportation in Addis Ababa"
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Hours Wasted Daily</h3>
                <p className="text-sm opacity-90">Drivers spend 2-4 hours in queues, not knowing if fuel will be available</p>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1752269110578-3b9c2fe38b8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Busy streets of Ethiopia with vehicles"
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Economic Impact</h3>
                <p className="text-sm opacity-90">Lost productivity affects families, businesses, and the entire economy</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {problems.map((problem, index) => (
              <div key={index} className="relative group">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 hover:border-red-300 transition-all shadow-lg hover:shadow-xl h-full">
                  <div className={`w-16 h-16 ${problem.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <problem.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{problem.description}</p>
                  <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg font-bold">
                    {problem.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl p-10 border-2 border-red-200">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">The Real Cost</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Ethiopian drivers collectively lose <span className="font-bold text-red-600">millions of hours</span> every month in fuel queues.
                That's time away from family, work, and life. Plus the wasted fuel idling in queues contributes to pollution and financial loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              Our Solution
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">QuickFuel: The Smart Way</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A digital platform that brings fairness, efficiency, and convenience to fuel distribution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-blue-300">
                <div className={`w-14 h-14 ${solution.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                  <solution.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{solution.title}</h3>
                <p className="text-gray-600 leading-relaxed">{solution.description}</p>
              </div>
            ))}
          </div>

          {/* Technology in Action - Images from Africa */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl overflow-hidden shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1677058698151-1ba91e4c2a39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Mobile payment technology in Africa"
                className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h4 className="font-bold text-lg mb-1">Mobile-First Design</h4>
                <p className="text-sm opacity-90">Book fuel from anywhere, anytime</p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1677058559072-93f06cf25b00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Digital payments in Ethiopia"
                className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h4 className="font-bold text-lg mb-1">Secure Payments</h4>
                <p className="text-sm opacity-90">Pay online with confidence</p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1640117792694-97b464c05f66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="Happy Ethiopian users"
                className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h4 className="font-bold text-lg mb-1">Community Success</h4>
                <p className="text-sm opacity-90">Thousands already benefiting</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The QuickFuel Difference</h2>
            <p className="text-xl text-gray-600">See how we transform the fuel buying experience</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before - Old Way */}
            <div className="bg-white rounded-2xl p-8 border-2 border-red-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <X className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Before QuickFuel</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Wake up early to beat the queue',
                  'Drive station to station looking for fuel',
                  'Wait 2-4 hours in long queues',
                  'Risk running out before your turn',
                  'Waste fuel idling in traffic',
                  'Miss work and family time'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After - QuickFuel Way */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">With QuickFuel</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Check availability from your phone',
                  'Reserve fuel in 2 minutes',
                  'Pay securely online',
                  'Arrive at your scheduled time',
                  'Show QR code and fuel in 5 minutes',
                  'Get back to what matters'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to skip the queue and fuel up fast
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Find & Check',
                description: 'Search nearby fuel stations and check real-time fuel availability on your phone',
                icon: MapPin,
                color: 'from-blue-500 to-blue-600'
              },
              {
                step: '02',
                title: 'Reserve & Pay',
                description: 'Select your fuel type, quantity, and time slot. Pay securely via Telebirr or Chapa',
                icon: CreditCard,
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '03',
                title: 'Show & Fuel',
                description: 'Arrive at your time slot, show your QR code, and fuel up in minutes—no waiting!',
                icon: Fuel,
                color: 'from-green-500 to-green-600'
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all border border-gray-200 h-full">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Skip the Queue?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of smart Ethiopians who have already said goodbye to fuel queue frustration
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-50 text-xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all"
            >
              Start Saving Time Now
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">QuickFuel</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Revolutionizing fuel distribution in Ethiopia through smart technology and fair allocation.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-lg">Product</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#problem" className="hover:text-white transition-colors">Problem</a></li>
                <li><a href="#solution" className="hover:text-white transition-colors">Solution</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-lg">Company</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="mailto:support@quickfuel.app" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-lg">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 QuickFuel Ethiopia. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
