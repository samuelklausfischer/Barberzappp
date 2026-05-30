"""
Unit Tests for PostgreSQL Memory Wrapper

Tests for PostgresMemory wrapper integration.
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.postgres_memory import (
    PostgresMemory,
    get_memory,
    save_message as pg_save_message,
    get_chat_history as pg_get_chat_history,
    clear_chat_history as pg_clear_chat_history
)


@pytest.mark.unit
@pytest.mark.wrapper
class TestPostgresMemory:
    """Test suite for PostgresMemory class."""

    def test_initialization(self, monkeypatch):
        """Test PostgresMemory initialization."""
        # Set environment variables
        monkeypatch.setenv('POSTGRES_HOST', 'test-host')
        monkeypatch.setenv('POSTGRES_PORT', '5433')
        monkeypatch.setenv('POSTGRES_DB', 'test_db')
        monkeypatch.setenv('POSTGRES_USER', 'test_user')

        mem = PostgresMemory()

        assert mem.host == 'test-host'
        assert mem.port == 5433
        assert mem.database == 'test_db'
        assert mem.user == 'test_user'

    def test_initialization_defaults(self):
        """Test PostgresMemory with default values."""
        mem = PostgresMemory(
            host='localhost',
            port=5432,
            database='postgres',
            user='postgres',
            password='test'
        )

        assert mem.host == 'localhost'
        assert mem.port == 5432
        assert mem.database == 'postgres'
        assert mem.user == 'postgres'

    def test_get_session_key(self):
        """Test session key generation."""
        mem = PostgresMemory()

        session_key = mem._get_session_key('tenant_123', '5511999999999')

        assert session_key == 'tenant_123_5511999999999'

        session_key2 = mem._get_session_key('tenant_456', '5511988888888')
        assert session_key2 != session_key

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_save_message_success(self, mock_connect):
        """Test successful message save."""
        # Mock connection and cursor
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = 123

        mem = PostgresMemory()

        result = mem.save_message(
            tenant_id='tenant_123',
            phone='5511999999999',
            role='user',
            message='Test message',
            metadata={'test': True}
        )

        assert result['success'] is True
        assert result['id'] == 123
        assert result['session_key'] == 'tenant_123_5511999999999'
        assert mock_cursor.execute.called

        # Verify SQL
        call_args = mock_cursor.execute.call_args
        query = call_args[0][0]
        assert 'INSERT INTO chat_memoria_v4' in query
        assert 'tenant_id' in query
        assert 'phone' in query

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_save_message_without_metadata(self, mock_connect):
        """Test message save without metadata."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = 456

        mem = PostgresMemory()

        result = mem.save_message(
            tenant_id='tenant_123',
            phone='5511999999999',
            role='assistant',
            message='AI response'
        )

        assert result['success'] is True
        assert result['id'] == 456

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_save_message_error(self, mock_connect):
        """Test message save with error."""
        mock_connect.side_effect = Exception("Database error")

        mem = PostgresMemory()

        result = mem.save_message(
            tenant_id='tenant_123',
            phone='5511999999999',
            role='user',
            message='Test message'
        )

        assert result['success'] is False
        assert 'error' in result

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_save_message_rollback_on_error(self, mock_connect):
        """Test message save rollback on error."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Execute error")

        mem = PostgresMemory()

        result = mem.save_message(
            tenant_id='tenant_123',
            phone='5511999999999',
            role='user',
            message='Test message'
        )

        assert result['success'] is False
        # Verify rollback was called
        mock_conn.rollback.assert_called()

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_get_chat_history_success(self, mock_connect):
        """Test successful chat history retrieval."""
        # Mock cursor with RealDictCursor behavior
        from psycopg2.extras import RealDictCursor

        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Mock fetchall result
        datetime_obj = datetime(2024, 1, 15, 10, 30, 0)
        mock_cursor.fetchall.return_value = [
            {
                'id': 1,
                'session_key': 'tenant_123_5511999999999',
                'tenant_id': 'tenant_123',
                'phone': '5511999999999',
                'role': 'user',
                'message': 'Hello',
                'metadata': None,
                'created_at': datetime_obj
            },
            {
                'id': 2,
                'session_key': 'tenant_123_5511999999999',
                'tenant_id': 'tenant_123',
                'phone': '5511999999999',
                'role': 'assistant',
                'message': 'Hi there!',
                'metadata': {'model': 'gpt-3.5'},
                'created_at': datetime_obj
            }
        ]

        mem = PostgresMemory()

        result = mem.get_chat_history(
            tenant_id='tenant_123',
            phone='5511999999999',
            limit=40
        )

        assert result['success'] is True
        assert len(result['messages']) == 2
        assert result['count'] == 2
        assert result['messages'][0]['role'] == 'user'
        assert result['messages'][1]['role'] == 'assistant'
        # Verify datetime converted to string
        assert isinstance(result['messages'][0]['created_at'], str)

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_get_chat_history_empty(self, mock_connect):
        """Test chat history retrieval with no messages."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []

        mem = PostgresMemory()

        result = mem.get_chat_history(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert len(result['messages']) == 0
        assert result['count'] == 0

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_get_chat_history_with_limit(self, mock_connect):
        """Test chat history retrieval with limit."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []

        mem = PostgresMemory()

        result = mem.get_chat_history(
            tenant_id='tenant_123',
            phone='5511999999999',
            limit=10
        )

        assert result['success'] is True
        # Verify limit was passed to query
        call_args = mock_cursor.execute.call_args
        assert 'LIMIT' in str(call_args).upper() or '%s' in str(call_args)

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_clear_chat_history_success(self, mock_connect):
        """Test successful chat history clear."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = 5  # 5 messages deleted

        mem = PostgresMemory()

        result = mem.clear_chat_history(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert result['deleted_count'] == 5
        assert result['session_key'] == 'tenant_123_5511999999999'

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_clear_chat_history_empty(self, mock_connect):
        """Test clearing empty chat history."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = 0  # 0 messages

        mem = PostgresMemory()

        result = mem.clear_chat_history(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert result['deleted_count'] == 0

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_get_last_message_success(self, mock_connect):
        """Test getting last message."""
        datetime_obj = datetime(2024, 1, 15, 10, 30, 0)
        mock_conn = Mock()
        mock_cursor = Mock(spec=('cursor',))
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {
            'id': 10,
            'session_key': 'tenant_123_5511999999999',
            'tenant_id': 'tenant_123',
            'phone': '5511999999999',
            'role': 'user',
            'message': 'Last message',
            'metadata': None,
            'created_at': datetime_obj
        }

        mem = PostgresMemory()

        result = mem.get_last_message(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert result['message']['id'] == 10
        assert result['message']['message'] == 'Last message'
        # Verify query fetches only 1 record with DESC order
        call_args = mock_cursor.execute.call_args
        query = str(call_args)
        assert 'LIMIT' in query.upper() or '%s' in str(call_args)

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_get_last_message_not_found(self, mock_connect):
        """Test getting last message when no messages exist."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None

        mem = PostgresMemory()

        result = mem.get_last_message(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert result['message'] is None

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_count_messages(self, mock_connect):
        """Test counting messages."""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = [42]

        mem = PostgresMemory()

        result = mem.count_messages(
            tenant_id='tenant_123',
            phone='5511999999999'
        )

        assert result['success'] is True
        assert result['count'] == 42

    def test_context_manager(self):
        """Test PostgresMemory as context manager."""
        with patch('integrations.postgres_memory.psycopg2.connect') as mock_connect:
            mock_conn = Mock()
            mock_connect.return_value = mock_conn

            with PostgresMemory() as mem:
                assert mem is not None

            # Verify connection was closed on exit
            mock_conn.close.assert_called_once()

    @patch('integrations.postgres_memory.psycopg2.connect')
    def test_connection_reuse(self, mock_connect):
        """Test that connection is reused within the same instance."""
        mock_conn = Mock()
        mock_connect.return_value = mock_conn

        mem = PostgresMemory()

        # First call
        conn1 = mem._get_connection()
        # Second call
        conn2 = mem._get_connection()

        # Should return same connection object
        assert conn1 is conn2
        # Should connect only once
        assert mock_connect.call_count == 1


@pytest.mark.unit
@pytest.mark.wrapper
class TestPostgresMemoryConvenienceFunctions:
    """Test suite for convenience functions."""

    @patch('integrations.postgres_memory.get_memory')
    def test_get_memory_singleton(self, mock_get_memory):
        """Test get_memory returns singleton instance."""
        from integrations.postgres_memory import get_memory, PostgresMemory

        # Reset global instance
        import integrations.postgres_memory as pg_module
        pg_module._default_instance = None

        mock_instance = Mock(spec=PostgresMemory)
        mock_get_memory.return_value = mock_instance

        mem1 = get_memory()
        mem2 = get_memory()

        assert mem1 is mem2

    @patch('integrations.postgres_memory.get_memory')
    def test_pg_save_message(self, mock_get_memory):
        """Test pg_save_message convenience function."""
        mock_mem = Mock()
        mock_mem.save_message.return_value = {
            'success': True,
            'id': 123
        }
        mock_get_memory.return_value = mock_mem

        result = pg_save_message(
            tenant_id='tenant_123',
            phone='5511999999999',
            role='user',
            message='Test'
        )

        assert result['success'] is True
        mock_mem.save_message.assert_called_once()

    @patch('integrations.postgres_memory.get_memory')
    def test_pg_save_message_with_metadata(self, mock_get_memory):
        """Test pg_save_message with metadata."""
        mock_mem = Mock()
        mock_mem.save_message.return_value = {'success': True}
        mock_get_memory.return_value = mock_mem

        metadata = {'test': 'value'}
        pg_save_message('tenant_123', '5511999999999', 'user', 'Test', metadata)

        mock_mem.save_message.assert_called_once()
        call_args = mock_mem.save_message.call_args
        assert call_args[0][4] == metadata

    @patch('integrations.postgres_memory.get_memory')
    def test_pg_get_chat_history(self, mock_get_memory):
        """Test pg_get_chat_history convenience function."""
        mock_mem = Mock()
        mock_mem.get_chat_history.return_value = {
            'success': True,
            'messages': [],
            'count': 0
        }
        mock_get_memory.return_value = mock_mem

        result = pg_get_chat_history('tenant_123', '5511999999999')

        assert result == []
        mock_mem.get_chat_history.assert_called_once()

        # Test with custom limit
        pg_get_chat_history('tenant_123', '5511999999999', limit=10)
        assert mock_mem.get_chat_history.call_count == 2

    @patch('integrations.postgres_memory.get_memory')
    def test_pg_get_chat_history_error(self, mock_get_memory):
        """Test pg_get_chat_history on error."""
        mock_mem = Mock()
        mock_mem.get_chat_history.return_value = {
            'success': False,
            'messages': []
        }
        mock_get_memory.return_value = mock_mem

        result = pg_get_chat_history('tenant_123', '5511999999999')

        assert result == []

    @patch('integrations.postgres_memory.get_memory')
    def test_pg_clear_chat_history(self, mock_get_memory):
        """Test pg_clear_chat_history convenience function."""
        mock_mem = Mock()
        mock_mem.clear_chat_history.return_value = {
            'success': True,
            'deleted_count': 5
        }
        mock_get_memory.return_value = mock_mem

        result = pg_clear_chat_history('tenant_123', '5511999999999')

        assert result['success'] is True
        assert result['deleted_count'] == 5
        mock_mem.clear_chat_history.assert_called_once()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
