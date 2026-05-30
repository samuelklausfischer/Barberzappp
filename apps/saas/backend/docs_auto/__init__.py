"""
API Documentation Generator for BarberZap
Auto-generate comprehensive API documentation from FastAPI
"""

from .api_parser import APIParser
from .openapi_generator import OpenAPIGenerator
from .redoc_ui import ReDocUI, ReDocWithThemeToggle, generate_redoc_docs
from .swagger_ui import SwaggerUI, SwaggerUIWithAuth, generate_swagger_docs
from .postman_collection_generator import PostmanCollectionGenerator, generate_environment_file, save_environment_file
from .typescript_fetch_generator import TypeScriptClientGenerator, generate_typescript_api_client, generate_typescript_interfaces
from .docs_builder import DocsBuilder, WatchDocsBuilder, create_startup_event
from .version_manager import VersionManager

__version__ = "1.0.0"
__all__ = [
    "APIParser",
    "OpenAPIGenerator",
    "ReDocUI",
    "ReDocWithThemeToggle",
    "generate_redoc_docs",
    "SwaggerUI",
    "SwaggerUIWithAuth",
    "generate_swagger_docs",
    "PostmanCollectionGenerator",
    "generate_environment_file",
    "save_environment_file",
    "TypeScriptClientGenerator",
    "generate_typescript_api_client",
    "generate_typescript_interfaces",
    "DocsBuilder",
    "WatchDocsBuilder",
    "create_startup_event",
    "VersionManager",
]
