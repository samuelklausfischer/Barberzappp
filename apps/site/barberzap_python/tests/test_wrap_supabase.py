"""
Unit Tests for Supabase Wrapper

Tests for SupabaseRestClient wrapper integration.
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch, MagicMock
import requests

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.supabase_rest import (
    SupabaseRestClient,
    SupabaseError,
    SupabaseConnectionError,
    SupabaseResponseError,
    SupabaseValidationError,
    get_client,
    supabase_get,
    supabase_post,
    supabase_patch,
    supabase_delete,
    supabase_upsert
)


@pytest.mark.unit
@pytest.mark.wrapper
class TestSupabaseRestClient:
    """Test suite for SupabaseRestClient."""

    def test_initialization(self):
        """Test client initialization."""
        client = SupabaseRestClient(
            url="https://test.supabase.co",
            service_role_key="test_key"
        )

        assert client.url == "https://test.supabase.co"
        assert client.service_role_key == "test_key"
        assert 'apikey' in client.headers
        assert client.headers['apikey'] == "test_key"
        assert client.headers['Authorization'] == "Bearer test_key"

    def test_initialization_with_env_vars(self):
        """Test client initialization with environment variables."""
        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://env.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'env_key'
        }):
            client = SupabaseRestClient()

            assert client.url == "https://env.supabase.co"
            assert client.service_role_key == "env_key"

    def test_build_url(self):
        """Test URL building for tables."""
        client = SupabaseRestClient(url="https://test.supabase.co")

        url = client._build_url('barbers')
        assert url == "https://test.supabase.co/rest/v1/barbers"

        url = client._build_url('/crm_leads/')
        assert url == "https://test.supabase.co/rest/v1/crm_leads/"

    def test_build_query_string(self):
        """Test query string building."""
        client = SupabaseRestClient()

        # Empty filters
        assert client._build_query_string(None) == ''

        # Simple equality
        filters = {'status': 'active'}
        query = client._build_query_string(filters)
        assert 'status=active' in query

        # Multiple filters
        filters = {
            'status': 'active',
            'limit': '10',
            'order': 'created_at.desc'
        }
        query = client._build_query_string(filters)
        assert 'status=active' in query
        assert 'limit=10' in query
        assert 'order=created_at.desc' in query

        # Select columns
        filters = {'select': 'id,name,price'}
        query = client._build_query_string(filters)
        assert 'select=id%2Cname%2Cprice' in query or 'select=id,name,price' in query

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_get_success(self, mock_request):
        """Test successful GET request."""
        # Mock response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'id': 1, 'name': 'Barber 1'},
            {'id': 2, 'name': 'Barber 2'}
        ]
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.get('barbers', {'active': 'true'})

        assert len(result) == 2
        assert result[0]['name'] == 'Barber 1'
        assert mock_request.called

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_get_single(self, mock_request):
        """Test GET request with single=True."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id': 1, 'name': 'Barber 1'}
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.get('barbers', {'id': 'eq.1'}, single=True)

        assert result['id'] == 1
        assert result['name'] == 'Barber 1'

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_get_empty(self, mock_request):
        """Test GET request returning empty list."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.get('barbers', {'id': 'eq.999'})

        assert result == []

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_post_success(self, mock_request):
        """Test successful POST request."""
        mock_response = Mock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            'id': 1,
            'name': 'New Barber',
            'active': True
        }
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.post('barbers', {'name': 'New Barber', 'active': True})

        assert result['id'] == 1
        assert result['name'] == 'New Barber'

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_post_validation_error(self, mock_request):
        """Test POST with empty data raises validation error."""
        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        with pytest.raises(SupabaseValidationError):
            client.post('barbers', {})

        with pytest.raises(SupabaseValidationError):
            client.post('barbers', None)

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_patch_success(self, mock_request):
        """Test successful PATCH request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 1,
            'name': 'Updated Barber',
            'active': False
        }
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.patch('barbers', 1, {'name': 'Updated Barber', 'active': False})

        assert result['id'] == 1
        assert result['name'] == 'Updated Barber'

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_delete_success(self, mock_request):
        """Test successful DELETE request."""
        mock_response = Mock()
        mock_response.status_code = 204
        mock_response.content = b''
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.delete('barbers', 1)

        assert result is True

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_upsert_insert(self, mock_request):
        """Test upsert inserting new record."""
        # First call (get) returns None
        # Second call (post) inserts
        mock_response_get = Mock()
        mock_response_get.status_code = 200
        mock_response_get.json.return_value = None

        mock_response_post = Mock()
        mock_response_post.status_code = 201
        mock_response_post.json.return_value = {'id': 1, 'instance_name': 'new_instance'}

        mock_request.side_effect = [mock_response_get, mock_response_post]

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.upsert(
            'whatsapp_instances',
            {'instance_name': 'new_instance'},
            {'user_id': '12345', 'status': 'active'}
        )

        assert result['id'] == 1
        assert mock_request.call_count == 2

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_upsert_update(self, mock_request):
        """Test upsert updating existing record."""
        # First call (get) returns existing
        # Second call (patch) updates
        mock_response_get = Mock()
        mock_response_get.status_code = 200
        mock_response_get.json.return_value = {
            'id': 1,
            'instance_name': 'existing_instance',
            'user_id': '12345'
        }

        mock_response_patch = Mock()
        mock_response_patch.status_code = 200
        mock_response_patch.json.return_value = {
            'id': 1,
            'instance_name': 'existing_instance',
            'user_id': '12345',
            'status': 'active'
        }

        mock_request.side_effect = [mock_response_get, mock_response_patch]

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        result = client.upsert(
            'whatsapp_instances',
            {'instance_name': 'existing_instance'},
            {'status': 'active'}
        )

        assert result['id'] == 1
        assert result['status'] == 'active'
        assert mock_request.call_count == 2

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_connection_error(self, mock_request):
        """Test connection error handling."""
        mock_request.side_effect = requests.RequestException("Connection error")

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        with pytest.raises(SupabaseConnectionError):
            client.get('barbers')

    @patch('integrations.supabase_rest.requests.Session.request')
    def test_http_error(self, mock_request):
        """Test HTTP error handling."""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.json.return_value = {'message': 'Unauthorized'}
        mock_request.return_value = mock_response

        client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")

        with pytest.raises(SupabaseResponseError):
            client.get('barbers')

    def test_exists(self, monkeypatch):
        """Test exists method."""
        mock_client = Mock()
        mock_client.get.return_value = {'id': 1}

        # Monkeypatch get_client to return our mock
        import integrations.supabase_rest as sb_module
        original_get_client = sb_module.get_client

        def mock_get_fn():
            return mock_client

        sb_module.get_client = mock_get_fn

        try:
            client = SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key")
            client.get = Mock(return_value={'id': 1})

            assert client.exists('barbers', {'id': 'eq.1'})

            # Test not exists
            client.get = Mock(return_value=None)
            assert not client.exists('barbers', {'id': 'eq.999'})
        finally:
            sb_module.get_client = original_get_client

    def test_context_manager(self):
        """Test client as context manager."""
        with SupabaseRestClient(url="https://test.supabase.co", service_role_key="test_key") as client:
            assert client is not None
            assert hasattr(client, 'session')
        # Session should be closed on exit


