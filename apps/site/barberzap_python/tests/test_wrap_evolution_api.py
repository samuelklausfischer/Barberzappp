"""
Unit Tests for Evolution API Placeholder Wrapper

Tests for EvolutionAPI placeholder integration.
"""

import pytest
import os
import sys
from unittest.mock import patch

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.evolution_api import (
    EvolutionAPI,
    send_message as evolution_send_message,
    create_instance as evolution_create_instance,
    check_status as evolution_check_status
)


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestEvolutionAPI:
    """Test suite for EvolutionAPI placeholder."""

    def test_initialization_default(self):
        """Test default initialization."""
        api = EvolutionAPI()

        assert api.base_url == "http://localhost:8080"
        assert api.api_key is None
        assert api._instance_counter == 0
        assert api.instances == {}

    def test_initialization_with_params(self):
        """Test initialization with parameters."""
        api = EvolutionAPI(
            base_url="http://custom-host:9090",
            api_key="test_key_123"
        )

        assert api.base_url == "http://custom-host:9090"
        assert api.api_key == "test_key_123"

    def test_send_message_success(self, caplog):
        """Test send_message placeholder returns success."""
        import logging
        caplog.set_level(logging.INFO)

        api = EvolutionAPI()

        result = api.send_message(
            instance_name="test_instance",
            phone="5511999999999@s.whatsapp.net",
            message="Test message"
        )

        assert result['success'] is True
        assert 'message_id' in result
        assert 'placeholder_msg_test_instance' in result['message_id']
        assert result['error'] is None

        # Verify log contains placeholder message
        assert 'PLACEHOLDER' in caplog.text or 'placeholder' in caplog.text.lower()

    def test_send_message_content_length(self, caplog):
        """Test send_message truncates long messages in log."""
        import logging
        caplog.set_level(logging.INFO)

        api = EvolutionAPI()

        long_message = "A" * 100
        result = api.send_message(
            instance_name="test_instance",
            phone="5511999999999@s.whatsapp.net",
            message=long_message
        )

        assert result['success'] is True
        # Log should contain "...", indicating truncation
        assert "..." in caplog.text

    def test_create_instance_default_name(self):
        """Test create_instance generates name if not provided."""
        api = EvolutionAPI()

        result = api.create_instance()

        assert result['success'] is True
        assert 'instance_name' in result
        assert 'barberzap_instance_' in result['instance_name']
        assert 'instance_token' in result
        assert 'qrcode' in result

    def test_create_instance_with_name(self):
        """Test create_instance with provided name."""
        api = EvolutionAPI()

        result = api.create_instance(
            instance_name="my_custom_instance",
            qrcode=True
        )

        assert result['success'] is True
        assert result['instance_name'] == "my_custom_instance"
        assert result['qrcode'] == "placeholder_qrcode_my_custom_instance"

    def test_create_instance_without_qrcode(self):
        """Test create_instance without QR code."""
        api = EvolutionAPI()

        result = api.create_instance(
            instance_name="test_instance",
            qrcode=False
        )

        assert result['success'] is True
        assert result['qrcode'] is None

    def test_create_instance_counter(self):
        """Test create_instance increments counter."""
        api = EvolutionAPI()

        result1 = api.create_instance()
        result2 = api.create_instance()

        # Instance names should be different
        assert result1['instance_name'] != result2['instance_name']

        # Verify instance was stored
        assert result1['instance_name'] in api.instances
        assert result2['instance_name'] in api.instances

    def test_check_status_existing(self):
        """Test check_status with existing instance."""
        api = EvolutionAPI()

        # Create instance first
        api.create_instance("test_instance")

        # Set status
        api.instances["test_instance"]["status"] = "connected"
        api.instances["test_instance"]["phone_number"] = "5511999999999"

        # Check status
        result = api.check_status("test_instance")

        assert result['success'] is True
        assert result['instance_name'] == "test_instance"
        assert result['status'] == "connected"
        assert result['phone_number'] == "5511999999999"
        assert result['error'] is None

    def test_check_status_not_found(self):
        """Test check_status with non-existent instance."""
        api = EvolutionAPI()

        result = api.check_status("nonexistent_instance")

        assert result['success'] is False
        assert result['status'] == "not_found"
        assert result['phone_number'] is None
        assert 'not found' in result['error'].lower()

    def test_delete_instance_existing(self):
        """Test delete_instance with existing instance."""
        api = EvolutionAPI()

        # Create instance first
        api.create_instance("test_instance")

        # Verify it exists
        assert "test_instance" in api.instances

        # Delete it
        result = api.delete_instance("test_instance")

        assert result['success'] is True
        assert 'deleted successfully' in result['message'].lower()
        assert result['error'] is None

        # Verify it was removed
        assert "test_instance" not in api.instances

    def test_delete_instance_not_found(self):
        """Test delete_instance with non-existent instance."""
        api = EvolutionAPI()

        result = api.delete_instance("nonexistent_instance")

        assert result['success'] is False
        assert 'not found' in result['message'].lower()
        assert result['error'] is not None

    def test_get_qrcode_existing(self):
        """Test get_qrcode with existing instance."""
        api = EvolutionAPI()

        # Create instance first
        api.create_instance("test_instance")

        result = api.get_qrcode("test_instance")

        assert result['success'] is True
        assert result['qrcode'] == "placeholder_qrcode_test_instance"
        assert result['base64'] is None
        assert result['error'] is None

    def test_get_qrcode_not_found(self):
        """Test get_qrcode with non-existent instance."""
        api = EvolutionAPI()

        result = api.get_qrcode("nonexistent_instance")

        assert result['success'] is False
        assert result['qrcode'] is None
        assert result['base64'] is None
        assert 'not found' in result['error'].lower()

    def test_multiple_instances_tracking(self):
        """Test multiple instances are tracked correctly."""
        api = EvolutionAPI()

        # Create multiple instances
        api.create_instance("instance_1")
        api.create_instance("instance_2")
        api.create_instance("instance_3")

        # Set different statuses
        api.instances["instance_1"]["status"] = "connected"
        api.instances["instance_2"]["status"] = "pending"
        api.instances["instance_3"]["status"] = "disconnected"

        # Verify all are tracked
        assert len(api.instances) == 3
        assert "instance_1" in api.instances
        assert "instance_2" in api.instances
        assert "instance_3" in api.instances

        # Check each status
        status1 = api.check_status("instance_1")
        status2 = api.check_status("instance_2")
        status3 = api.check_status("instance_3")

        assert status1['status'] == "connected"
        assert status2['status'] == "pending"
        assert status3['status'] == "disconnected"


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestEvolutionAPIConvenienceFunctions:
    """Test suite for ease-of-use functions."""

    def test_evolution_send_message(self):
        """Test convenience function send_message."""
        result = evolution_send_message(
            instance_name="test_instance",
            phone="5511999999999@s.whatsapp.net",
            message="Test via convenience function"
        )

        assert result['success'] is True
        assert 'message_id' in result

    def test_evolution_create_instance(self):
        """Test convenience function create_instance."""
        result = evolution_create_instance("convenience_instance")

        assert result['success'] is True
        assert result['instance_name'] == "convenience_instance"

    def test_evolution_create_instance_auto_name(self):
        """Test convenience function create_instance without name."""
        result = evolution_create_instance()

        assert result['success'] is True
        assert 'instance_name' in result
        assert 'barberzap_instance_' in result['instance_name']

    def test_evolution_check_status(self):
        """Test convenience function check_status."""
        # Create instance first
        evolution_create_instance("check_test")

        result = evolution_check_status("check_test")

        assert result['success'] is True
        assert result['instance_name'] == "check_test"


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestEvolutionAPIMocking:
    """Test suite demonstrating how to mock Evolution API."""

    def test_mock_evolution_api_basic(self):
        """Test basic mocking of Evolution API."""
        from unittest.mock import MagicMock, Mock

        # Create mock instance
        mock_api = Mock()
        mock_api.send_message.return_value = {
            "success": True,
            "message_id": "mock_msg_123"
        }
        mock_api.create_instance.return_value = {
            "success": True,
            "instance_name": "mock_instance"
        }

        # Use mock
        result = mock_api.send_message("instance", "phone", "message")

        assert result['success'] is True
        assert result['message_id'] == "mock_msg_123"

    def test_mock_evolution_api_failure_scenario(self):
        """Test mocking failure scenario."""
        from unittest.mock import Mock

        mock_api = Mock()
        mock_api.send_message.return_value = {
            "success": False,
            "message_id": None,
            "error": "Simulated API failure"
        }

        result = mock_api.send_message("instance", "phone", "message")

        assert result['success'] is False
        assert result['error'] == "Simulated API failure"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
