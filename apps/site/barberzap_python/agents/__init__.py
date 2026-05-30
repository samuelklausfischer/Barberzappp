"""
Agents - Specialized AI agents for BarberZap

Available agents:
- secretaria_universal: Universal Secretary AI Agent with chat memory (40 messages)
"""

from .secretaria_universal import (
    generate_response,
    generate_response_simple,
    get_conversation_summary,
    clear_conversation,
    SystemPromptTemplates
)

__all__ = [
    'generate_response',
    'generate_response_simple',
    'get_conversation_summary',
    'clear_conversation',
    'SystemPromptTemplates'
]
