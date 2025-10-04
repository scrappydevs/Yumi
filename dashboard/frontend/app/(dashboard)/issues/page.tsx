'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useIssues } from '@/hooks/use-issues';
import { apiClient, type Issue, type Group } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';
import { reverseGeocode } from '@/lib/geocoding';

const getStatusBadge = (status: string) => {
  const config = {
    complete: { 
      className: 'border-[hsl(var(--success))] text-[hsl(var(--success))] bg-[hsl(var(--success))]/10',
      label: 'Complete'
    },
    incomplete: { 
      className: 'border-[hsl(var(--warning))] text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10',
      label: 'Incomplete'
    },
  };
  
  const statusConfig = config[status as keyof typeof config] || config.incomplete;
  
  return (
    <Badge variant="outline" className={statusConfig.className}>
      {statusConfig.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: number | null) => {
  if (!priority) return <Badge variant="outline" className="bg-muted">-</Badge>;
  
  const config = {
    3: { className: 'bg-[hsl(var(--danger))] text-white', label: 'High' },
    2: { className: 'border-[hsl(var(--warning))] text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10', label: 'Medium' },
    1: { className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]', label: 'Low' },
  };
  
  const priorityConfig = config[priority as keyof typeof config] || config[2];
  
  return (
    <Badge variant={priority === 3 ? 'default' : 'outline'} className={priorityConfig.className}>
      {priorityConfig.label}
    </Badge>
  );
};

export default function IssuesPage() {
  const router = useRouter();
  const { issues, loading, error } = useIssues();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const data = await apiClient.getGroups();
        setGroups(data);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    }
    fetchGroups();
  }, []);

  // Reverse geocode all issue locations
  useEffect(() => {
    async function geocodeLocations() {
      const names: Record<string, string> = {};
      
      for (const issue of issues) {
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

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          issue.description?.toLowerCase().includes(query) ||
          issue.id.toLowerCase().includes(query) ||
          issue.geolocation?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && issue.status !== statusFilter) {
        return false;
      }

      // Group filter
      if (groupFilter !== 'all' && issue.group_id?.toString() !== groupFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && issue.priority?.toString() !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [issues, searchQuery, statusFilter, groupFilter, priorityFilter]);

  const hasActiveFilters = statusFilter !== 'all' || groupFilter !== 'all' || priorityFilter !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGroupFilter('all');
    setPriorityFilter('all');
  };

  if (loading || loadingGroups) {
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
    <div className="px-6 py-6 space-y-4 w-full max-w-[2100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage and track infrastructure issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {filteredIssues.length} of {issues.length} issues
          </span>
        </div>
      </div>

      {/* Filters - Inline */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            type="text"
            placeholder="Search issues by description, ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
              Status:
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--card))]/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
              Category:
            </label>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[200px] bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--card))]/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <SelectItem value="all">All Categories</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
              Priority:
            </label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--card))]/95 backdrop-blur-xl border-white/10 shadow-2xl">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="1">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-white/10 hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Issues Table */}
      <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-[120px] font-medium text-xs uppercase tracking-wider">ID</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider">Description</TableHead>
                  <TableHead className="w-[150px] font-medium text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="w-[120px] font-medium text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-[100px] font-medium text-xs uppercase tracking-wider">Priority</TableHead>
                  <TableHead className="w-[200px] font-medium text-xs uppercase tracking-wider">Location</TableHead>
                  <TableHead className="w-[150px] font-medium text-xs uppercase tracking-wider">Reported</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                      {hasActiveFilters ? 'No issues match your filters' : 'No issues found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => {
                    const group = groups.find(g => g.id === issue.group_id);
                    return (
                      <TableRow 
                        key={issue.id} 
                        className="hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
                        onClick={() => router.push(`/issues/${issue.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {issue.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm line-clamp-2">
                              {issue.description || 'No description'}
                            </span>
                            {issue.image_id && (
                              <a 
                                href={issue.image_id} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Image
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {group ? (
                            <Badge variant="outline" className="bg-[hsl(var(--muted))]/30">
                              {group.name}
                            </Badge>
                          ) : (
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(issue.status || 'incomplete')}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(issue.priority)}
                        </TableCell>
                        <TableCell>
                          {issue.geolocation ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                              <span className="text-xs">
                                {locationNames[issue.id] || 'Loading...'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                            <span className="text-xs">
                              {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-3 text-xs hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/issues/${issue.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