@pytest.mark.unit
@pytest.mark.wrapper
class TestSupabaseConvenienceFunctions:
    """Test suite for convenience functions."""

    @patch('integrations.supabase_rest.get_client')
    def test_supabase_get(self, mock_get_client):
        """Test supabase_get convenience function."""
        mock_client = Mock()
        mock_client.get.return_value = [{'id': 1}]
        mock_get_client.return_value = mock_client

        result = supabase_get('barbers', {'active': 'true'})

        assert len(result) == 1
        mock_client.get.assert_called_once()

    @patch('integrations.supabase_rest.get_client')
    def test_supabase_post(self, mock_get_client):
        """Test supabase_post convenience function."""
        mock_client = Mock()
        mock_client.post.return_value = {'id': 1}
        mock_get_client.return_value = mock_client

        result = supabase_post('barbers', {'name': 'Test Barber'})

        assert result['id'] == 1
        mock_client.post.assert_called_once()

    @patch('integrations.supabase_rest.get_client')
    def test_supabase_patch(self, mock_get_client):
        """Test supabase_patch convenience function."""
        mock_client = Mock()
        mock_client.patch.return_value = {'id': 1, 'name': 'Updated'}
        mock_get_client.return_value = mock_client

        result = supabase_patch('barbers', 1, {'name': 'Updated'})

        assert result['name'] == 'Updated'
        mock_client.patch.assert_called_once()

    @patch('integrations.supabase_rest.get_client')
    def test_supabase_delete(self, mock_get_client):
        """Test supabase_delete convenience function."""
        mock_client = Mock()
        mock_client.delete.return_value = True
        mock_get_client.return_value = mock_client

        result = supabase_delete('barbers', 1)

        assert result is True
        mock_client.delete.assert_called_once()

    @patch('integrations.supabase_rest.get_client')
    def test_supabase_upsert(self, mock_get_client):
        """Test supabase_upsert convenience function."""
        mock_client = Mock()
        mock_client.upsert.return_value = {'id': 1}
        mock_get_client.return_value = mock_client

        result = supabase_upsert('barbers', {'name': 'Test'}, {'active': True})

        assert result['id'] == 1
        mock_client.upsert.assert_called_once()

    @patch('integrations.supabase_rest.SupabaseRestClient')
    def test_get_client_singleton(self, mock_client_class):
        """Test get_client returns singleton instance."""
        # Reset global client
        import integrations.supabase_rest as sb_module
        sb_module._default_client = None

        client1 = get_client()
        client2 = get_client()

        assert client1 is client2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
