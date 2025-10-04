'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Filter,
  ExternalLink,
  AlertTriangle,
  Zap,
  Droplet,
  Flame,
  ShieldAlert,
  Trash2,
  TreePine,
  TrafficCone,
  Lightbulb,
  HardHat,
  Leaf,
  FileWarning,
} from 'lucide-react';
import { governmentContacts, type IssueCategory } from '@/lib/government-contacts';

// Category icons mapping
const categoryIcons: Record<IssueCategory, React.ReactNode> = {
  roads_infrastructure: <TrafficCone className="w-5 h-5" />,
  utilities_power: <Zap className="w-5 h-5" />,
  utilities_water: <Droplet className="w-5 h-5" />,
  utilities_gas: <Flame className="w-5 h-5" />,
  public_safety: <ShieldAlert className="w-5 h-5" />,
  sanitation: <Trash2 className="w-5 h-5" />,
  parks_recreation: <TreePine className="w-5 h-5" />,
  traffic_signals: <TrafficCone className="w-5 h-5" />,
  street_lighting: <Lightbulb className="w-5 h-5" />,
  building_safety: <HardHat className="w-5 h-5" />,
  environmental: <Leaf className="w-5 h-5" />,
};

// Category display names
const categoryNames: Record<IssueCategory, string> = {
  roads_infrastructure: 'Roads & Infrastructure',
  utilities_power: 'Power Utilities',
  utilities_water: 'Water & Sewer',
  utilities_gas: 'Gas Utilities',
  public_safety: 'Public Safety',
  sanitation: 'Waste & Sanitation',
  parks_recreation: 'Parks & Recreation',
  traffic_signals: 'Traffic Signals',
  street_lighting: 'Street Lighting',
  building_safety: 'Building Safety',
  environmental: 'Environmental',
};

// Get jurisdiction badge color
const getJurisdictionColor = (jurisdiction: string) => {
  if (jurisdiction.includes('Municipal')) return 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]';
  if (jurisdiction.includes('Private')) return 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]';
  if (jurisdiction.includes('State')) return 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]';
  return 'bg-[hsl(var(--muted))]';
};

export default function AgenciesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(governmentContacts.map(a => a.category)));
    return ['all', ...cats];
  }, []);

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    return governmentContacts.filter((agency) => {
      const matchesSearch = 
        agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agency.responsibilities.some(r => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
        agency.issueTypes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || agency.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="px-6 py-6 space-y-6 w-full max-w-[2100px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Government Services & Contacts
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Contact information for agencies that handle infrastructure issues and citizen reports
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="text"
                placeholder="Search by agency, service, or issue type (e.g., 'pothole', 'power outage')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-[hsl(var(--background))]/50 border-white/10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[240px] h-10 bg-[hsl(var(--background))]/50 border-white/10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(c => c !== 'all').map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryNames[cat as IssueCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
            Showing {filteredAgencies.length} of {governmentContacts.length} agencies
          </div>
        </CardContent>
      </Card>

      {/* Agencies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAgencies.length === 0 ? (
          <Card className="lg:col-span-2 bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10">
            <CardContent className="py-12">
              <div className="text-center text-[hsl(var(--muted-foreground))]">
                <Building2 className="w-12 h-12 mx-auto opacity-50 mb-3" />
                <p className="text-sm">No agencies found matching your criteria</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAgencies.map((agency) => (
            <Card
              key={agency.id}
              className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-xl hover:border-white/20 transition-all hover:shadow-2xl"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold tracking-tight">
                      {agency.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${getJurisdictionColor(agency.jurisdiction)}`}>
                        {agency.jurisdiction}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[hsl(var(--muted-foreground))]/30">
                        {categoryNames[agency.category]}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-[hsl(var(--primary))] flex-shrink-0">
                    {categoryIcons[agency.category]}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Responsibilities */}
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                    Handles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agency.responsibilities.map((resp, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80"
                      >
                        {resp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Issue Types */}
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileWarning className="w-3 h-3" />
                    Report These Issues Here
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agency.issueTypes.slice(0, 5).map((issue, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]"
                      >
                        {issue}
                      </Badge>
                    ))}
                    {agency.issueTypes.length > 5 && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        +{agency.issueTypes.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2.5 pt-3 border-t border-white/5">
                  {/* Phone */}
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <a 
                        href={`tel:${agency.phone.replace(/[^0-9]/g, '')}`}
                        className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline font-medium"
                      >
                        {agency.phone}
                      </a>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        {agency.phoneHours}
                      </p>
                      {agency.emergencyPhone && (
                        <p className="text-[10px] text-[hsl(var(--danger))] mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Emergency: {agency.emergencyPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                    <a 
                      href={`mailto:${agency.email}`}
                      className="text-xs text-[hsl(var(--primary))] hover:underline truncate"
                    >
                      {agency.email}
                    </a>
                  </div>

                  {/* Response Time */}
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[hsl(var(--foreground))]">
                      <span className="text-[hsl(var(--muted-foreground))]">Typical response: </span>
                      {agency.averageResponseTime}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {agency.onlineReportingUrl ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-8 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
                      asChild
                    >
                      <a href={agency.onlineReportingUrl} target="_blank" rel="noopener noreferrer">
                        <FileWarning className="w-3.5 h-3.5 mr-1.5" />
                        Report Issue Online
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-8 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
                      asChild
                    >
                      <a href={agency.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-3.5 h-3.5 mr-1.5" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs border-white/10 hover:bg-white/10"
                    asChild
                  >
                    <a href={`tel:${agency.phone.replace(/[^0-9]/g, '')}`}>
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      Call
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
