import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import { supabase } from '@/infrastructure/supabase/client';

// ==================== Types ====================

export interface SearchResult {
  id: string;
  rank: number;
  result_type: 'client' | 'appointment';
  data: any;
  highlights?: Record<string, string>;
}

export interface SearchSuggestion {
  suggestion: string;
  result_type: string;
  count: number;
}

export interface RecentSearch {
  query: string;
  query_type: string;
  search_count: number;
  last_searched_at: string;
}

interface SearchBarProps {
  shopId: string;
  userId?: string;
  placeholder?: string;
  onResultClick?: (result: SearchResult, position: number) => void;
  className?: string;
  autofocus?: boolean;
  showFilters?: boolean;
}

// ==================== Component ====================

export const SearchBar: React.FC<SearchBarProps> = ({
  shopId,
  userId,
  placeholder = 'Buscar clientes, agendamentos...',
  onResultClick,
  className = '',
  autofocus = false,
  showFilters = true
}) => {
  // ==================== State ====================
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    type: 'global' as 'clients' | 'appointments' | 'global',
    status: '' as string
  });

  // ==================== Refs ====================
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // ==================== Debounce ====================
  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // ==================== Autocomplete ====================
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('search_suggestions', {
          p_shop_id: shopId,
          p_query: debouncedQuery,
          p_limit: 5
        });

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, shopId]);

  // ==================== Search ====================
  
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let data;

        if (filters.type === 'global') {
          const { data: globalData } = await supabase.rpc('search_global', {
            p_shop_id: shopId,
            p_query: debouncedQuery,
            p_limit_per_type: 5
          });
          data = globalData;
        } else if (filters.type === 'clients') {
          const { data: clientsData } = await supabase.rpc('search_clients', {
            p_shop_id: shopId,
            p_query: debouncedQuery,
            p_limit: 10
          });
          data = clientsData;
        } else if (filters.type === 'appointments') {
          const { data: appointmentsData } = await supabase.rpc('search_appointments', {
            p_shop_id: shopId,
            p_query: debouncedQuery,
            p_limit: 10
          });
          data = appointmentsData;
        }

        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, shopId, filters.type]);

  // ==================== Recent Searches ====================
  
  useEffect(() => {
    const fetchRecentSearches = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase.rpc('get_recent_searches', {
          p_shop_id: shopId,
          p_user_id: userId,
          p_limit: 5
        });

        if (error) throw error;
        setRecentSearches(data || []);
      } catch (error) {
        console.error('Error fetching recent searches:', error);
        setRecentSearches([]);
      }
    };

    if (isOpen && query === '') {
      fetchRecentSearches();
    }
  }, [isOpen, query, shopId, userId]);

  // ==================== Keyboard Navigation ====================
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const allItems = [
      ...recentSearches.map((_, i) => ({ type: 'recent', index: i })),
      ...suggestions.map((_, i) => ({ type: 'suggestion', index: i })),
      ...results.map((_, i) => ({ type: 'result', index: i }))
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          const item = allItems[selectedIndex];
          if (item.type === 'result') {
            handleResultClick(results[item.index], item.index);
          } else if (item.type === 'suggestion') {
            handleSuggestionClick(suggestions[item.index]);
          } else if (item.type === 'recent') {
            handleRecentSearchClick(recentSearches[item.index]);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [recentSearches, suggestions, results, selectedIndex]);

  // ==================== Click Handlers ====================
  
  const handleResultClick = async (result: SearchResult, position: number) => {
    setIsOpen(false);
    setQuery('');
    
    // Log analytics
    await supabase.rpc('log_search_click', {
      p_search_id: result.id,
      p_clicked_id: result.id,
      p_click_position: position
    }).catch(console.error);
    
    onResultClick?.(result, position + 1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.suggestion);
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (recent: RecentSearch) => {
    setQuery(recent.query);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setRecentSearches([]);
    setShowFiltersPanel(false);
    inputRef.current?.focus();
  };

  // ==================== Focus Management ====================
  
  const handleFocus = () => {
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  // ==================== Helper Functions ====================
  
  const highlightText = (text: string, query: string) => {
    if (!text) return '';
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return '👤';
      case 'appointment':
        return '📅';
      default:
        return '🔍';
    }
  };

  const getResultTitle = (result: SearchResult) => {
    if (result.result_type === 'client') {
      return result.data.name || result.data.phone_number || 'Cliente';
    } else if (result.result_type === 'appointment') {
      const clientName = result.data.client?.name || result.data.client_name || 'Cliente';
      const date = new Date(result.data.scheduled_at).toLocaleDateString('pt-BR');
      return `${clientName} - ${date}`;
    }
    return 'Resultado';
  };

  const getResultSubtitle = (result: SearchResult) => {
    if (result.result_type === 'client') {
      const parts = [];
      if (result.data.phone_number) parts.push(result.data.phone_number);
      if (result.data.total_visits) parts.push(`${result.data.total_visits} visitas`);
      if (result.data.last_visit_at) {
        const daysAgo = Math.floor((Date.now() - new Date(result.data.last_visit_at).getTime()) / (1000 * 60 * 60 * 24));
        parts.push(`últ. visita ${daysAgo}d atrás`);
      }
      return parts.join(' • ');
    } else if (result.result_type === 'appointment') {
      const date = new Date(result.data.scheduled_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const statusLabels: Record<string, string> = {
        scheduled: 'Agendado',
        confirmed: 'Confirmado',
        completed: 'Concluído',
        cancelled: 'Cancelado',
        no_show: 'Não compareceu'
      };
      const status = statusLabels[result.data.status] || result.data.status;
      return `${date} • ${status}`;
    }
    return '';
  };

  // ==================== Effects ====================
  
  useEffect(() => {
    if (autofocus) {
      inputRef.current?.focus();
    }
  }, [autofocus]);

  // ==================== Render ====================
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-24 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {showFilters && (
              <button
                type="button"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showFiltersPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Filtros"
              >
                <Filter className="h-4 w-4" />
              </button>
            )}
            
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="Limpar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && showFiltersPanel && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border z-50">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="global">Todos</option>
                  <option value="clients">Clientes</option>
                  <option value="appointments">Agendamentos</option>
                </select>
              </div>
              
              {filters.type === 'clients' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto">
            {/* Recent Searches */}
            {query === '' && recentSearches.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <Clock className="h-3 w-3" />
                  BUSCAS RECENTES
                </div>
                <div className="space-y-1">
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={recent.query}
                      onClick={() => handleRecentSearchClick(recent)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-700">{recent.query}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {recent.search_count}x
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setRecentSearches([])}
                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Limpar histórico
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  SUGESTÕES
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, idx) => {
                    const globalIdx = recentSearches.length + idx;
                    return (
                      <button
                        key={`${suggestion.suggestion}-${suggestion.result_type}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedIndex === globalIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-700">{suggestion.suggestion}</span>
                        {suggestion.count > 1 && (
                          <span className="text-gray-400 text-xs ml-2">
                            {suggestion.count}x
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results */}
            {query.length >= 2 && (
              <div>
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm">Buscando...</p>
                  </div>
                ) : results.length > 0 ? (
                  <div>
                    {results.map((result, idx) => {
                      const globalIdx = recentSearches.length + suggestions.length + idx;
                      return (
                        <button
                          key={`${result.result_type}-${result.id}`}
                          onClick={() => handleResultClick(result, idx)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full text-left px-3 py-3 border-b last:border-b-0 transition-colors ${
                            selectedIndex === globalIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{getResultIcon(result.result_type)}</span>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div 
                                  className="font-medium text-gray-900 truncate"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      getResultTitle(result),
                                      query
                                    )
                                  }}
                                />
                                {result.highlights && Object.keys(result.highlights).length > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full shrink-0">
                                    {Object.keys(result.highlights).length} match
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-500 truncate mt-0.5">
                                {getResultSubtitle(result)}
                              </div>
                              
                              {result.highlights && Object.keys(result.highlights).length > 0 && (
                                <div className="mt-1 text-xs text-gray-400 flex flex-wrap gap-2">
                                  {Object.entries(result.highlights).slice(0, 2).map(([key, value]) => (
                                    <span
                                      key={key}
                                      className="truncate"
                                      dangerouslySetInnerHTML={{ __html: value }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Nenhum resultado encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tente buscar por nome, telefone ou email
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
