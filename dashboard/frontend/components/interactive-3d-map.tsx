'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { MapViewState } from '@deck.gl/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Navigation, 
  Layers, 
  Maximize2, 
  AlertCircle,
  MapPin,
  TrendingUp,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { useIssues } from '@/hooks/use-issues';
import { reverseGeocode } from '@/lib/geocoding';

// City presets for navigation - All 50 US States
const CITIES = {
  // West Coast
  seattle: { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321, zoom: 12, pitch: 45, bearing: 0 },
  portland: { name: 'Portland, OR', latitude: 45.5152, longitude: -122.6784, zoom: 12, pitch: 45, bearing: 0 },
  sanFrancisco: { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194, zoom: 12, pitch: 45, bearing: 0 },
  losAngeles: { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437, zoom: 12, pitch: 45, bearing: 0 },
  sanDiego: { name: 'San Diego, CA', latitude: 32.7157, longitude: -117.1611, zoom: 12, pitch: 45, bearing: 0 },
  
  // Southwest
  phoenix: { name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740, zoom: 12, pitch: 45, bearing: 0 },
  lasVegas: { name: 'Las Vegas, NV', latitude: 36.1699, longitude: -115.1398, zoom: 12, pitch: 45, bearing: 0 },
  denver: { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, zoom: 12, pitch: 45, bearing: 0 },
  albuquerque: { name: 'Albuquerque, NM', latitude: 35.0844, longitude: -106.6504, zoom: 12, pitch: 45, bearing: 0 },
  saltLakeCity: { name: 'Salt Lake City, UT', latitude: 40.7608, longitude: -111.8910, zoom: 12, pitch: 45, bearing: 0 },
  
  // Mountain States
  boise: { name: 'Boise, ID', latitude: 43.6150, longitude: -116.2023, zoom: 12, pitch: 45, bearing: 0 },
  billings: { name: 'Billings, MT', latitude: 45.7833, longitude: -108.5007, zoom: 12, pitch: 45, bearing: 0 },
  cheyenne: { name: 'Cheyenne, WY', latitude: 41.1400, longitude: -104.8202, zoom: 12, pitch: 45, bearing: 0 },
  
  // Midwest
  chicago: { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298, zoom: 12, pitch: 45, bearing: 0 },
  detroit: { name: 'Detroit, MI', latitude: 42.3314, longitude: -83.0458, zoom: 12, pitch: 45, bearing: 0 },
  minneapolis: { name: 'Minneapolis, MN', latitude: 44.9778, longitude: -93.2650, zoom: 12, pitch: 45, bearing: 0 },
  milwaukee: { name: 'Milwaukee, WI', latitude: 43.0389, longitude: -87.9065, zoom: 12, pitch: 45, bearing: 0 },
  indianapolis: { name: 'Indianapolis, IN', latitude: 39.7684, longitude: -86.1581, zoom: 12, pitch: 45, bearing: 0 },
  columbus: { name: 'Columbus, OH', latitude: 39.9612, longitude: -82.9988, zoom: 12, pitch: 45, bearing: 0 },
  
  // Great Plains
  kansasCity: { name: 'Kansas City, MO', latitude: 39.0997, longitude: -94.5786, zoom: 12, pitch: 45, bearing: 0 },
  omaha: { name: 'Omaha, NE', latitude: 41.2565, longitude: -95.9345, zoom: 12, pitch: 45, bearing: 0 },
  desMoines: { name: 'Des Moines, IA', latitude: 41.5868, longitude: -93.6250, zoom: 12, pitch: 45, bearing: 0 },
  wichita: { name: 'Wichita, KS', latitude: 37.6872, longitude: -97.3301, zoom: 12, pitch: 45, bearing: 0 },
  fargo: { name: 'Fargo, ND', latitude: 46.8772, longitude: -96.7898, zoom: 12, pitch: 45, bearing: 0 },
  siouxFalls: { name: 'Sioux Falls, SD', latitude: 43.5446, longitude: -96.7311, zoom: 12, pitch: 45, bearing: 0 },
  
  // South
  dallas: { name: 'Dallas, TX', latitude: 32.7767, longitude: -96.7970, zoom: 12, pitch: 45, bearing: 0 },
  houston: { name: 'Houston, TX', latitude: 29.7604, longitude: -95.3698, zoom: 12, pitch: 45, bearing: 0 },
  austin: { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431, zoom: 12, pitch: 45, bearing: 0 },
  sanAntonio: { name: 'San Antonio, TX', latitude: 29.4241, longitude: -98.4936, zoom: 12, pitch: 45, bearing: 0 },
  oklahomacity: { name: 'Oklahoma City, OK', latitude: 35.4676, longitude: -97.5164, zoom: 12, pitch: 45, bearing: 0 },
  littleRock: { name: 'Little Rock, AR', latitude: 34.7465, longitude: -92.2896, zoom: 12, pitch: 45, bearing: 0 },
  newOrleans: { name: 'New Orleans, LA', latitude: 29.9511, longitude: -90.0715, zoom: 12, pitch: 45, bearing: 0 },
  memphis: { name: 'Memphis, TN', latitude: 35.1495, longitude: -90.0490, zoom: 12, pitch: 45, bearing: 0 },
  nashville: { name: 'Nashville, TN', latitude: 36.1627, longitude: -86.7816, zoom: 12, pitch: 45, bearing: 0 },
  
  // Southeast
  atlanta: { name: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880, zoom: 12, pitch: 45, bearing: 0 },
  miami: { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918, zoom: 12, pitch: 45, bearing: 0 },
  orlando: { name: 'Orlando, FL', latitude: 28.5383, longitude: -81.3792, zoom: 12, pitch: 45, bearing: 0 },
  tampa: { name: 'Tampa, FL', latitude: 27.9506, longitude: -82.4572, zoom: 12, pitch: 45, bearing: 0 },
  charlotte: { name: 'Charlotte, NC', latitude: 35.2271, longitude: -80.8431, zoom: 12, pitch: 45, bearing: 0 },
  raleigh: { name: 'Raleigh, NC', latitude: 35.7796, longitude: -78.6382, zoom: 12, pitch: 45, bearing: 0 },
  charleston: { name: 'Charleston, SC', latitude: 32.7765, longitude: -79.9311, zoom: 12, pitch: 45, bearing: 0 },
  birmingham: { name: 'Birmingham, AL', latitude: 33.5186, longitude: -86.8104, zoom: 12, pitch: 45, bearing: 0 },
  jackson: { name: 'Jackson, MS', latitude: 32.2988, longitude: -90.1848, zoom: 12, pitch: 45, bearing: 0 },
  
  // Northeast
  newYork: { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060, zoom: 12, pitch: 45, bearing: 0 },
  boston: { name: 'Boston, MA', latitude: 42.3601, longitude: -71.0589, zoom: 12, pitch: 45, bearing: 0 },
  philadelphia: { name: 'Philadelphia, PA', latitude: 39.9526, longitude: -75.1652, zoom: 12, pitch: 45, bearing: 0 },
  pittsburgh: { name: 'Pittsburgh, PA', latitude: 40.4406, longitude: -79.9959, zoom: 12, pitch: 45, bearing: 0 },
  providence: { name: 'Providence, RI', latitude: 41.8240, longitude: -71.4128, zoom: 12, pitch: 45, bearing: 0 },
  hartford: { name: 'Hartford, CT', latitude: 41.7658, longitude: -72.6734, zoom: 12, pitch: 45, bearing: 0 },
  
  // Mid-Atlantic
  baltimore: { name: 'Baltimore, MD', latitude: 39.2904, longitude: -76.6122, zoom: 12, pitch: 45, bearing: 0 },
  washington: { name: 'Washington, DC', latitude: 38.9072, longitude: -77.0369, zoom: 12, pitch: 45, bearing: 0 },
  richmond: { name: 'Richmond, VA', latitude: 37.5407, longitude: -77.4360, zoom: 12, pitch: 45, bearing: 0 },
  
  // Other States
  louisville: { name: 'Louisville, KY', latitude: 38.2527, longitude: -85.7585, zoom: 12, pitch: 45, bearing: 0 },
  anchorage: { name: 'Anchorage, AK', latitude: 61.2181, longitude: -149.9003, zoom: 12, pitch: 45, bearing: 0 },
  honolulu: { name: 'Honolulu, HI', latitude: 21.3099, longitude: -157.8581, zoom: 12, pitch: 45, bearing: 0 },
};

