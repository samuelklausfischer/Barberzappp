import React, { useState, useCallback } from 'react';
import { SearchBar, SearchResult } from '@/components/SearchBar';
import { Search, Download, ArrowLeft, BarChart3, Users, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/infrastructure/supabase/client';

// ==================== Types ====================

interface SearchFilters {
  type: 'global' | 'clients' | 'appointments';
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minVisits?: number;
  maxVisits?: number;
}

interface SearchPageProps {
  shopId: string;
  userId?: string;
  onNavigateBack?: () => void;
}

// ==================== Component ====================

export const SearchPage: React.FC<SearchPageProps> = ({
  shopId,
  userId,
  onNavigateBack
}) => {
  // ==================== State ====================
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'clients' | 'appointments'>('global');
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ==================== Handlers ====================
  
  const handleSearch = useCallback(async (searchQuery: string, type: 'clients' | 'appointments' | 'global') => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setQuery(searchQuery);
    setActiveTab(type);

    try {
      let data;
      let count = 0;

      if (type === 'global') {
        const { data: globalData } = await supabase.rpc('search_global', {
          p_shop_id: shopId,
          p_query: searchQuery,
          p_limit_per_type: 20
        });
        data = globalData || [];
        count = data.length;
      } else if (type === 'clients') {
        const { data: clientsData } = await supabase.rpc('search_clients', {
          p_shop_id: shopId,
          p_query: searchQuery,
          p_limit: 50
        });
        
        // Get total count
        const { count: totalCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId);
        
        data = clientsData || [];
        count = totalCount || 0;
      } else if (type === 'appointments') {
        const { data: appointmentsData } = await supabase.rpc('search_appointments', {
          p_shop_id: shopId,
          p_query: searchQuery,
          p_limit: 50
        });
        
        // Get total count
        const { count: totalCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shopId);
        
        data = appointmentsData || [];
        count = totalCount || 0;
      }

      setResults(data);
      setTotalResults(count);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const handleResultClick = useCallback((result: SearchResult, position: number) => {
    console.log('Result clicked:', result, 'Position:', position);
    // Handle navigation to result details
    // This would typically navigate to a detail page
    if (result.result_type === 'client') {
      // Navigate to client detail
      console.log('Navigate to client:', result.data.id);
    } else if (result.result_type === 'appointment') {
      // Navigate to appointment detail
      console.log('Navigate to appointment:', result.data.id);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (results.length === 0) return;

    try {
      let csv = 'Tipo,ID,Nome/Descrição,Detalhes\n';
      
      results.forEach((result, idx) => {
        if (result.result_type === 'client') {
          csv += `Cliente,${result.id},"${result.data.name}","${result.data.phone_number}"${idx < results.length - 1 ? '\n' : ''}`;
        } else if (result.result_type === 'appointment') {
          const clientName = result.data.client?.name || result.data.client_name || 'N/A';
          const date = new Date(result.data.scheduled_at).toLocaleString('pt-BR');
          csv += `Agendamento,${result.id},"${clientName}","${date}"${idx < results.length - 1 ? '\n' : ''}`;
        }
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `barberzap_search_${query}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [results, query]);

  // ==================== Render ====================
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              
              <div className="flex items-center gap-2">
                <Search className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Busca</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`p-2 rounded-lg transition-colors ${
                  showAnalytics ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Analytics"
              >
                <BarChart3 className="h-5 w-5" />
              </button>

              {results.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            shopId={shopId}
            userId={userId}
            placeholder="Buscar clientes, agendamentos..."
            onResultClick={handleResultClick}
            autofocus
          />
        </div>

        {/* Analytics Panel */}
        {showAnalytics && <AnalyticsPanel shopId={shopId} />}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="flex border-b">
            <button
              onClick={() => handleSearch(query, 'global')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'global'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="h-4 w-4" />
              Todos
            </button>
            
            <button
              onClick={() => handleSearch(query, 'clients')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Clientes
            </button>
            
            <button
              onClick={() => handleSearch(query, 'appointments')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'appointments'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Agendamentos
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <LoadingState />
          ) : results.length > 0 ? (
            <ResultsList results={results} query={query} onResultClick={handleResultClick} />
          ) : query.length >= 2 ? (
            <EmptyState query={query} />
          ) : (
            <WelcomeState />
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Sub Components ====================

interface AnalyticsPanelProps {
  shopId: string;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ shopId }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await supabase.rpc('get_search_metrics', {
          p_shop_id: shopId,
          p_days: 30
        });
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [shopId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        Buscas nos últimos 30 dias
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{metrics.total_searches || 0}</div>
          <div className="text-sm text-gray-600">Total de buscas</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{(metrics.ctr * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Taxa de cliques (CTR)</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{metrics.unique_queries || 0}</div>
          <div className="text-sm text-gray-600">Queries únicas</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{(metrics.no_results_rate * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Sem resultado</div>
        </div>
      </div>
    </div>
  );
};

interface ResultsListProps {
  results: SearchResult[];
  query: string;
  onResultClick: (result: SearchResult, position: number) => void;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, query, onResultClick }) => {
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
      if (result.data.email) parts.push(result.data.email);
      if (result.data.total_visits) parts.push(`${result.data.total_visits} visitas`);
      return parts.join(' • ');
    } else if (result.result_type === 'appointment') {
      const date = new Date(result.data.scheduled_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="divide-y">
      {results.map((result, idx) => (
        <button
          key={`${result.result_type}-${result.id}`}
          onClick={() => onResultClick(result, idx)}
          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl">{getResultIcon(result.result_type)}</span>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="font-semibold text-gray-900 truncate"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(getResultTitle(result), query)
                  }}
                />
                {result.result_type === 'appointment' && getStatusBadge(result.data.status)}
              </div>
              
              <p className="text-sm text-gray-500 mb-2">{getResultSubtitle(result)}</p>
              
              {result.highlights && Object.keys(result.highlights).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.highlights).slice(0, 3).map(([key, value]) => (
                    <span
                      key={key}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded truncate max-w-xs"
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                  ))}
                </div>
              )}
              
              {result.result_type === 'client' && result.data.tags && result.data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.data.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
                    <span
                      key={tagIdx}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {result.data.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{result.data.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-400 whitespace-nowrap">
              Rank: {Math.round(result.rank * 100) / 100}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="p-12 text-center">
    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p className="text-gray-600">Buscando...</p>
  </div>
);

const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <div className="p-12 text-center">
    <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Nenhum resultado para "{query}"
    </h3>
    <p className="text-gray-500 mb-4">
      Tente buscar por outro termo ou ajuste os filtros
    </p>
    <div className="max-w-md mx-auto text-left bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Dicas de busca:</h4>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>• Nome completo ou parcial do cliente</li>
        <li>• Número de telefone</li>
        <li>• Email</li>
        <li>• Status do agendamento</li>
        <li>• Notas do agendamento</li>
      </ul>
    </div>
  </div>
);

const WelcomeState: React.FC = () => (
  <div className="p-12 text-center">
    <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Busque em toda a barra
    </h3>
    <p className="text-gray-500 mb-6">
      Encontre clientes, agendamentos e muito mais
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <Users className="h-8 w-8 text-blue-600 mb-2" />
        <h4 className="font-medium text-gray-900 mb-1">Clientes</h4>
        <p className="text-sm text-gray-500">
          Busque por nome, telefone, email ou tags
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <Calendar className="h-8 w-8 text-green-600 mb-2" />
        <h4 className="font-medium text-gray-900 mb-1">Agendamentos</h4>
        <p className="text-sm text-gray-500">
          Encontre por data, status ou notas
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
        <h4 className="font-medium text-gray-900 mb-1">Analytics</h4>
        <p className="text-sm text-gray-500">
          Veja buscas populares e métricas
        </p>
      </div>
    </div>
  </div>
);

export default SearchPage;
