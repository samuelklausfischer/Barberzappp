"""
Unit Tests for CRM Logger

Tests for CRM Logger functions using pytest.
"""

import pytest
import os
import sys
from unittest.mock import patch, Mock
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crm.crm_logger import (
    upsert_lead,
    log_message,
    get_lead_history,
    lead_exists,
    get_lead_by_id,
    update_lead_status,
    list_leads,
    get_message_by_id,
    CRMError,
    CRMLeadNotFoundError,
    CRMMessageError
)


@pytest.mark.unit
@pytest.mark.crm
class TestUpsertLead:
    """Test suite for upsert_lead function."""

    @patch('crm.crm_logger.get_client')
    def test_upsert_lead_create_new(self, mock_get_client):
        """Test creating a new lead."""
        mock_client = Mock()
        mock_client.get.return_value = None  # Lead doesn't exist
        mock_client.post.return_value = {
            'id': 123,
            'tenant_id': 'tenant_001',
            'phone': '5511999999999',
            'name': 'João Silva',
            'status': 'new'
        }
        mock_get_client.return_value = mock_client

        result = upsert_lead(
            tenant_id='tenant_001',
            phone='5511999999999',
            name='João Silva',
            status='new',
            email='joao@email.com'
        )

        assert result['success'] is True
        assert result['id'] == 123
        assert result['name'] == 'João Silva'
        assert result['status'] == 'new'
        # Verify post was called
        mock_client.post.assert_called_once()

    @patch('crm.crm_logger.get_client')
    def test_upsert_lead_update_existing(self, mock_get_client):
        """Test updating an existing lead."""
        mock_client = Mock()
        # Lead exists
        mock_client.get.return_value = {
            'id': 123,
            'tenant_id': 'tenant_001',
            'phone': '5511999999999',
            'name': 'João Silva',
            'status': 'new'
        }
        mock_client.patch.return_value = {
            'id': 123,
            'name': 'João Silva',
            'status': 'contacted',
            'notes': 'Updated notes'
        }
        mock_get_client.return_value = mock_client

        result = upsert_lead(
            tenant_id='tenant_001',
            phone='5511999999999',
            status='contacted',
            notes='Updated notes'
        )

        assert result['success'] is True
        assert result['id'] == 123
        # Verify patch was called
        mock_client.patch.assert_called_once()

    @patch('crm.crm_logger.get_client')
    def test_upsert_lead_with_metadata(self, mock_get_client):
        """Test upsert with metadata."""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_client.post.return_value = {
            'id': 124,
            'tenant_id': 'tenant_001',
            'phone': '5511988888888',
            'name': 'Maria Santos',
            'metadata': {'source': 'whatsapp', 'campaign': 'teste'}
        }
        mock_get_client.return_value = mock_client

        result = upsert_lead(
            tenant_id='tenant_001',
            phone='5511988888888',
            name='Maria Santos',
            metadata={'source': 'whatsapp', 'campaign': 'teste'}
        )

        assert result['success'] is True
        assert 'metadata' in result


@pytest.mark.unit
@pytest.mark.crm
class TestLogMessage:
    """Test suite for log_message function."""

    @patch('crm.crm_logger.get_client')
    @patch('crm.crm_logger.upsert_lead')
    def test_log_message_inbound(self, mock_upsert, mock_get_client):
        """Test logging an inbound message."""
        mock_upsert.return_value = {'id': 123, 'success': True}
        mock_client = Mock()
        mock_client.post.return_value = {
            'id': 456,
            'direction': 'inbound',
            'message': 'Olá, quero agendar'
        }
        mock_get_client.return_value = mock_client

        result = log_message(
            tenant_id='tenant_001',
            phone='5511999999999',
            sender='cliente',
            message='Olá, quero agendar'
        )

        assert result['success'] is True
        assert result['direction'] == 'inbound'
        assert result['message'] == 'Olá, quero agendar'
        # Verify upsert_lead was called to ensure lead exists
        mock_upsert.assert_called_once()

    @patch('crm.crm_logger.get_client')
    @patch('crm.crm_logger.upsert_lead')
    def test_log_message_outbound(self, mock_upsert, mock_get_client):
        """Test logging an outbound message."""
        mock_upsert.return_value = {'id': 123, 'success': True}
        mock_client = Mock()
        mock_client.post.return_value = {
            'id': 457,
            'direction': 'outbound',
            'message': 'Claro! Qual horário prefere?'
        }
        mock_get_client.return_value = mock_client

        result = log_message(
            tenant_id='tenant_001',
            phone='5511999999999',
            sender='sistema',
            message='Claro! Qual horário prefere?',
            direction='outbound'
        )

        assert result['success'] is True
        assert result['direction'] == 'outbound'

    @patch('crm.crm_logger.get_client')
    @patch('crm.crm_logger.upsert_lead')
    def test_log_message_auto_direction(self, mock_upsert, mock_get_client):
        """Test automatic direction detection."""
        mock_upsert.return_value = {'id': 123, 'success': True}
        mock_client = Mock()
        mock_client.post.return_value = {
            'id': 458,
            'direction': 'outbound',
            'message': 'Bot response'
        }
        mock_get_client.return_value = mock_client

        # Sender 'bot' should auto-detect as outbound
        result = log_message(
            tenant_id='tenant_001',
            phone='5511999999999',
            sender='bot',
            message='Bot response'
        )

        assert result['success'] is True
        assert result['direction'] == 'outbound'

    @patch('crm.crm_logger.get_client')
    @patch('crm.crm_logger.upsert_lead')
    def test_log_message_with_metadata(self, mock_upsert, mock_get_client):
        """Test logging message with metadata."""
        mock_upsert.return_value = {'id': 123, 'success': True}
        mock_client = Mock()
        mock_client.post.return_value = {
            'id': 459,
            'direction': 'inbound',
            'message': 'Test'
        }
        mock_get_client.return_value = mock_client

        metadata = {'whatsapp_message_id': 'wa_123', 'timestamp': '2024-01-15T10:00:00'}

        result = log_message(
            tenant_id='tenant_001',
            phone='5511999999999',
            sender='cliente',
            message='Test',
            metadata=metadata
        )

        assert result['success'] is True


