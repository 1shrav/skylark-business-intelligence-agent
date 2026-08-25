'use client';

import { FormEvent, useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import Image from 'next/image';

type Metrics = Record<string, unknown>;
type Message = { id: string; role: 'user' | 'assistant'; content: string; metrics?: Metrics; quality?: number; followUps?: string[]; error?: boolean };
type Risk = { severity: 'high' | 'medium' | 'low'; category: string; description: string; count?: number };
type GrowthRec = { priority: 'high' | 'medium' | 'low'; category: string; recommendation: string; impact: string; action: string };
type DataCoverage = {
  deals: { retrieved: number; normalized: number; issues: number; successRate: number };
  workOrders: { retrieved: number; normalized: number; issues: number; successRate: number };
};
type Overview = { totalPipelineValue: number; activeDealCount: number; activeProjectCount: number; topSector: string };
type DataState = { coverage?: DataCoverage; overview?: Overview; risks?: Risk[]; growthRecommendations?: GrowthRec[]; metrics?: any; lastRefresh?: string; loading: boolean };
type Page = 'welcome' | 'overview' | 'analytics' | 'growth' | 'risks' | 'assistant' | 'data';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

function value(val: unknown, kind: 'money' | 'number' | 'percent') {
  if (typeof val !== 'number') return '—';
  if (kind === 'money') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val);
  if (kind === 'percent') return `${Math.round(val * 100)}%`;
  return new Intl.NumberFormat('en-US').format(val);
}

function WelcomePage({ onEnter }: { onEnter: () => void }) {
  return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-5">
    <div className="mx-auto max-w-5xl text-center">
      <div className="mb-8 flex justify-center"><div className="relative"><div className="absolute inset-0 animate-pulse rounded-3xl bg-blue-400 opacity-20 blur-2xl" /><div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl"><span className="text-6xl font-black text-white">S</span></div></div></div>
      <h1 className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">SKYLARK<br />COMMAND CENTER</h1>
      <p className="mt-6 text-xl font-medium text-blue-200 sm:text-2xl">Business Intelligence Dashboard</p>
      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <p className="text-lg leading-relaxed text-slate-200">AI-powered business intelligence platform for <span className="font-bold text-white">Skylark Drones</span>. Real-time analytics, growth recommendations, and operational insights powered by Monday.com data.</p>
        <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-5 backdrop-blur-sm"><div className="mb-2 text-3xl">📊</div><h3 className="font-semibold text-white">Live Analytics</h3><p className="mt-2 text-sm text-slate-300">Real-time pipeline and operations metrics</p></div>
          <div className="rounded-xl bg-white/5 p-5 backdrop-blur-sm"><div className="mb-2 text-3xl">🤖</div><h3 className="font-semibold text-white">AI Insights</h3><p className="mt-2 text-sm text-slate-300">Natural language queries with instant answers</p></div>
          <div className="rounded-xl bg-white/5 p-5 backdrop-blur-sm"><div className="mb-2 text-3xl">📈</div><h3 className="font-semibold text-white">Growth Strategies</h3><p className="mt-2 text-sm text-slate-300">Actionable recommendations to accelerate growth</p></div>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        <button onClick={onEnter} className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/50"><span className="relative z-10">Launch Dashboard →</span></button>
        <p className="text-sm text-slate-400">Powered by Monday.com • Groq AI</p>
      </div>
    </div>
  </div>;
}

function OverviewPage({ data }: { data: DataState }) {
  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">Business Overview</h2>
    {!data.loading && data.overview && <section className="mb-8"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="group rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm transition hover:shadow-md"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-600">Total Pipeline</p><span className="text-2xl">💰</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value(data.overview.totalPipelineValue, 'money')}</p><p className="mt-1 text-xs text-slate-500">{data.overview.activeDealCount} active deals</p></div><div className="group rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm transition hover:shadow-md"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-600">Active Deals</p><span className="text-2xl">📊</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value(data.overview.activeDealCount, 'number')}</p><p className="mt-1 text-xs text-slate-500">Across {data.overview.topSector} and more</p></div><div className="group rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm transition hover:shadow-md"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-600">Work Orders</p><span className="text-2xl">⚙️</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value(data.overview.activeProjectCount, 'number')}</p><p className="mt-1 text-xs text-slate-500">Active projects</p></div></div></section>}
    {data.loading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><p className="mt-4 text-sm text-slate-500">Loading data...</p></div>}
  </div>;
}

