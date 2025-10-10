import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Shield, Globe, DollarSign, Activity, Clock, ChevronRight, Search, Bell, User, Menu, Settings } from 'lucide-react';

const HedgeLogicDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for active hedges
  const activeHedges = [
    {
      id: 1,
      event: 'China Microchip Tariff Q1 2025',
      category: 'Trade Policy',
      exposure: 10000000,
      hedged: 10000000,
      cost: 5960000,
      probability: 0.80,
      status: 'active',
      daysToEvent: 23,
      roi: -5.96,
      location: { lat: 39.9, lng: 116.4 }
    },
    {
      id: 2,
      event: 'US Recession 2025',
      category: 'Macro Economics',
      exposure: 5000000,
      hedged: 3500000,
      cost: 1750000,
      probability: 0.52,
      status: 'monitoring',
      daysToEvent: 145,
      roi: -3.5,
      location: { lat: 38.9, lng: -77.0 }
    },
    {
      id: 3,
      event: 'FDA Drug Approval - XR-401',
      category: 'Regulatory',
      exposure: 2500000,
      hedged: 2500000,
      cost: 625000,
      probability: 0.25,
      status: 'active',
      daysToEvent: 67,
      roi: -2.5,
      location: { lat: 38.8, lng: -77.0 }
    },
    {
      id: 4,
      event: 'EU AI Regulation Passage',
      category: 'Tech Policy',
      exposure: 8000000,
      hedged: 6000000,
      cost: 3600000,
      probability: 0.68,
      status: 'active',
      daysToEvent: 89,
      roi: -4.5,
      location: { lat: 50.8, lng: 4.4 }
    }
  ];

  // Portfolio summary data
  const portfolioData = [
    { name: 'Jan', hedged: 4.2, unhedged: 12.5 },
    { name: 'Feb', hedged: 8.5, unhedged: 15.2 },
    { name: 'Mar', hedged: 12.1, unhedged: 9.8 },
    { name: 'Apr', hedged: 15.3, unhedged: 8.2 },
    { name: 'May', hedged: 18.9, unhedged: 6.1 },
    { name: 'Jun', hedged: 23.2, unhedged: 4.5 }
  ];

  // Event categories
  const categoryData = [
    { name: 'Trade Policy', value: 38, color: '#00d4ff' },
    { name: 'Macro Economics', value: 22, color: '#ff6b9d' },
    { name: 'Regulatory', value: 18, color: '#ffd60a' },
    { name: 'Tech Policy', value: 15, color: '#06ffa5' },
    { name: 'Geopolitical', value: 7, color: '#8b5cf6' }
  ];

  // Probability evolution
  const probabilityData = [
    { day: 'Day 1', tariff: 0.12, recession: 0.35, fda: 0.28 },
    { day: 'Day 5', tariff: 0.30, recession: 0.42, fda: 0.26 },
    { day: 'Day 8', tariff: 0.65, recession: 0.48, fda: 0.25 },
    { day: 'Day 10', tariff: 0.80, recession: 0.52, fda: 0.25 },
    { day: 'Now', tariff: 0.80, recession: 0.52, fda: 0.25 }
  ];

  const totalExposure = activeHedges.reduce((sum, h) => sum + h.exposure, 0);
  const totalHedged = activeHedges.reduce((sum, h) => sum + h.hedged, 0);
  const totalCost = activeHedges.reduce((sum, h) => sum + h.cost, 0);
  const hedgeRatio = (totalHedged / totalExposure * 100).toFixed(1);

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      monitoring: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs border ${colors[status] || colors.monitoring}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">HedgeLogic</h1>
                <p className="text-xs text-cyan-400">Certainty-as-a-Service</p>
              </div>
            </div>
            <div className="ml-8 h-8 w-px bg-cyan-500/30" />
            <div className="flex space-x-1">
              {['Overview', 'Markets', 'Analytics', 'Scenarios'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Current Time</p>
              <p className="text-sm font-mono">{time.toLocaleTimeString()}</p>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 pl-4 border-l border-cyan-500/20">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
                OV
              </div>
              <div className="text-sm">
                <p className="font-medium">Oleg Viatkin</p>
                <p className="text-xs text-gray-400">CFO View</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="p-6">
        {/* Top Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Total Exposure</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold">${(totalExposure / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-400 mt-1">Across {activeHedges.length} events</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Hedged Value</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">${(totalHedged / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {hedgeRatio}% coverage
            </p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Total Cost</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">${(totalCost / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-gray-400 mt-1">{((totalCost / totalExposure) * 100).toFixed(1)}% of exposure</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Active Markets</span>
              <Globe className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{activeHedges.filter(h => h.status === 'active').length}</p>
            <p className="text-xs text-gray-400 mt-1">{activeHedges.filter(h => h.status === 'monitoring').length} monitoring</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Risk Score</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">Medium</p>
            <p className="text-xs text-gray-400 mt-1">23 days to nearest event</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Active Hedges */}
          <div className="col-span-2 space-y-6">
            {/* Active Hedges Table */}
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Active Hedges</h2>
                <button className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-sm font-medium text-cyan-400 transition-all">
                  New Hedge +
                </button>
              </div>
              <div className="space-y-3">
                {activeHedges.map((hedge) => (
                  <div
                    key={hedge.id}
                    onClick={() => setSelectedEvent(hedge)}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">
                            {hedge.event}
                          </h3>
                          <StatusBadge status={hedge.status} />
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-400">Exposure</p>
                            <p className="text-sm font-mono">${(hedge.exposure / 1000000).toFixed(1)}M</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Hedged</p>
                            <p className="text-sm font-mono text-emerald-400">${(hedge.hedged / 1000000).toFixed(1)}M</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Probability</p>
                            <p className="text-sm font-mono">{(hedge.probability * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Days to Event</p>
                            <p className="text-sm font-mono">{hedge.daysToEvent}</p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 relative">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${(hedge.hedged / hedge.exposure) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Coverage: {((hedge.hedged / hedge.exposure) * 100).toFixed(0)}% | Cost: ${(hedge.cost / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Probability Evolution Chart */}
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">Probability Evolution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={probabilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(val) => `${(val * 100).toFixed(0)}%`}
                  />
                  <Line type="monotone" dataKey="tariff" stroke="#00d4ff" strokeWidth={2} name="Tariff" />
                  <Line type="monotone" dataKey="recession" stroke="#ff6b9d" strokeWidth={2} name="Recession" />
                  <Line type="monotone" dataKey="fda" stroke="#ffd60a" strokeWidth={2} name="FDA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Event Categories */}
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">Event Categories</h2>
              <div className="flex justify-center mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-mono text-gray-400">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Growth */}
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">Portfolio Coverage</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="hedged" stackId="1" stroke="#06ffa5" fill="#06ffa5" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="unhedged" stackId="1" stroke="#ff6b9d" fill="#ff6b9d" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span>Hedged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-pink-400" />
                  <span>Unhedged</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Run Scenario Analysis</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Browse Markets</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button className="w-full px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Export Report</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setSelectedEvent(null)}>
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-4xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedEvent.event}</h2>
                <p className="text-gray-400">{selectedEvent.category}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Current Probability</p>
                <p className="text-3xl font-bold text-cyan-400">{(selectedEvent.probability * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Days to Event</p>
                <p className="text-3xl font-bold">{selectedEvent.daysToEvent}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Expected ROI</p>
                <p className="text-3xl font-bold text-red-400">{selectedEvent.roi}%</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Financial Outcomes</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">If Event Occurs (Yes)</span>
                    <span className="font-mono text-emerald-400">$0</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Loss: -${(selectedEvent.exposure / 1000000).toFixed(1)}M | Payout: +${(selectedEvent.hedged / 1000000).toFixed(1)}M | Cost: -${(selectedEvent.cost / 1000000).toFixed(2)}M = $0
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">If Event Doesn't Occur (No)</span>
                    <span className="font-mono text-amber-400">-${(selectedEvent.cost / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Loss: $0 | Payout: $0 | Cost: -${(selectedEvent.cost / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition-all">
                Adjust Hedge
              </button>
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-all">
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HedgeLogicDashboard;