@pytest.mark.unit
@pytest.mark.crm
class TestGetLeadHistory:
    """Test suite for get_lead_history function."""

    @patch('crm.crm_logger.get_client')
    def test_get_lead_history_empty(self, mock_get_client):
        """Test getting history with no messages."""
        mock_client = Mock()
        mock_client.get.return_value = []
        mock_get_client.return_value = mock_client

        history = get_lead_history(
            tenant_id='tenant_001',
            phone='5511999999999'
        )

        assert history == []

    @patch('crm.crm_logger.get_client')
    def test_get_lead_history_with_messages(self, mock_get_client):
        """Test getting history with messages."""
        mock_client = Mock()
        mock_client.get.return_value = [
            {
                'id': 1,
                'direction': 'inbound',
                'sender': 'cliente',
                'message': 'Olá',
                'created_at': '2024-01-15T10:00:00'
            },
            {
                'id': 2,
                'direction': 'outbound',
                'sender': 'assistent',
                'message': 'Olá! Como posso ajudar?',
                'created_at': '2024-01-15T10:01:00'
            }
        ]
        mock_get_client.return_value = mock_client

        history = get_lead_history(
            tenant_id='tenant_001',
            phone='5511999999999'
        )

        assert len(history) == 2
        assert history[0]['message'] == 'Olá'
        assert history[1]['message'] == 'Olá! Como posso ajudar?'

    @patch('crm.crm_logger.get_client')
    def test_get_lead_history_with_limit(self, mock_get_client):
        """Test getting history with limit."""
        mock_client = Mock()
        mock_client.get.return_value = [
            {'id': i, 'message': f'Message {i}'}
            for i in range(1, 11)
        ]
        mock_get_client.return_value = mock_client

        history = get_lead_history(
            tenant_id='tenant_001',
            phone='5511999999999',
            limit=5
        )

        assert len(history) <= 5

    @patch('crm.crm_logger.get_client')
    @patch('crm.crm_logger.upsert_lead')
    def test_get_lead_history_with_lead_info(self, mock_upsert, mock_get_client):
        """Test getting history with lead information."""
        mock_upsert.return_value = {
            'id': 123,
            'name': 'João Silva'
        }
        mock_client = Mock()
        # Get messages
        mock_client.get.return_value = [
            {
                'id': 1,
                'message': 'Test',
                'created_at': '2024-01-15T10:00:00'
            }
        ]
        mock_get_client.return_value = mock_client

        history = get_lead_history(
            tenant_id='tenant_001',
            phone='5511999999999',
            include_lead_info=True
        )

        assert len(history) > 0
        assert '_lead_info' in history[0]


@pytest.mark.unit
@pytest.mark.crm
class TestLeadExists:
    """Test suite for lead_exists function."""

    @patch('crm.crm_logger.get_client')
    def test_lead_exists_true(self, mock_get_client):
        """Test lead exists returns True."""
        mock_client = Mock()
        mock_client.get.return_value = {'id': 123, 'phone': '5511999999999'}
        mock_get_client.return_value = mock_client

        exists = lead_exists(
            tenant_id='tenant_001',
            phone='5511999999999'
        )

        assert exists is True

    @patch('crm.crm_logger.get_client')
    def test_lead_exists_false(self, mock_get_client):
        """Test lead exists returns False."""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_get_client.return_value = mock_client

        exists = lead_exists(
            tenant_id='tenant_001',
            phone='5511999999999'
        )

        assert exists is False