function AnalyticsPage({ data }: { data: DataState }) {
  if (!data.metrics?.pipeline && !data.metrics?.workOrders) return <div><h2 className="mb-6 text-2xl font-bold text-slate-900">Analytics</h2><p className="text-slate-500">Loading analytics...</p></div>;
  
  const pipelineData = data.metrics.pipeline?.bySector ? Object.entries(data.metrics.pipeline.bySector).map(([name, chartData]: [string, any]) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    value: chartData.totalValue || 0,
    fullName: name,
  })).sort((a, b) => b.value - a.value).slice(0, 6) : [];

  const statusData = data.metrics.workOrders?.byStatus ? Object.entries(data.metrics.workOrders.byStatus).map(([status, chartData]: [string, any]) => ({
    name: status.replace(/_/g, ' '),
    value: chartData.count || 0,
  })) : [];

  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">Analytics & Visualizations</h2>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.14em] text-blue-600">PIPELINE BY SECTOR</p><p className="mt-1 text-sm font-semibold">Deal value distribution</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Live</span></div><ResponsiveContainer width="100%" height={280}><BarChart data={pipelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => value(val, 'money')} /><Tooltip formatter={(val) => value(val, 'money')} contentStyle={{ fontSize: 12, borderRadius: 8 }} /><Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.14em] text-emerald-600">WORK ORDERS STATUS</p><p className="mt-1 text-sm font-semibold">Project distribution</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Live</span></div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name} (${entry.value})`} outerRadius={90} fill="#8884d8" dataKey="value">{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
    </div>
  </div>;
}

