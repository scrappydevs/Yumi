'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Building2, 
  Home,
  Loader2,
  X,
} from 'lucide-react';

type LocationResult = {
  displayName: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  category?: string;
};

export function AddressLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  const searchAddress = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `limit=5&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'iFix-Aegis-Dashboard/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      const formattedResults: LocationResult[] = data.map((item: any) => ({
        displayName: item.display_name,
        address: item.display_name.split(',').slice(0, 3).join(','),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        category: item.category,
      }));
      
      setResults(formattedResults);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAddress();
    }
  };

  const selectLocation = (location: LocationResult) => {
    setSelectedLocation(location);
    setResults([]);
    setQuery('');
  };

  const clearSelection = () => {
    setSelectedLocation(null);
  };

  const getLocationIcon = (type?: string) => {
    if (type === 'house' || type === 'residential') return <Home className="w-4 h-4" />;
    if (type === 'building' || type === 'commercial') return <Building2 className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      {/* Address Lookup Header */}
      <div className="flex items-center gap-2 px-3">
        <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
          Address Lookup
        </span>
      </div>

      {/* Search Input */}
      <div className="px-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          <Input
            type="text"
            placeholder="Enter address or place..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="h-9 pl-8 pr-8 text-xs bg-[hsl(var(--background))]/50 border-white/10"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <Button
          onClick={searchAddress}
          disabled={!query.trim() || isLoading}
          size="sm"
          className="w-full h-8 text-xs mt-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Selected Location */}
      {selectedLocation && (
        <div className="px-3">
          <Card className="bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {getLocationIcon(selectedLocation.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[hsl(var(--foreground))] break-words">
                      {selectedLocation.address}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                      {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedLocation.category && (
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  {selectedLocation.category}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="px-3">
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            Found {results.length} location{results.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => selectLocation(result)}
                className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors mt-0.5">
                    {getLocationIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[hsl(var(--foreground))] break-words">
                      {result.address}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {result.type && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mr-1">
                          {result.type}
                        </Badge>
                      )}
                      {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedLocation && results.length === 0 && !isLoading && (
        <div className="px-3 py-4 text-center">
          <MapPin className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))] opacity-30 mb-2" />
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
            Search for addresses, buildings,
            <br />
            and landmarks
          </p>
        </div>
      )}
    </div>
  );
}

