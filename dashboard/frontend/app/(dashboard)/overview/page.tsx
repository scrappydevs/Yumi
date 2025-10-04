'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  TrendingUp, 
  FileText,
  AlertCircle,
  Filter,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIssues, useIssueStats } from '@/hooks/use-issues';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { apiClient, type Group } from '@/lib/api';
import { reverseGeocode } from '@/lib/geocoding';

const formatTimeAgo = (date: Date) => {
  return formatDistanceToNow(date, { addSuffix: true });
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
    resolved: { variant: 'outline', className: 'border-[hsl(var(--success))] text-[hsl(var(--success))]' },
    in_progress: { variant: 'outline', className: 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' },
    pending: { variant: 'outline', className: 'border-[hsl(var(--warning))] text-[hsl(var(--warning))]' },
  };
  const config = variants[status] || variants.pending;
  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
    high: { variant: 'destructive', className: 'bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90' },
    medium: { variant: 'outline', className: 'border-[hsl(var(--warning))] text-[hsl(var(--warning))]' },
    low: { variant: 'secondary', className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' },
  };
  const config = variants[priority] || variants.medium;
  return (
    <Badge variant={config.variant} className={config.className}>
      {priority}
    </Badge>
  );
};

export default function OverviewPage() {
  const router = useRouter();
  const { issues, loading, error } = useIssues();
  const stats = useIssueStats();
  const [groups, setGroups] = useState<Group[]>([]);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  
  // Recent issues filters
  const [recentSearchQuery, setRecentSearchQuery] = useState('');
  const [recentStatusFilter, setRecentStatusFilter] = useState<string>('all');
  const [showRecentFilters, setShowRecentFilters] = useState(false);

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const data = await apiClient.getGroups();
        setGroups(data);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      }
    }
    fetchGroups();
  }, []);

  // Reverse geocode locations for recent issues
  useEffect(() => {
    async function geocodeLocations() {
      const names: Record<string, string> = {};
      const recentIssuesList = issues.slice(0, 6);
      
      for (const issue of recentIssuesList) {
        if (issue.geolocation && !locationNames[issue.id]) {
          try {
            const result = await reverseGeocode(issue.geolocation);
            names[issue.id] = result.formatted;
          } catch (err) {
            names[issue.id] = issue.geolocation;
          }
        }
      }
      
      if (Object.keys(names).length > 0) {
        setLocationNames(prev => ({ ...prev, ...names }));
      }
    }

    if (issues.length > 0) {
      geocodeLocations();
    }
  }, [issues]);

  // Generate trend data from actual issues
  const issuesTrendData = useMemo(() => {
    const days = 5;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MM/dd');
      
      // Count issues reported on or before this day
      const reportedCount = issues.filter(issue => 
        new Date(issue.timestamp) <= date
      ).length;
      
      // Count resolved issues as of this day
      const resolvedCount = issues.filter(issue => 
        issue.status === 'complete' && new Date(issue.timestamp) <= date
      ).length;
      
      trendData.push({
        date: dateStr,
        reported: reportedCount,
        resolved: resolvedCount,
      });
    }
    
    return trendData;
  }, [issues]);

  // Generate category data from groups
  const categoryData = useMemo(() => {
    const categories: Record<number, { name: string; count: number }> = {};
    
    issues.forEach(issue => {
      if (issue.group_id) {
        if (!categories[issue.group_id]) {
          const group = groups.find(g => g.id === issue.group_id);
          categories[issue.group_id] = { 
            name: group?.name || 'Unknown', 
            count: 0 
          };
        }
        categories[issue.group_id].count++;
      }
    });
    
    return Object.values(categories)
      .map(({ name, count }) => ({ category: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [issues, groups]);

  // Get recent issues with group names and full issue data - with filtering
  const recentIssues = useMemo(() => {
    let filtered = issues;

    // Apply search filter
    if (recentSearchQuery) {
      const query = recentSearchQuery.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.description?.toLowerCase().includes(query) ||
        issue.id.toLowerCase().includes(query) ||
        (locationNames[issue.id] && locationNames[issue.id].toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (recentStatusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === recentStatusFilter);
    }

    return filtered.slice(0, 6).map(issue => {
      const group = groups.find(g => g.id === issue.group_id);
      return {
        fullId: issue.id,  // Keep full ID for navigation
        id: issue.id.slice(0, 8).toUpperCase(),
        type: group?.name || issue.description?.slice(0, 30) || 'Unknown',
        location: locationNames[issue.id] || issue.geolocation || 'Location unknown',
        priority: issue.priority === 3 ? 'high' as const : issue.priority === 2 ? 'medium' as const : 'low' as const,
        status: issue.status === 'complete' ? 'resolved' : issue.status === 'incomplete' ? 'in_progress' : 'pending' as const,
        reported: formatTimeAgo(new Date(issue.timestamp)),
      };
    });
  }, [issues, groups, locationNames, recentSearchQuery, recentStatusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-[hsl(var(--danger))]" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error loading issues</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6 w-full max-w-[2100px]">
      {/* Quick Stats - Inline */}
      <div className="flex gap-8 items-center flex-wrap">
        <div className="flex flex-col">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Total Issues</span>
          <span className="text-3xl font-semibold tabular-nums">{stats.totalIssues}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Resolved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{stats.resolved}</span>
            <span className="text-sm text-[hsl(var(--success))]">({stats.resolutionRate}%)</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">In Progress</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{stats.inProgress}</span>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">({stats.avgTime}d avg)</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Critical</span>
          <span className="text-3xl font-semibold tabular-nums text-[hsl(var(--danger))]">{stats.critical}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issues Trend Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl hover:border-white/20 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Issue Trend</CardTitle>
            <CardDescription className="text-xs">Reported vs Resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={issuesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reported" 
                    name="Reported"
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorReported)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    name="Resolved"
                    stroke="hsl(var(--success))" 
                    fill="url(#colorResolved)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issue Categories - 1 column */}
        <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl hover:border-white/20 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <CardDescription className="text-xs">Issue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryData.map((item) => (
                <div
                  key={item.category}
                  className="flex justify-between items-center py-2 px-2 rounded-md transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                    <span className="text-sm text-foreground">{item.category}</span>
                  </div>
                  <span className="text-lg tabular-nums font-medium text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl hover:border-white/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Recent Issues</CardTitle>
              <CardDescription className="text-xs mt-1">Latest infrastructure reports</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs hover:bg-white/10"
                onClick={() => setShowRecentFilters(!showRecentFilters)}
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Filter
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs hover:bg-white/10"
                onClick={() => setShowRecentFilters(!showRecentFilters)}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Search
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          {showRecentFilters && (
            <div className="mt-4 space-y-3 pt-4 border-t border-white/5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                <Input
                  type="text"
                  placeholder="Search recent issues..."
                  value={recentSearchQuery}
                  onChange={(e) => setRecentSearchQuery(e.target.value)}
                  className="h-8 pl-9 pr-9 text-xs bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg"
                />
                {recentSearchQuery && (
                  <button
                    onClick={() => setRecentSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
                  Status:
                </label>
                <Select value={recentStatusFilter} onValueChange={setRecentStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--card))]/95 backdrop-blur-xl border-white/10 shadow-2xl">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
                {(recentSearchQuery || recentStatusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRecentSearchQuery('');
                      setRecentStatusFilter('all');
                    }}
                    className="h-7 text-xs hover:bg-white/10"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                {recentSearchQuery || recentStatusFilter !== 'all' 
                  ? 'No issues match your filters' 
                  : 'No issues found'}
              </div>
            ) : (
              recentIssues.map((issue, index) => (
              <div
                key={issue.id}
                className={`flex items-center justify-between py-3 px-3 rounded-md hover:bg-white/5 transition-colors cursor-pointer ${
                  index !== recentIssues.length - 1 ? 'border-b border-white/5' : ''
                }`}
                onClick={() => router.push(`/issues/${issue.fullId}`)}
              >
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <span className="text-xs font-mono font-medium text-muted-foreground min-w-[75px]">
                    {issue.id}
                  </span>
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{issue.type}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{issue.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {getPriorityBadge(issue.priority)}
                  {getStatusBadge(issue.status)}
                  <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                    {issue.reported}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-3 text-xs hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/issues/${issue.fullId}`);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