// Issue data type for map visualization
type IssueData = {
  id: string;
  coordinates: [number, number];
  type: string;
  severity: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'resolved';
};

// Parse geolocation string to coordinates
const parseGeolocation = (geolocation: string | null): [number, number] | null => {
  if (!geolocation) return null;
  
  // Expected format: "lat,lng" or "{lat: X, lng: Y}" or similar
  try {
    // Try parsing as JSON first
    if (geolocation.includes('{')) {
      const parsed = JSON.parse(geolocation);
      if (parsed.lat && parsed.lng) {
        return [parsed.lng, parsed.lat];
      }
    }
    
    // Try parsing as comma-separated values
    const parts = geolocation.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[1], parts[0]]; // [lng, lat]
    }
  } catch (e) {
    console.error('Failed to parse geolocation:', geolocation, e);
  }
  
  return null;
};

interface Interactive3DMapProps {
  className?: string;
}

export function Interactive3DMap({ className }: Interactive3DMapProps) {
  const searchParams = useSearchParams();
  const { issues: rawIssues, loading, error } = useIssues();
  const [selectedCity, setSelectedCity] = useState<keyof typeof CITIES>('sanFrancisco');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [layerType, setLayerType] = useState<'hexagon' | 'heatmap' | 'scatter'>('scatter');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [hoveredIssueId, setHoveredIssueId] = useState<string | null>(null);
  const [customLocationName, setCustomLocationName] = useState<string>('Custom Location');
  
  const [viewState, setViewState] = useState<MapViewState>({
    ...CITIES.sanFrancisco,
  });

  // Handle URL parameters for direct navigation to coordinates
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');
    
    if (lat && lng) {
      // Clear selected city when navigating to specific coordinates
      setSelectedCity('' as keyof typeof CITIES);
      setViewState({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        zoom: zoom ? parseFloat(zoom) : 16,
        pitch: 45,
        bearing: 0,
        transitionDuration: 1500,
      });

      // Find the issue at this location and get its name
      const issue = rawIssues.find(i => i.geolocation === `${lat},${lng}`);
      if (issue && issue.geolocation) {
        reverseGeocode(issue.geolocation).then(result => {
          setCustomLocationName(result.formatted);
        }).catch(() => {
          setCustomLocationName('Custom Location');
        });
      }
    }
  }, [searchParams, rawIssues]);

  // Convert Supabase issues to map visualization format
  const issuesData = useMemo<IssueData[]>(() => {
    if (!rawIssues.length) return [];
    
    const mapped: IssueData[] = [];
    
    for (const issue of rawIssues) {
      const coords = parseGeolocation(issue.geolocation);
      if (!coords) continue;
      
      const priority: 'high' | 'medium' | 'low' = 
        issue.priority === 3 ? 'high' : issue.priority === 1 ? 'low' : 'medium';
      
      mapped.push({
        id: issue.id,
        coordinates: coords,
        type: issue.description?.split(' ')[0] || 'Unknown',
        severity: Math.random(), // TODO: Add severity field to database
        priority,
        status: issue.status === 'complete' ? 'resolved' as const : 'pending' as const,
      });
    }
    
    return mapped;
  }, [rawIssues]);

  // Filter issues by status
  const activeIssues = issuesData.filter(i => i.status !== 'resolved');
  const resolvedIssues = issuesData.filter(i => i.status === 'resolved');

  // Extract unique states from cities
  const states = useMemo(() => {
    const stateSet = new Set(
      Object.values(CITIES).map(city => city.name.split(', ')[1])
    );
    return Array.from(stateSet).sort();
  }, []);

  // Filter cities based on search and state
  const filteredCities = useMemo(() => {
    return Object.entries(CITIES).filter(([key, city]) => {
      const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase());
      const state = city.name.split(', ')[1];
      const matchesState = stateFilter === 'all' || state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [searchQuery, stateFilter]);

  // Handle city change
  const handleCityChange = (city: keyof typeof CITIES) => {
    setSelectedCity(city);
    setViewState({
      ...CITIES[city],
      transitionDuration: 1000,
      transitionInterpolator: undefined,
    });
  };

  // Toggle 2D/3D view
  const toggle3DView = () => {
    setViewMode(prev => prev === '3d' ? '2d' : '3d');
    setViewState({
      ...viewState,
      pitch: viewMode === '3d' ? 0 : 45,
      transitionDuration: 500,
    });
  };

  // Deck.gl layers
  const layers = useMemo(() => {
    const baseLayerProps = {
      id: 'issues-layer',
      data: activeIssues,
      pickable: true,
      autoHighlight: true,
      getPosition: (d: any) => d.coordinates,
    };

    if (layerType === 'hexagon') {
      return [
        new HexagonLayer({
          ...baseLayerProps,
          pickable: false,  // Disable picking for aggregation layers
          extruded: viewMode === '3d',
          radius: 100,
          elevationScale: viewMode === '3d' ? 50 : 0,
          elevationRange: [0, 500],
          coverage: 0.9,
          colorRange: [
            [26, 152, 80, 180],      // Green (low)
            [102, 189, 99, 200],
            [166, 217, 106, 220],
            [217, 239, 139, 230],
            [254, 224, 139, 240],
            [253, 174, 97, 250],
            [244, 109, 67, 255],
            [215, 48, 39, 255],      // Red (high)
          ],
          getColorWeight: (d: any) => d.severity,
          getElevationWeight: (d: any) => d.severity,
        }),
      ];
    } else if (layerType === 'heatmap') {
      return [
        new HeatmapLayer({
          ...baseLayerProps,
          pickable: false,  // Disable picking for aggregation layers
          id: 'heatmap-layer',
          radiusPixels: 60,
          intensity: 1,
          threshold: 0.05,
          getWeight: (d: any) => d.severity,
          colorRange: [
            [26, 152, 80, 0],
            [102, 189, 99, 100],
            [166, 217, 106, 150],
            [217, 239, 139, 180],
            [254, 224, 139, 200],
            [253, 174, 97, 220],
            [244, 109, 67, 240],
            [215, 48, 39, 255],
          ],
        }),
      ];
    } else {
      return [
        new ScatterplotLayer({
          ...baseLayerProps,
          id: 'scatter-layer',
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          getRadius: (d: any) => (d.priority === 'high' ? 15 : d.priority === 'medium' ? 10 : 8),
          getFillColor: (d: any) => {
            if (d.priority === 'high') return [205, 66, 70, 255]; // Red
            if (d.priority === 'medium') return [217, 158, 11, 255]; // Gold
            return [45, 114, 210, 255]; // Blue
          },
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 1,
        }),
      ];
    }
  }, [activeIssues, layerType, viewMode]);

  if (loading) {
    return (
      <div className={className}>
        <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <div className="relative h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading issues...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          <div className="relative h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-[hsl(var(--danger))]" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Error loading issues</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-[hsl(var(--card))]/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
        <div className="relative h-[600px]">
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState as MapViewState)}
            controller={true}
            layers={layers}
            onClick={(info) => {
              if (info.object) {
                const issue = rawIssues.find(i => i.id === info.object.id);
                if (issue) {
                  window.location.href = `/issues/${issue.id}`;
                }
              }
            }}
            getCursor={({ isDragging, isHovering }) => {
              if (isDragging) return 'grabbing';
              if (isHovering && layerType === 'scatter') return 'pointer';
              return 'grab';
            }}
            getTooltip={({ object }) => {
              if (!object) return null;
              const issue = rawIssues.find(i => i.id === object.id);
              if (!issue) {
                // Fallback tooltip if issue data not found
                return {
                  html: `
                    <div style="background: #1C2127; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; max-width: 300px;">
                      <div style="color: white; font-weight: 600; font-size: 13px; margin-bottom: 8px;">Issue Details</div>
                      <div style="color: #A7B6C2; font-size: 12px;">
                        <div>Type: <span style="color: white;">${object.type}</span></div>
                        <div>Status: <span style="color: white;">${object.status}</span></div>
                      </div>
                    </div>
                  `,
                  style: { backgroundColor: 'transparent' }
                };
              }
              
              const imageHtml = issue.image_id ? `
                <img 
                  src="${issue.image_id}" 
                  alt="Issue" 
                  style="width: 100%; height: 120px; object-fit: cover; display: block;"
                  onerror="this.style.display='none'"
                />
              ` : '';
              
              const descriptionText = (issue.description || 'No description')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .substring(0, 100);
              
              return {
                html: `
                  <div style="background: rgba(28, 33, 39, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); max-width: 320px; cursor: pointer;">
                    ${imageHtml}
                    <div style="padding: 12px;">
                      <div style="color: white; font-weight: 600; font-size: 13px; margin-bottom: 8px; line-height: 1.4;">
                        ${descriptionText}${issue.description && issue.description.length > 100 ? '...' : ''}
                      </div>
                      <div style="color: #A7B6C2; font-size: 11px; margin-bottom: 8px;">
                        <div style="margin-bottom: 4px;">ID: <span style="color: white; font-family: monospace;">${issue.id.slice(0, 8).toUpperCase()}</span></div>
                        <div style="margin-bottom: 4px;">Type: <span style="color: white;">${object.type}</span></div>
                        <div>Status: <span style="color: white;">${object.status}</span></div>
                      </div>
                      <div style="display: inline-flex; align-items: center; font-size: 11px; color: #2D72D2; margin-top: 4px; padding: 4px 8px; background: rgba(45, 114, 210, 0.1); border-radius: 4px;">
                        Click to view details →
                      </div>
                    </div>
                  </div>
                `,
                style: {
                  backgroundColor: 'transparent',
                  pointerEvents: 'none',
                },
              };
            }}
          >
            <Map
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
            />
          </DeckGL>

          {/* Control Panel - Top Left */}
          <div className="absolute top-4 left-4 space-y-2">
            {/* City Selector */}
            <Card className="bg-[hsl(var(--card))]/90 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-[hsl(var(--primary))]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
                    Cities
                  </span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="text"
                    placeholder="Search cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-8 text-xs bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* State Filter */}
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-8 text-xs bg-[hsl(var(--card))]/60 backdrop-blur-xl border-white/10 shadow-lg">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--card))]/95 backdrop-blur-xl border-white/10 shadow-2xl">
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Cities List */}
                <div className="max-h-[220px] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-0.5">
                    {filteredCities.length > 0 ? (
                      filteredCities.map(([key, city]) => (
                        <Button
                          key={key}
                          variant={selectedCity === key ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handleCityChange(key as keyof typeof CITIES)}
                          className={
                            selectedCity === key
                              ? 'h-7 text-xs bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 justify-start'
                              : 'h-7 text-xs text-[hsl(var(--muted-foreground))] justify-start hover:bg-white/10'
                          }
                        >
                          {city.name}
                        </Button>
                      ))
                    ) : (
                      <div className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">
                        No cities found
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count */}
                {(searchQuery || stateFilter !== 'all') && (
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] text-center pt-1 border-t border-white/5">
                    {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Layer Controls */}
            <Card className="bg-[hsl(var(--card))]/90 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[hsl(var(--primary))]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
                    Visualization
                  </span>
                </div>
                <div className="space-y-1">
                  {(['hexagon', 'heatmap', 'scatter'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={layerType === type ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLayerType(type)}
                      className={
                        layerType === type
                          ? 'w-full h-7 text-xs justify-start bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90'
                          : 'w-full h-7 text-xs justify-start text-[hsl(var(--muted-foreground))]'
                      }
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 3D Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggle3DView}
              className="w-full bg-[hsl(var(--card))]/90 backdrop-blur-xl border-white/10 shadow-xl hover:bg-[hsl(var(--card))]/100"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              {viewMode === '3d' ? '3D View' : '2D View'}
            </Button>
          </div>

          {/* Stats Panel - Top Right */}
          <div className="absolute top-4 right-4">
            <Card className="bg-[hsl(var(--card))]/90 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-3 space-y-3 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Active Issues
                  </span>
                  <Badge 
                    variant="outline" 
                    className="border-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))]"
                  >
                    {activeIssues.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Resolved
                  </span>
                  <Badge 
                    variant="outline" 
                    className="border-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))]"
                  >
                    {resolvedIssues.length}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-[hsl(var(--border))]">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    City: <span className="text-[hsl(var(--foreground))] font-medium">
                      {selectedCity && CITIES[selectedCity] ? CITIES[selectedCity].name : customLocationName}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legend - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <Card className="bg-[hsl(var(--card))]/90 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))] mb-2">
                  Priority Levels
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--danger))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--warning))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Low</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
