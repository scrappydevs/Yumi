'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, type Issue, type Group } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  MapPin, 
  Calendar,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  ExternalLink,
  Check,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
  if (!priority) return <Badge variant="outline" className="bg-muted">No Priority</Badge>;
  
  const config = {
    3: { className: 'bg-[hsl(var(--danger))] text-white', label: 'High Priority' },
    2: { className: 'border-[hsl(var(--warning))] text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10', label: 'Medium Priority' },
    1: { className: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]', label: 'Low Priority' },
  };
  
  const priorityConfig = config[priority as keyof typeof config] || config[2];
  
  return (
    <Badge variant={priority === 3 ? 'default' : 'outline'} className={priorityConfig.className}>
      {priorityConfig.label}
    </Badge>
  );
};

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = use(params);
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [locationName, setLocationName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchIssueData() {
      try {
        setLoading(true);
        const [issueData, groupsData] = await Promise.all([
          apiClient.getIssue(issueId),
          apiClient.getGroups(),
        ]);
        
        setIssue(issueData);
        
        if (issueData.group_id) {
          const foundGroup = groupsData.find(g => g.id === issueData.group_id);
          setGroup(foundGroup || null);
        }

        // Reverse geocode the location
        if (issueData.geolocation) {
          const location = await reverseGeocode(issueData.geolocation);
          setLocationName(location.formatted);
        } else {
          setLocationName('No location data');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching issue:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch issue');
      } finally {
        setLoading(false);
      }
    }

    fetchIssueData();
  }, [issueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-[hsl(var(--danger))]" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error loading issue</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error || 'Issue not found'}</p>
        </div>
        <Button onClick={() => router.push('/issues')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Issues
        </Button>
      </div>
    );
  }

  const coordinates = issue.geolocation?.split(',').map(c => parseFloat(c.trim()));
  const spatialViewUrl = coordinates && coordinates.length === 2 
    ? `/spatial?lat=${coordinates[0]}&lng=${coordinates[1]}&zoom=16`
    : null;

  const handleToggleStatus = async () => {
    if (!issue || updating) return;
    
    const newStatus = issue.status === 'complete' ? 'incomplete' : 'complete';
    
    try {
      setUpdating(true);
      const updated = await apiClient.updateIssue(issue.id, { status: newStatus });
      setIssue(updated);
    } catch (err) {
      console.error('Failed to update issue:', err);
      alert('Failed to update issue status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!issue || updating) return;
    
    try {
      setUpdating(true);
      await apiClient.deleteIssue(issue.id);
      router.push('/issues');
    } catch (err) {
      console.error('Failed to delete issue:', err);
      alert('Failed to delete issue');
      setUpdating(false);
    }
  };

  return (
    <div className="h-full flex bg-[hsl(var(--background))]">
      {/* Two Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Column - Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[hsl(var(--card))]/40 backdrop-blur-xl">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/issues')}
              className="border-white/10 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Badge variant="outline" className="bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))]">
              {issue.id.slice(0, 8).toUpperCase()}
            </Badge>
          </div>

          {/* Description Section - Emphasized at top */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold leading-tight mb-4">
              {issue.description || 'Untitled Issue'}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(issue.status || 'incomplete')}
              {getPriorityBadge(issue.priority)}
              {group && (
                <Badge variant="outline" className="bg-[hsl(var(--muted))]/30">
                  {group.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Image Section - Proportional */}
          {issue.image_id && (
            <Card className="mb-6 overflow-hidden bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl">
              <div className="relative bg-[hsl(var(--muted))]/10">
                <img
                  src={issue.image_id}
                  alt="Issue"
                  className="w-full h-auto object-cover max-h-[500px]"
                  style={{ objectFit: 'cover' }}
                />
                <a
                  href={issue.image_id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3"
                >
                  <Button
                    size="sm"
                    className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border-white/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Full Size
                  </Button>
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar Details */}
        <div className="w-96 bg-[hsl(var(--card))]/60 backdrop-blur-xl p-6 overflow-y-auto border-l border-white/5">
          <div className="space-y-4">
            {/* Details Section */}
            <Card className="border-white/10 bg-[hsl(var(--card))]/40">
              <div className="p-4">
                <h3 className="text-sm font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4">
                  Issue Details
                </h3>
                <div className="space-y-4">
                  {/* Issue ID */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1">
                      Issue ID
                    </label>
                    <div className="font-mono text-sm">
                      {issue.id}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Category */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-2">
                      Category
                    </label>
                    {group ? (
                      <Badge variant="outline" className="bg-[hsl(var(--muted))]/30">
                        {group.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Uncategorized</span>
                    )}
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Status */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-2">
                      Status
                    </label>
                    {getStatusBadge(issue.status || 'incomplete')}
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Priority */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-2">
                      Priority
                    </label>
                    {getPriorityBadge(issue.priority)}
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Timestamp */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1">
                      Reported
                    </label>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      <div className="flex flex-col">
                        <span>{formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {format(new Date(issue.timestamp), 'PPpp')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Geolocation */}
                  <div>
                    <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-2">
                      Location
                    </label>
                    {issue.geolocation ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              {locationName}
                            </span>
                            <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                              {issue.geolocation}
                            </span>
                          </div>
                        </div>
                        {spatialViewUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(spatialViewUrl)}
                            className="h-7 px-2 text-xs hover:bg-white/10 text-[hsl(var(--primary))] -ml-2"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            View on Map
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">No location data</span>
                    )}
                  </div>

                  {/* Group ID */}
                  {issue.group_id && (
                    <>
                      <Separator className="bg-white/10" />
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1">
                          Group ID
                        </label>
                        <div className="font-mono text-sm">
                          {issue.group_id}
                        </div>
                      </div>
                    </>
                  )}

                  {/* User ID */}
                  {issue.uid && (
                    <>
                      <Separator className="bg-white/10" />
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1">
                          Reporter ID
                        </label>
                        <div className="font-mono text-xs">
                          {issue.uid}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="border-white/10 bg-[hsl(var(--card))]/40">
              <div className="p-4">
                <h3 className="text-sm font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
                  Actions
                </h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start ${
                      issue.status === 'complete' 
                        ? 'border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20' 
                        : 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20'
                    }`}
                    onClick={handleToggleStatus}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {issue.status === 'complete' ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-white/10 hover:bg-white/10"
                    disabled
                  >
                    Assign to Team
                  </Button>
                  
                  <Separator className="bg-white/10 my-2" />
                  
                  {!showDeleteConfirm ? (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-white/10 hover:bg-[hsl(var(--danger))]/10 hover:border-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={updating}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Issue
                    </Button>
                  ) : (
                    <div className="space-y-2 p-3 bg-[hsl(var(--danger))]/10 border border-[hsl(var(--danger))]/30 rounded-md">
                      <p className="text-xs text-[hsl(var(--danger))] font-medium">
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="flex-1 bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90"
                          onClick={handleDelete}
                          disabled={updating}
                        >
                          {updating ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                          )}
                          Delete
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/10"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={updating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

