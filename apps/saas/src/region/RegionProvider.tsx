/**
 * Region Provider Component
 * Handles multi-region detection, caching, and provider context for BarberZap
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';

// ==================== Types ====================

export type RegionCode = 'latam' | 'us-east' | 'us-west' | 'eu-central' | 'asia-pacific';

export interface RegionConfig {
  id: RegionCode;
  name: string;
  displayName: string;
  flag: string;
  apis: {
    apiUrl: string;
    wsUrl: string;
    realtimeUrl: string;
    supabaseUrl: string;
    supabaseRegion: string;
  };
  timezone: string;
  latency?: number;
  priority: number;
}

export interface GeoInfo {
  country: string;
  countryCode: string;
  city: string;
  timezone: string;
  lat: number;
  lon: number;
}

export interface RegionContextType {
  // Current region
  region: RegionCode;
  regionConfig: RegionConfig | null;
  
  // Detection methods
  detectRegion: () => Promise<RegionCode>;
  autoDetectRegion: () => Promise<void>;
  setRegion: (region: RegionCode) => void;
  
  // State
  isDetecting: boolean;
  geoInfo: GeoInfo | null;
  latency: Record<RegionCode, number | null>;
  
  // Methods
  refreshRegion: () => Promise<void>;
  getOptimalRegion: () => Promise<RegionCode>;
  measureLatency: (region: RegionCode) => Promise<number>;
  measureAllLatencies: () => Promise<Record<RegionCode, number>>;
  
  // Preferences
  preferredRegion: RegionCode | null;
  setPreferredRegion: (region: RegionCode | null) => void;
  allowAutoRegion: boolean;
  setAllowAutoRegion: (allow: boolean) => void;
}

// ==================== Region Configurations ====================

const REGIONS: Record<RegionCode, RegionConfig> = {
  latam: {
    id: 'latam',
    name: 'Latin America',
    displayName: 'América Latina',
    flag: '🇧🇷',
    apis: {
      apiUrl: import.meta.env.VITE_API_URL_LATAM || 'https://api-latam.barberzap.com',
      wsUrl: import.meta.env.VITE_WS_URL_LATAM || 'wss://ws-latam.barberzap.com',
      realtimeUrl: import.meta.env.VITE_REALTIME_URL_LATAM || 'wss://realtime-latam.barberzap.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL_LATAM || '',
      supabaseRegion: import.meta.env.VITE_SUPABASE_REGION_LATAM || 'iad',
    },
    timezone: 'America/Sao_Paulo',
    priority: 1,
  },
  'us-east': {
    id: 'us-east',
    name: 'US East',
    displayName: 'Estados Unidos (Leste)',
    flag: '🇺🇸',
    apis: {
      apiUrl: import.meta.env.VITE_API_URL_USEAST || 'https://api-us-east.barberzap.com',
      wsUrl: import.meta.env.VITE_WS_URL_USEAST || 'wss://ws-us-east.barberzap.com',
      realtimeUrl: import.meta.env.VITE_REALTIME_URL_USEAST || 'wss://realtime-us-east.barberzap.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL_USEAST || '',
      supabaseRegion: import.meta.env.VITE_SUPABASE_REGION_USEAST || 'iad',
    },
    timezone: 'America/New_York',
    priority: 2,
  },
  'us-west': {
    id: 'us-west',
    name: 'US West',
    displayName: 'Estados Unidos (Oeste)',
    flag: '🇺🇸',
    apis: {
      apiUrl: import.meta.env.VITE_API_URL_USWEST || 'https://api-us-west.barberzap.com',
      wsUrl: import.meta.env.VITE_WS_URL_USWEST || 'wss://ws-us-west.barberzap.com',
      realtimeUrl: import.meta.env.VITE_REALTIME_URL_USWEST || 'wss://realtime-us-west.barberzap.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL_USWEST || '',
      supabaseRegion: import.meta.env.VITE_SUPABASE_REGION_USWEST || 'sfo',
    },
    timezone: 'America/Los_Angeles',
    priority: 3,
  },
  'eu-central': {
    id: 'eu-central',
    name: 'Europe Central',
    displayName: 'Europa Central',
    flag: '🇪🇺',
    apis: {
      apiUrl: import.meta.env.VITE_API_URL_EU || 'https://api-eu.barberzap.com',
      wsUrl: import.meta.env.VITE_WS_URL_EU || 'wss://ws-eu.barberzap.com',
      realtimeUrl: import.meta.env.VITE_REALTIME_URL_EU || 'wss://realtime-eu.barberzap.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL_EU || '',
      supabaseRegion: import.meta.env.VITE_SUPABASE_REGION_EU || 'fra',
    },
    timezone: 'Europe/Berlin',
    priority: 4,
  },
  'asia-pacific': {
    id: 'asia-pacific',
    name: 'Asia Pacific',
    displayName: 'Ásia-Pacífico',
    flag: '🌏',
    apis: {
      apiUrl: import.meta.env.VITE_API_URL_AP || 'https://api-ap.barberzap.com',
      wsUrl: import.meta.env.VITE_WS_URL_AP || 'wss://ws-ap.barberzap.com',
      realtimeUrl: import.meta.env.VITE_REALTIME_URL_AP || 'wss://realtime-ap.barberzap.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL_AP || '',
      supabaseRegion: import.meta.env.VITE_SUPABASE_REGION_AP || 'tok',
    },
    timezone: 'Asia/Tokyo',
    priority: 5,
  },
};

// Timezone to region mapping
const TIMEZONE_REGION_MAP: Record<string, RegionCode> = {
  // LATAM
  'America/Sao_Paulo': 'latam',
  'America/Buenos_Aires': 'latam',
  'America/Santiago': 'latam',
  'America/Bogota': 'latam',
  'America/Lima': 'latam',
  'America/Mexico_City': 'latam',
  'America/Caracas': 'latam',
  'America/Manaus': 'latam',
  'America/Fortaleza': 'latam',
  'America/Recife': 'latam',
  'America/Cuiaba': 'latam',
  // US
  'America/New_York': 'us-east',
  'America/Washington': 'us-east',
  'America/Chicago': 'us-east',
  'America/Philadelphia': 'us-east',
  'America/Boston': 'us-east',
  'America/Atlanta': 'us-east',
  'America/Miami': 'us-east',
  'America/Los_Angeles': 'us-west',
  'America/Denver': 'us-west',
  'America/Phoenix': 'us-west',
  'America/Seattle': 'us-west',
  'America/San_Francisco': 'us-west',
  // Europe
  'Europe/London': 'eu-central',
  'Europe/Paris': 'eu-central',
  'Europe/Berlin': 'eu-central',
  'Europe/Amsterdam': 'eu-central',
  'Europe/Rome': 'eu-central',
  'Europe/Madrid': 'eu-central',
  'Europe/Brussels': 'eu-central',
  'Europe/Vienna': 'eu-central',
  // Asia
  'Asia/Tokyo': 'asia-pacific',
  'Asia/Seoul': 'asia-pacific',
  'Asia/Singapore': 'asia-pacific',
  'Asia/Shanghai': 'asia-pacific',
  'Asia/Hong_Kong': 'asia-pacific',
  'Asia/Taipei': 'asia-pacific',
  // Australia
  'Australia/Sydney': 'asia-pacific',
  'Australia/Melbourne': 'asia-pacific',
  'Australia/Perth': 'asia-pacific',
};

// Country code to region mapping
const COUNTRY_REGION_MAP: Record<string, RegionCode> = {
  'BR': 'latam',
  'AR': 'latam',
  'CL': 'latam',
  'CO': 'latam',
  'PE': 'latam',
  'MX': 'latam',
  'VE': 'latam',
  'EC': 'latam',
  'BO': 'latam',
  'PY': 'latam',
  'UY': 'latam',
  'GY': 'latam',
  'SR': 'latam',
  'GF': 'latam',
  'US': 'us-east',
  'CA': 'us-east',
  'GB': 'eu-central',
  'DE': 'eu-central',
  'FR': 'eu-central',
  'ES': 'eu-central',
  'IT': 'eu-central',
  'NL': 'eu-central',
  'BE': 'eu-central',
  'AT': 'eu-central',
  'CH': 'eu-central',
  'PT': 'eu-central',
  'JP': 'asia-pacific',
  'KR': 'asia-pacific',
  'SG': 'asia-pacific',
  'AU': 'asia-pacific',
  'NZ': 'asia-pacific',
  'TW': 'asia-pacific',
  'HK': 'asia-pacific',
  'CN': 'asia-pacific',
  'PH': 'asia-pacific',
  'TH': 'asia-pacific',
  'MY': 'asia-pacific',
  'ID': 'asia-pacific',
  'VN': 'asia-pacific',
};

// ==================== Constants ====================

const STORAGE_KEYS = {
  REGION: 'barberzap_region',
  PREFERRED_REGION: 'barberzap_preferred_region',
  GEO_INFO: 'barberzap_geo_info',
  LATENCY_CACHE: 'barberzap_latency_cache',
  DETECTION_TIME: 'barberzap_region_detection_time',
};

const LATENCY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ==================== Helper Functions ====================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchGeoIP(): Promise<GeoInfo | null> {
  try {
    // Try multiple GeoIP services
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://api.ipify.org?format=json',
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Different services return different structures
        const geoInfo: GeoInfo = {
          country: data.country_name || data.country || '',
          countryCode: (data.country_code || data.countryCode || '').toUpperCase(),
          city: data.city || '',
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          lat: data.latitude || data.lat || 0,
          lon: data.longitude || data.lon || 0,
        };
        
        if (geoInfo.countryCode) {
          return geoInfo;
        }
      } catch (err) {
        console.warn(`GeoIP service failed: ${service}`, err);
      }
    }
  } catch (error) {
    console.error('GeoIP fetch error:', error);
  }
  
  return null;
}

function detectRegionFromTimezone(): RegionCode | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_REGION_MAP[tz] || null;
}

function detectRegionFromCountry(countryCode: string): RegionCode | null {
  return COUNTRY_REGION_MAP[countryCode.toUpperCase()] || null;
}

function detectRegionFromLatLon(lat: number, lon: number): RegionCode {
  // Region centers
  const centers: Record<RegionCode, [number, number]> = {
    latam: [-14.235, -51.925],
    'us-east': [39.044, -77.487],
    'us-west': [37.7749, -122.4194],
    'eu-central': [50.1109, 8.6821],
    'asia-pacific': [35.6762, 139.6503],
  };
  
  let nearestRegion: RegionCode = 'latam'; // Default
  let nearestDistance = Infinity;
  
  for (const [region, [rLat, rLon]] of Object.entries(centers)) {
    const distance = calculateDistance(lat, lon, rLat, rLon);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestRegion = region as RegionCode;
    }
  }
  
  return nearestRegion;
}

// ==================== Context ====================

const RegionContext = createContext<RegionContextType | undefined>(undefined);

interface RegionProviderProps {
  children: ReactNode;
  defaultRegion?: RegionCode;
  enableAutoDetection?: boolean;
}

export function RegionProvider({
  children,
  defaultRegion = 'latam',
  enableAutoDetection = true,
}: RegionProviderProps) {
  // Region state
  const [region, setRegion] = useState<RegionCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.REGION);
    if (stored && stored in REGIONS) {
      return stored as RegionCode;
    }
    return defaultRegion;
  });
  
  const [preferredRegion, setPreferredRegion] = useState<RegionCode | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERRED_REGION);
    if (stored && stored in REGIONS) {
      return stored as RegionCode;
    }
    return null;
  });
  
  const [allowAutoRegion, setAllowAutoRegion] = useState<boolean>(() => {
    const stored = localStorage.getItem('barberzap_allow_auto_region');
    return stored !== 'false';
  });
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.GEO_INFO);
    return stored ? JSON.parse(stored) : null;
  });
  const [latency, setLatency] = useState<Record<RegionCode, number | null>>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.LATENCY_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      const { timestamp, data } = parsed;
      if (Date.now() - timestamp < LATENCY_CACHE_DURATION) {
        return data;
      }
    }
    return {} as Record<RegionCode, number | null>;
  });
  
  // Ref to prevent duplicate detection
  const detectionInProgress = useRef(false);
  
  // Get current region config
  const regionConfig = REGIONS[region];
  
  // Save region to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGION, region);
  }, [region]);
  
  // Save preferences
  useEffect(() => {
    if (preferredRegion) {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_REGION, preferredRegion);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PREFERRED_REGION);
    }
  }, [preferredRegion]);
  
  useEffect(() => {
    localStorage.setItem('barberzap_allow_auto_region', String(allowAutoRegion));
  }, [allowAutoRegion]);
  
  // Measure latency to a specific region
  const measureLatency = useCallback(async (regionCode: RegionCode): Promise<number> => {
    try {
      const config = REGIONS[regionCode];
      const apiUrl = config.apis.apiUrl;
      
      const start = performance.now();
      const response = await fetch(`${apiUrl}/health?latency=true`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000),
      });
      const end = performance.now();
      
      if (response.ok || response.status === 404) {
        const lat = end - start;
        setLatency((prev) => ({ ...prev, [regionCode]: lat }));
        return lat;
      }
      
      return Infinity;
    } catch (error) {
      console.warn(`Latency measurement failed for ${regionCode}:`, error);
      setLatency((prev) => ({ ...prev, [regionCode]: null }));
      return Infinity; // Treat errors as infinite latency
    }
  }, []);
  
  // Measure latency to all regions
  const measureAllLatencies = useCallback(async (): Promise<Record<RegionCode, number>> => {
    const measurements: Record<RegionCode, number> = {} as Record<RegionCode, number>;
    
    // Measure in parallel for speed
    const promises = Object.keys(REGIONS).map((r) => 
      measureLatency(r as RegionCode)
    );
    
    const results = await Promise.all(promises);
    
    Object.keys(REGIONS).forEach((r, i) => {
      measurements[r as RegionCode] = results[i];
    });
    
    // Cache results
    localStorage.setItem(
      STORAGE_KEYS.LATENCY_CACHE,
      JSON.stringify({ timestamp: Date.now(), data: measurements })
    );
    
    return measurements;
  }, [measureLatency]);
  
  // Detect region from GeoIP
  const detectRegion = useCallback(async (): Promise<RegionCode> => {
    // Try GeoIP first
    const geo = await fetchGeoIP();
    
    // Try timezone if GeoIP fails
    const detectedRegion =
      (geo && detectRegionFromCountry(geo.countryCode)) ||
      detectRegionFromTimezone() ||
      (geo && detectRegionFromLatLon(geo.lat, geo.lon)) ||
      defaultRegion;
    
    // Store geo info if available
    if (geo) {
      setGeoInfo(geo);
      localStorage.setItem(STORAGE_KEYS.GEO_INFO, JSON.stringify(geo));
    }
    
    return detectedRegion;
  }, [defaultRegion]);
  
  // Get optimal region based on latency
  const getOptimalRegion = useCallback(async (): Promise<RegionCode> => {
    // If we have cached latency, use it
    const hasLatencyData = Object.values(latency).some((v) => v !== null && v !== undefined);
    
    if (hasLatencyData) {
      const bestRegion = Object.entries(latency).reduce<RegionCode>((best, [r, lat]) => {
        if (lat === null || lat === undefined) return best;
        const currentLat = latency[best];
        if (currentLat === null || currentLat === undefined) return r as RegionCode;
        return lat < currentLat ? (r as RegionCode) : best;
      }, 'latam' as RegionCode);
      
      return bestRegion;
    }
    
    // Otherwise, measure and determine
    const measurements = await measureAllLatencies();
    
    const bestRegion = Object.entries(measurements).reduce<RegionCode>((best, [r, lat]) => {
      const currentLat = measurements[best];
      return lat < currentLat ? (r as RegionCode) : best;
    }, 'latam' as RegionCode);
    
    return bestRegion;
  }, [latency, measureAllLatencies]);
  
  // Auto-detect region
  const autoDetectRegion = useCallback(async () => {
    if (!enableAutoDetection || !allowAutoRegion || detectionInProgress.current) {
      return;
    }
    
    detectionInProgress.current = true;
    setIsDetecting(true);
    
    try {
      if (preferredRegion) {
        setRegion(preferredRegion);
        return;
      }
      
      const detected = await detectRegion();
      setRegion(detected);
      
      // Measure latency for better decision
      setTimeout(() => {
        getOptimalRegion().then((optimal) => {
          // Only switch if optimal is significantly better (50% faster)
          const currentLat = latency[detected];
          const optimalLat = latency[optimal];
          
          if (currentLat && optimalLat && optimalLat < currentLat * 0.5) {
            setRegion(optimal);
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('Region detection failed:', error);
    } finally {
      setIsDetecting(false);
      detectionInProgress.current = false;
    }
  }, [enableAutoDetection, allowAutoRegion, preferredRegion, detectRegion, getOptimalRegion, latency]);
  
  // Refresh region detection
  const refreshRegion = useCallback(async () => {
    await autoDetectRegion();
  }, [autoDetectRegion]);
  
  // Initial detection
  useEffect(() => {
    const storedDetectionTime = localStorage.getItem(STORAGE_KEYS.DETECTION_TIME);
    const now = Date.now();
    const isStale =
      !storedDetectionTime || now - parseInt(storedDetectionTime) > 24 * 60 * 60 * 1000; // 24 hours
    
    if (enableAutoDetection && (isStale || !geoInfo)) {
      autoDetectRegion().then(() => {
        localStorage.setItem(STORAGE_KEYS.DETECTION_TIME, String(now));
      });
    }
  }, [enableAutoDetection, geoInfo, autoDetectRegion]);
  
  // Set region wrapper
  const setRegionWrapper = useCallback((newRegion: RegionCode) => {
    setRegion(newRegion);
    setPreferredRegion(newRegion); // Update preference when manually set
  }, []);
  
  const value: RegionContextType = {
    region,
    regionConfig,
    detectRegion,
    autoDetectRegion,
    setRegion: setRegionWrapper,
    isDetecting,
    geoInfo,
    latency,
    refreshRegion,
    getOptimalRegion,
    measureLatency,
    measureAllLatencies,
    preferredRegion,
    setPreferredRegion,
    allowAutoRegion,
    setAllowAutoRegion,
  };
  
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

// ==================== Hook ====================

export function useRegion(): RegionContextType {
  const context = useContext(RegionContext);
  
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  
  return context;
}

// ==================== Utilities ====================

export function getRegionUrl(region: RegionCode, type: 'api' | 'ws' | 'realtime' | 'supabase'): string {
  const config = REGIONS[region];
  const urls: Record<typeof type, string> = {
    api: config.apis.apiUrl,
    ws: config.apis.wsUrl,
    realtime: config.apis.realtimeUrl,
    supabase: config.apis.supabaseUrl,
  };
  return urls[type];
}

export function getAllRegions(): Array<{ id: RegionCode } & RegionConfig> {
  return Object.entries(REGIONS).map(([id, config]) => ({
    id: id as RegionCode,
    ...config,
  }));
}

export function isRegionHealthy(region: RegionCode): boolean {
  // This could check health status from an API
  return true; // Default: all regions considered healthy
}

// ==================== Region Selector Component ====================

export interface RegionSelectorProps {
  className?: string;
  showFlags?: boolean;
  showLatency?: boolean;
}

export function RegionSelector({ className = '', showFlags = true, showLatency = false }: RegionSelectorProps) {
  const { region, setRegion, latency, measureLatency } = useRegion();
  const allRegions = getAllRegions();
  
  const handleRegionChange = async (newRegion: RegionCode) => {
    setRegion(newRegion);
    await measureLatency(newRegion);
  };
  
  return (
    <div className={`region-selector ${className}`}>
      <select
        value={region}
        onChange={(e) => handleRegionChange(e.target.value as RegionCode)}
        className="region-select"
      >
        {allRegions.map((r) => (
          <option key={r.id} value={r.id}>
            {showFlags && `${r.flag} `}{r.displayName}
            {showLatency && latency[r.id] && ` (${Math.round(latency[r.id]!)}ms)`}
          </option>
        ))}
      </select>
    </div>
  );
}
