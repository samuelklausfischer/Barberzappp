"""
Mock Evolution API for Testing

Provides mock implementations for testing Evolution API wrapper
without requiring the actual API or Docker Hub availability.
"""

from typing import Dict, List, Optional, Any
import logging
from unittest.mock import Mock, MagicMock
from datetime import datetime

logger = logging.getLogger(__name__)


class MockEvolutionAPI:
    """
    Mock implementation of Evolution API for testing.

    Simulates all Evolution API operations without external dependencies.
    """

    def __init__(self):
        """Initialize mock Evolution API with empty state."""
        self.instances: Dict[str, Dict] = {}
        self.messages: List[Dict] = []
        self._message_counter = 0
        self._instance_counter = 0

    def reset(self):
        """Reset all mock state."""
        self.instances.clear()
        self.messages.clear()
        self._message_counter = 0
        self._instance_counter = 0

    def send_message(
        self,
        instance_name: str,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Mock send_message operation.

        Returns simulated successful response.
        """
        self._message_counter += 1
        message_id = f"mock_msg_{self._message_counter}"

        # Store message for verification
        self.messages.append({
            'id': message_id,
            'instance_name': instance_name,
            'phone': phone,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        })

        logger.debug(f"[MOCK] EvolutionAPI.send_message: {message_id}")

        return {
            "success": True,
            "message_id": message_id,
            "instance": instance_name,
            "remoteJid": f"{phone}@s.whatsapp.net",
            "error": None
        }

    def send_message_failure(
        self,
        instance_name: str,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Mock send_message operation that fails.

        Returns simulated error response.
        """
        self._message_counter += 1
        message_id = f"mock_msg_{self._message_counter}"

        logger.debug(f"[MOCK] EvolutionAPI.send_message_failure: {message_id}")

        return {
            "success": False,
            "message_id": None,
            "error": "Simulated Evolution API error",
            "error_code": "SEND_FAILED"
        }

    def create_instance(
        self,
        instance_name: str = None,
        qrcode: bool = True
    ) -> Dict[str, Any]:
        """
        Mock create_instance operation.

        Returns simulated successful instance creation.
        """
        if instance_name is None:
            self._instance_counter += 1
            instance_name = f"barberzap_mock_{self._instance_counter}"

        # Store instance
        self.instances[instance_name] = {
            "name": instance_name,
            "status": "created",
            "qrcode": f"mock_qrcode_{instance_name}",
            "token": f"mock_token_{instance_name}",
            "created_at": datetime.utcnow().isoformat()
        }

        logger.debug(f"[MOCK] EvolutionAPI.create_instance: {instance_name}")

        return {
            "success": True,
            "instance_name": instance_name,
            "instance_token": f"mock_token_{instance_name}",
            "qrcode": f"mock_qrcode_{instance_name}" if qrcode else None,
            "error": None
        }

    def check_status(self, instance_name: str) -> Dict[str, Any]:
        """
        Mock check_status operation.

        Returns simulated status check result.
        """
        instance = self.instances.get(instance_name)

        if instance:
            logger.debug(f"[MOCK] EvolutionAPI.check_status: {instance_name} -> {instance['status']}")
            return {
                "success": True,
                "instance_name": instance_name,
                "status": instance['status'],
                "phone_number": instance.get('phone_number'),
                "error": None
            }
        else:
            logger.debug(f"[MOCK] EvolutionAPI.check_status: {instance_name} -> not_found")
            return {
                "success": False,
                "instance_name": instance_name,
                "status": "not_found",
                "phone_number": None,
                "error": f"Instance '{instance_name}' not found"
            }

    def delete_instance(self, instance_name: str) -> Dict[str, Any]:
        """
        Mock delete_instance operation.

        Returns simulated deletion result.
        """
        if instance_name in self.instances:
            del self.instances[instance_name]
            logger.debug(f"[MOCK] EvolutionAPI.delete_instance: {instance_name}")
            return {
                "success": True,
                "message": f"Instance '{instance_name}' deleted successfully",
                "error": None
            }
        else:
            logger.debug(f"[MOCK] EvolutionAPI.delete_instance: {instance_name} -> not_found")
            return {
                "success": False,
                "message": f"Instance '{instance_name}' not found",
                "error": "Instance does not exist"
            }

    def get_qrcode(self, instance_name: str) -> Dict[str, Any]:
        """
        Mock get_qrcode operation.

        Returns simulated QR code.
        """
        instance = self.instances.get(instance_name)

        if instance:
            logger.debug(f"[MOCK] EvolutionAPI.get_qrcode: {instance_name}")
            return {
                "success": True,
                "qrcode": instance.get('qrcode', f"mock_qrcode_{instance_name}"),
                "base64": None,
                "error": None
            }
        else:
            logger.debug(f"[MOCK] EvolutionAPI.get_qrcode: {instance_name} -> not_found")
            return {
                "success": False,
                "qrcode": None,
                "base64": None,
                "error": f"Instance '{instance_name}' not found"
            }

    def get_all_instances(self) -> List[Dict[str, Any]]:
        """
        Get all created mock instances.

        Returns:
            List of instance data
        """
        return list(self.instances.values())

    def get_all_messages(self) -> List[Dict[str, Any]]:
        """
        Get all sent mock messages.

        Returns:
            List of message data
        """
        return self.messages.copy()

    def get_messages_by_instance(self, instance_name: str) -> List[Dict[str, Any]]:
        """
        Get messages for a specific instance.

        Args:
            instance_name: Instance name to filter

        Returns:
            List of messages for the instance
        """
        return [
            msg for msg in self.messages
            if msg['instance_name'] == instance_name
        ]

    def get_messages_by_phone(self, phone: str) -> List[Dict[str, Any]]:
        """
        Get messages for a specific phone.

        Args:
            phone: Phone number to filter

        Returns:
            List of messages for the phone
        """
        return [
            msg for msg in self.messages
            if msg['phone'] == phone
        ]

    def set_instance_status(self, instance_name: str, status: str, phone_number: str = None):
        """
        Set the status of a mock instance.

        Args:
            instance_name: Instance name
            status: New status (e.g., 'connected', 'disconnected', 'pending')
            phone_number: Optional phone number
        """
        if instance_name in self.instances:
            instance = self.instances[instance_name]
            instance['status'] = status
            if phone_number:
                instance['phone_number'] = phone_number

    def assert_message_sent(
        self,
        instance_name: str,
        phone: str,
        message: str,
        partial_match: bool = False
    ):
        """
        Assert that a message was sent.

        Args:
            instance_name: Expected instance name
            phone: Expected phone number
            message: Expected message content
            partial_match: If True, checks if message contains the string

        Raises:
            AssertionError: If message was not sent
        """
        for msg in self.get_messages_by_instance(instance_name):
            if msg['phone'] == phone:
                if partial_match:
                    if message in msg['message']:
                        return True
                else:
                    if msg['message'] == message:
                        return True

        raise AssertionError(
            f"Message not found: instance={instance_name}, phone={phone}, message={message}"
        )


# Global mock instance
_mock_instance: Optional[MockEvolutionAPI] = None


def get_mock_evolution_api() -> MockEvolutionAPI:
    """
    Get or create the global mock Evolution API instance.

    Returns:
        MockEvolutionAPI instance
    """
    global _mock_instance
    if _mock_instance is None:
        _mock_instance = MockEvolutionAPI()
    return _mock_instance


def reset_mock_evolution_api():
    """Reset the global mock Evolution API instance."""
    global _mock_instance
    if _mock_instance:
        _mock_instance.reset()


# Pytest fixtures


def create_evolution_api_mock():
    """
    Create a pytest mock for Evolution API module.

    Returns:
        Mock that simulates the evolution_api module
    """
    mock_api = MockEvolutionAPI()

    # Create mock module
    mock_module = MagicMock()
    mock_module.EvolutionAPI = Mock(return_value=mock_api)
    mock_module.evolution_api = mock_api

    # Mock functions
    mock_module.send_message = mock_api.send_message
    mock_module.create_instance = mock_api.create_instance
    mock_module.check_status = mock_api.check_status
    mock_module.get_qrcode = mock_api.get_qrcode

    return mock_module


def create_evolution_api_mock_with_failures():
    """
    Create a pytest mock for Evolution API that failures on send_message.

    Returns:
        Mock that simulates failures
    """
    mock_api = MockEvolutionAPI()

    # Override send_message to fail
    original_send = mock_api.send_message
    mock_api.send_message = mock_api.send_message_failure

    # Create mock module
    mock_module = MagicMock()
    mock_module.EvolutionAPI = Mock(return_value=mock_api)
    mock_module.evolution_api = mock_api
    mock_module.send_message = mock_api.send_message_failure
    mock_module.create_instance = mock_api.create_instance
    mock_module.check_status = mock_api.check_status

    return mock_module


if __name__ == "__main__":
    # Test the mock
    print("Testing Mock Evolution API")
    print("=" * 60)

    mock_api = MockEvolutionAPI()

    # Create instance
    result = mock_api.create_instance("test_instance")
    print(f"Create instance: {result}")

    # Check status
    result = mock_api.check_status("test_instance")
    print(f"Check status: {result}")

    # Set status
    mock_api.set_instance_status("test_instance", "connected", "5511999999999")

    # Send message
    result = mock_api.send_message("test_instance", "5511999999999", "Test message")
    print(f"Send message: {result}")

    # Verify message
    mock_api.assert_message_sent("test_instance", "5511999999999", "Test message")
    print("Message assertion passed!")

    # Get messages
    messages = mock_api.get_all_messages()
    print(f"Total messages: {len(messages)}")

    print("\nMock Evolution API working correctly!")
