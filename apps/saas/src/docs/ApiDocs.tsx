/**
 * ApiDocs.tsx - API Documentation UI Component
 * Embedded ReDoc/Swagger with additional functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  useColorMode,
  useToast,
  Spinner,
  Card,
  CardBody,
  Icon,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  Flex,
  Container
} from '@chakra-ui/react';
import {
  FiBook,
  FiCode,
  FiDownload,
  FiRefreshCw,
  FiSettings,
  FiSearch,
  FiMonitor,
  FiMoon,
  FiSun,
  FiExternalLink,
  FiCopy
} from 'react-icons/fi';

type DocView = 'redoc' | 'swagger';
type Theme = 'light' | 'dark';

interface DocVersion {
  id: string;
  version: string;
  publishedAt: string;
  changes: string;
  endpointsCount: number;
  tagsCount: number;
  schemasCount: number;
}

interface ApiDocsProps {
  /**
   * Base URL for API docs
   */
  baseUrl?: string;
  
  /**
   * Default view to show
   */
  defaultView?: DocView;
  
  /**
   * Default theme
   */
  defaultTheme?: Theme;
  
  /**
   * Show version selector
   */
  showVersionSelector?: boolean;
  
  /**
   * Enable search functionality
   */
  enableSearch?: boolean;
  
  /**
   * Custom title
   */
  title?: string;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({
  baseUrl = '/api/docs',
  defaultView = 'redoc',
  defaultTheme = 'light',
  showVersionSelector = true,
  enableSearch = true,
  title = 'BarberZap API Documentation'
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  const [view, setView] = useState<DocView>(defaultView);
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    endpoints: 0,
    tags: 0,
    schemas: 0
  });
  
  // Load versions
  const loadVersions = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
        
        // Set stats from latest version
        if (data.length > 0) {
          setStats({
            endpoints: data[0].endpointsCount,
            tags: data[0].tagsCount,
            schemas: data[0].schemasCount
          });
        }
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, [baseUrl]);
  
  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          endpoints: data.endpoints,
          tags: data.tags,
          schemas: data.schemas
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [baseUrl]);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);
  
  // Download OpenAPI spec
  const downloadSpec = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/openapi.json`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openapi-${selectedVersion}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'OpenAPI specification downloaded',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download specification',
        status: 'error',
      });
    }
  }, [baseUrl, selectedVersion, toast]);
  
  // Download Postman collection
  const downloadPostman = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/postman/collection`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `postman-collection-${selectedVersion}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'Postman collection downloaded',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download collection',
        status: 'error',
      });
    }
  }, [baseUrl, selectedVersion, toast]);
  
  // Download TypeScript client
  const downloadTypescript = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/typescript/client`);
      if (response.ok) {
        const data = await response.text();
        const blob = new Blob([data], { type: 'application/typescript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-client-${selectedVersion}.ts`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'TypeScript client downloaded',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download client',
        status: 'error',
      });
    }
  }, [baseUrl, selectedVersion, toast]);
  
  // Copy spec URL
  const copySpecUrl = useCallback(() => {
    const url = `${baseUrl}/openapi.json`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Success',
      description: 'Specification URL copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  }, [baseUrl, toast]);
  
  // Refresh docs
  const refreshDocs = useCallback(() => {
    setLoading(true);
    loadVersions();
    loadStats();
    
    // Reload iframe
    const iframe = document.getElementById('docs-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.contentWindow?.location.reload();
    }
  }, [loadVersions, loadStats]);
  
  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  // Get iframe URL based on view and theme
  const getIframeUrl = useCallback(() => {
    const themeSuffix = theme === 'dark' ? '/dark' : '';
    return `${baseUrl}/${view}${themeSuffix}`;
  }, [baseUrl, view, theme]);
  
  // Initial load
  useEffect(() => {
    loadVersions();
    loadStats();
  }, [loadVersions, loadStats]);
  
  return (
    <Box
      width="full"
      minHeight="100vh"
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
    >
      {/* Header */}
      <Box
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        borderBottom="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        py={4}
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Container maxW="container.xl">
          <VStack align="stretch" spacing={3}>
            {/* Title Row */}
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={FiBook} boxSize={6} color="orange.500" />
                <Text fontSize="xl" fontWeight="bold">
                  {title}
                </Text>
                {versions.length > 0 && (
                  <Badge colorScheme="orange">
                    v{versions[0].version}
                  </Badge>
                )}
              </HStack>
              
              <HStack spacing={2}>
                {/* Theme Toggle */}
                <Tooltip label="Toggle theme">
                  <IconButton
                    aria-label="Toggle theme"
                    icon={theme === 'dark' ? <FiSun /> : <FiMoon />}
                    onClick={toggleTheme}
                    variant="ghost"
                    size="sm"
                  />
                </Tooltip>
                
                {/* Refresh */}
                <Tooltip label="Refresh documentation">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    onClick={refreshDocs}
                    variant="ghost"
                    size="sm"
                  />
                </Tooltip>
                
                {/* Download Menu */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Download"
                    icon={<FiDownload />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiCode />} onClick={downloadSpec}>
                      OpenAPI Spec (JSON)
                    </MenuItem>
                    <MenuItem icon={<FiCopy />} onClick={copySpecUrl}>
                      Copy Spec URL
                    </MenuItem>
                    <MenuItem icon={<FiExternalLink />} onClick={downloadPostman}>
                      Postman Collection
                    </MenuItem>
                    <MenuItem icon={<FiCode />} onClick={downloadTypescript}>
                      TypeScript Client
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
            
            {/* Controls Row */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              {/* View Selector */}
              <HStack>
                <Button
                  size="sm"
                  leftIcon={<FiBook />}
                  variant={view === 'redoc' ? 'solid' : 'outline'}
                  colorScheme={view === 'redoc' ? 'orange' : 'gray'}
                  onClick={() => setView('redoc')}
                >
                  ReDoc
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FiMonitor />}
                  variant={view === 'swagger' ? 'solid' : 'outline'}
                  colorScheme={view === 'swagger' ? 'blue' : 'gray'}
                  onClick={() => setView('swagger')}
                >
                  Swagger UI
                </Button>
              </HStack>
              
              {/* Version Selector */}
              {showVersionSelector && versions.length > 0 && (
                <HStack>
                  <Text fontSize="sm" color="gray.500">
                    Version:
                  </Text>
                  <Select
                    size="sm"
                    width="150px"
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                  >
                    <option value="latest">Latest</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.version}>
                        {v.version}
                      </option>
                    ))}
                  </Select>
                </HStack>
              )}
              
              {/* Search */}
              {enableSearch && (
                <Box width="250px">
                  <HStack spacing={2}>
                    <Icon as={FiSearch} color="gray.400" />
                    <input
                      type="text"
                      placeholder="Search endpoints..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid',
                        borderRadius: '6px',
                        outline: 'none',
                        borderColor: '#e2e8f0',
                        background: colorMode === 'dark' ? '#1a202c' : 'white'
                      }}
                    />
                  </HStack>
                </Box>
              )}
            </Flex>
          </VStack>
        </Container>
      </Box>
      
      {/* Stats Bar */}
      <Box
        bg={colorMode === 'dark' ? 'gray.800' : 'gray.100'}
        py={3}
        borderBottom="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        <Container maxW="container.xl">
          <HStack spacing={8} justifyContent="center">
            <HStack>
              <Icon as={FiCode} color="blue.500" />
              <Text fontSize="sm" fontWeight="500">
                {stats.endpoints} Endpoints
              </Text>
            </HStack>
            <HStack>
              <Icon as={FiBook} color="green.500" />
              <Text fontSize="sm" fontWeight="500">
                {stats.tags} Tags
              </Text>
            </HStack>
            <HStack>
              <Icon as={FiSettings} color="purple.500" />
              <Text fontSize="sm" fontWeight="500">
                {stats.schemas} Schemas
              </Text>
            </HStack>
          </HStack>
        </Container>
      </Box>
      
      {/* Documentation iframe */}
      <Box
        flex={1}
        position="relative"
      >
        {loading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
            zIndex={50}
          >
            <VStack spacing={4}>
              <Spinner size="xl" color="orange.500" />
              <Text>Loading documentation...</Text>
            </VStack>
          </Box>
        )}
        
        <iframe
          id="docs-iframe"
          key={getIframeUrl()}
          src={getIframeUrl()}
          style={{
            width: '100%',
            height: 'calc(100vh - 180px)',
            border: 'none'
          }}
          onLoad={handleIframeLoad}
          title="API Documentation"
        />
      </Box>
    </Box>
  );
};

export default ApiDocs;