@pytest.mark.unit
@pytest.mark.crm
class TestGetLeadById:
    """Test suite for get_lead_by_id function."""

    @patch('crm.crm_logger.get_client')
    def test_get_lead_by_id_success(self, mock_get_client):
        """Test getting lead by ID."""
        mock_client = Mock()
        mock_client.get.return_value = {
            'id': 123,
            'name': 'João Silva',
            'phone': '5511999999999',
            'status': 'new'
        }
        mock_get_client.return_value = mock_client

        lead = get_lead_by_id(
            tenant_id='tenant_001',
            lead_id=123
        )

        assert lead is not None
        assert lead['id'] == 123
        assert lead['name'] == 'João Silva'

    @patch('crm.crm_logger.get_client')
    def test_get_lead_by_id_not_found(self, mock_get_client):
        """Test getting non-existent lead."""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_get_client.return_value = mock_client

        lead = get_lead_by_id(
            tenant_id='tenant_001',
            lead_id=999
        )

        assert lead is None


@pytest.mark.unit
@pytest.mark.crm
class TestUpdateLeadStatus:
    """Test suite for update_lead_status function."""

    @patch('crm.crm_logger.get_client')
    def test_update_lead_status_success(self, mock_get_client):
        """Test successful status update."""
        mock_client = Mock()
        mock_client.get.return_value = {
            'id': 123,
            'status': 'new'
        }
        mock_client.patch.return_value = {
            'id': 123,
            'status': 'contacted',
            'notes': 'Status updated'
        }
        mock_get_client.return_value = mock_client

        result = update_lead_status(
            tenant_id='tenant_001',
            phone='5511999999999',
            status='contacted',
            notes='Status updated'
        )

        assert result['success'] is True
        assert result['status'] == 'contacted'

    @patch('crm.crm_logger.get_client')
    def test_update_lead_status_not_found(self, mock_get_client):
        """Test updating non-existent lead."""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_get_client.return_value = mock_client

        with pytest.raises(CRMLeadNotFoundError):
            update_lead_status(
                tenant_id='tenant_001',
                phone='5511999999999',
                status='contacted'
            )


@pytest.mark.unit
@pytest.mark.crm
class TestListLeads:
    """Test suite for list_leads function."""

    @patch('crm.crm_logger.get_client')
    def test_list_leads_all(self, mock_get_client):
        """Test listing all leads."""
        mock_client = Mock()
        mock_client.get.return_value = [
            {'id': 1, 'name': 'João', 'status': 'new'},
            {'id': 2, 'name': 'Maria', 'status': 'new'}
        ]
        mock_get_client.return_value = mock_client

        leads = list_leads(tenant_id='tenant_001')

        assert len(leads) == 2
        assert leads[0]['name'] == 'João'

    @patch('crm.crm_logger.get_client')
    def test_list_leads_by_status(self, mock_get_client):
        """Test listing leads by status."""
        mock_client = Mock()
        mock_client.get.return_value = [
            {'id': 1, 'name': 'João', 'status': 'contacted'},
            {'id': 2, 'name': 'Maria', 'status': 'contacted'}
        ]
        mock_get_client.return_value = mock_client

        leads = list_leads(
            tenant_id='tenant_001',
            status='contacted'
        )

        assert len(leads) == 2
        assert all(lead['status'] == 'contacted' for lead in leads)

    @patch('crm.crm_logger.get_client')
    def test_list_leads_with_limit(self, mock_get_client):
        """Test listing leads with limit."""
        mock_client = Mock()
        mock_client.get.return_value = [
            {'id': i, 'name': f'Lead {i}'}
            for i in range(1, 11)
        ]
        mock_get_client.return_value = mock_client

        leads = list_leads(
            tenant_id='tenant_001',
            limit=5
        )

        assert len(leads) <= 5


@pytest.mark.unit
@pytest.mark.crm
class TestGetMessageById:
    """Test suite for get_message_by_id function."""

    @patch('crm.crm_logger.get_client')
    def test_get_message_by_id_success(self, mock_get_client):
        """Test getting message by ID."""
        mock_client = Mock()
        mock_client.get.return_value = {
            'id': 456,
            'direction': 'inbound',
            'message': 'Test message',
            'created_at': '2024-01-15T10:00:00'
        }
        mock_get_client.return_value = mock_client

        message = get_message_by_id(
            tenant_id='tenant_001',
            message_id=456
        )

        assert message is not None
        assert message['id'] == 456
        assert message['message'] == 'Test message'

    @patch('crm.crm_logger.get_client')
    def test_get_message_by_id_not_found(self, mock_get_client):
        """Test getting non-existent message."""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_get_client.return_value = mock_client

        message = get_message_by_id(
            tenant_id='tenant_001',
            message_id=999
        )

        assert message is None


@pytest.mark.unit
@pytest.mark.crm
class TestCRMExceptions:
    """Test suite for CRM custom exceptions."""

    def test_crm_error(self):
        """Test CRMError exception."""
        error = CRMError("Test error")
        assert str(error) == "Test error"

    def test_crm_lead_not_found_error(self):
        """Test CRMLeadNotFoundError exception."""
        error = CRMLeadNotFoundError("Lead not found")
        assert "not found" in str(error).lower()

    def test_crm_message_error(self):
        """Test CRMMessageError exception."""
        error = CRMMessageError("Message error")
        assert str(error) == "Message error"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