function GrowthPage({ data }: { data: DataState }) {
  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">Growth Strategies</h2>
    {!data.loading && data.growthRecommendations && data.growthRecommendations.length > 0 && <div className="space-y-4">{data.growthRecommendations.map((rec, i) => <div key={i} className={`rounded-xl border bg-white p-6 shadow-sm ${rec.priority === 'high' ? 'border-emerald-300' : 'border-slate-200'}`}><div className="flex items-start gap-4"><div className="flex-1"><div className="flex items-center gap-2"><span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${rec.priority === 'high' ? 'bg-emerald-100 text-emerald-700' : rec.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{rec.priority}</span><span className="text-[10px] font-semibold text-slate-500">{rec.category}</span></div><p className="mt-3 text-base font-semibold text-slate-900">{rec.recommendation}</p><p className="mt-2 text-sm text-slate-600"><span className="font-medium">Impact:</span> {rec.impact}</p><div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-700"><span className="font-semibold">Action Plan:</span> {rec.action}</p></div></div></div></div>)}</div>}
  </div>;
}

function RisksPage({ data }: { data: DataState }) {
  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">Risk Management</h2>
    {!data.loading && data.risks && data.risks.length > 0 && <div className="space-y-3">{data.risks.map((risk, i) => <div key={i} className={`rounded-xl border p-5 ${risk.severity === 'high' ? 'border-red-300 bg-red-50' : risk.severity === 'medium' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-start gap-4"><span className={`mt-1 h-3 w-3 rounded-full ${risk.severity === 'high' ? 'bg-red-500' : risk.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} /><div className="flex-1"><p className="text-sm font-bold text-slate-900">{risk.category}</p><p className="mt-1 text-sm text-slate-700">{risk.description}</p>{risk.count && <p className="mt-2 text-xs font-medium text-slate-500">Affected items: {risk.count}</p>}</div></div></div>)}</div>}
    {!data.loading && (!data.risks || data.risks.length === 0) && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"><p className="text-lg font-semibold text-emerald-900">✓ No critical risks detected</p><p className="mt-2 text-sm text-emerald-700">Your business operations are running smoothly</p></div>}
  </div>;
}

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const questions = [
    'How is our pipeline looking this quarter?',
    'Which sectors have the highest pipeline?',
    'Give me a leadership update',
    'What are our biggest risks?',
  ];

  async function ask(question: string) {
    const query = question.trim();
    if (!query || loading) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: query }]);
    setInput(''); setLoading(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      const apiData = await response.json();
      if (!response.ok || !apiData.success) throw new Error(apiData.error?.message || 'Analysis failed');
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: apiData.answer || 'No response', metrics: apiData.metrics, quality: apiData.dataQuality?.successRate, followUps: apiData.suggestedFollowUps }]);
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: error instanceof Error ? error.message : 'Connection error', error: true }]);
    } finally { setLoading(false); }
  }

  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">AI Assistant</h2>
    {messages.length === 0 ? <div><p className="mb-4 text-sm text-slate-600">Ask questions about your business in natural language</p><div className="grid gap-3 sm:grid-cols-2">{questions.map((q) => <button key={q} onClick={() => ask(q)} className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm hover:border-blue-300 hover:shadow-md">{q}</button>)}</div></div> : <div className="space-y-4">{messages.map((msg) => <div key={msg.id}>{msg.role === 'user' ? <div className="ml-auto max-w-xl rounded-xl bg-blue-600 px-4 py-3 text-sm text-white">{msg.content}</div> : <div className={`rounded-xl border p-4 ${msg.error ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}><p className="whitespace-pre-wrap text-sm text-slate-700">{msg.content}</p></div>}</div>)}</div>}
    <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="mt-6 flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-400" disabled={loading} /><button disabled={loading || !input.trim()} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:bg-slate-300">Ask</button></form>
  </div>;
}

function DataSourcesPage({ data }: { data: DataState }) {
  const timeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return <div>
    <h2 className="mb-6 text-2xl font-bold text-slate-900">Data Sources</h2>
    {!data.loading && data.coverage && <div><div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-900">Live Monday.com Integration</p><p className="mt-1 text-xs text-slate-500">Last synced: {timeAgo(data.lastRefresh)}</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6"><div className="flex items-center gap-2 mb-4"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /><p className="text-sm font-bold text-slate-900">Deals Board</p></div><div className="space-y-2 text-sm text-slate-700"><p><span className="font-semibold">{data.coverage.deals.retrieved}</span> records retrieved</p><p><span className="font-semibold">{data.coverage.deals.normalized}</span> normalized</p>{data.coverage.deals.issues > 0 && <p className="text-amber-600"><span className="font-semibold">{data.coverage.deals.issues}</span> with issues</p>}<div className="mt-4 pt-4 border-t border-slate-200"><p className="text-xs text-slate-500">Success rate: <span className="font-bold text-blue-600">{Math.round(data.coverage.deals.successRate * 100)}%</span></p></div></div></div><div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6"><div className="flex items-center gap-2 mb-4"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /><p className="text-sm font-bold text-slate-900">Work Orders Board</p></div><div className="space-y-2 text-sm text-slate-700"><p><span className="font-semibold">{data.coverage.workOrders.retrieved}</span> records retrieved</p><p><span className="font-semibold">{data.coverage.workOrders.normalized}</span> normalized</p>{data.coverage.workOrders.issues > 0 && <p className="text-amber-600"><span className="font-semibold">{data.coverage.workOrders.issues}</span> with issues</p>}<div className="mt-4 pt-4 border-t border-slate-200"><p className="text-xs text-slate-500">Success rate: <span className="font-bold text-emerald-600">{Math.round(data.coverage.workOrders.successRate * 100)}%</span></p></div></div></div></div></div>}
  </div>;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<DataState>({ loading: true });

  async function fetchData() {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      if (result.success) {
        setData({ coverage: result.coverage, overview: result.overview, risks: result.risks, growthRecommendations: result.growthRecommendations, metrics: result.metrics, lastRefresh: result.lastRefresh, loading: false });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  useEffect(() => { if (currentPage !== 'welcome') fetchData(); }, [currentPage]);

  if (currentPage === 'welcome') return <WelcomePage onEnter={() => setCurrentPage('overview')} />;

  const navItems = [
    { id: 'overview' as Page, icon: '📊', label: 'Overview' },
    { id: 'analytics' as Page, icon: '📈', label: 'Analytics' },
    { id: 'growth' as Page, icon: '🚀', label: 'Growth Strategies' },
    { id: 'risks' as Page, icon: '⚠️', label: 'Risk Management' },
    { id: 'assistant' as Page, icon: '🤖', label: 'AI Assistant' },
    { id: 'data' as Page, icon: '💾', label: 'Data Sources' },
  ];

  return <main className="flex min-h-screen bg-[#f7f8fb]">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#101a2d] px-4 py-6 text-slate-300 transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-3 mb-8"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-lg text-lg">S</span><div><span className="text-base font-bold tracking-tight text-white">SKYLARK</span><p className="text-[8px] font-medium tracking-wider text-blue-300">COMMAND CENTER</p></div></div>
      <div className="px-3 text-[9px] font-semibold tracking-[.15em] text-slate-500 mb-3">NAVIGATION</div>
      <nav className="flex-1 space-y-1">{navItems.map((item) => <button key={item.id} onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${currentPage === item.id ? 'bg-blue-600 font-medium text-white' : 'text-slate-300 hover:bg-white/5'}`}><span className="text-base">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="mt-auto space-y-3">
        <button onClick={fetchData} disabled={data.loading} className="w-full rounded-lg border border-white/20 px-3 py-2.5 text-xs font-medium hover:bg-white/5 disabled:opacity-50">↻ Refresh Data</button>
        <button onClick={() => setCurrentPage('welcome')} className="w-full rounded-lg px-3 py-2.5 text-xs font-medium hover:bg-white/5">← Back to Home</button>
        <div className="border-t border-white/10 px-3 pt-4"><p className="flex items-center gap-2 text-xs"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Monday.com</p></div>
      </div>
    </aside>
    <section className="flex-1 md:ml-64">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">☰</button><div><p className="text-[9px] font-bold tracking-[.14em] text-blue-600">SKYLARK COMMAND CENTER</p><h1 className="text-sm font-semibold sm:text-base">{navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}</h1></div></div><div className="flex items-center gap-3"><button onClick={fetchData} disabled={data.loading} className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:flex">↻ Refresh</button><div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</div></div></header>
      <div className="p-5 sm:p-8">
        {currentPage === 'overview' && <OverviewPage data={data} />}
        {currentPage === 'analytics' && <AnalyticsPage data={data} />}
        {currentPage === 'growth' && <GrowthPage data={data} />}
        {currentPage === 'risks' && <RisksPage data={data} />}
        {currentPage === 'assistant' && <AssistantPage />}
        {currentPage === 'data' && <DataSourcesPage data={data} />}
      </div>
    </section>
  </main>;
}