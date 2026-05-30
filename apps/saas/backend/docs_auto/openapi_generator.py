"""
OpenAPI Generator - Generate OpenAPI 3.1 compliant specifications
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from pathlib import Path
import hashlib


class OpenAPIGenerator:
    """Generate OpenAPI 3.1 specifications from parsed API data"""
    
    DEFAULT_CONFIG = {
        "openapi": "3.1.0",
        "info": {
            "title": "BarberZap API",
            "version": "1.0.0",
            "description": "BarberZap API - Complete barber shop management system",
            "contact": {
                "name": "BarberZap Team",
                "email": "api@barberzap.com"
            },
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "servers": [
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            },
            {
                "url": "https://staging.barberzap.com/api",
                "description": "Staging server"
            },
            {
                "url": "https://api.barberzap.com",
                "description": "Production server"
            }
        ],
        "externalDocs": {
            "description": "BarberZap Documentation",
            "url": "https://docs.barberzap.com"
        },
        "components": {
            "securitySchemes": {
                "ApiKeyAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-API-Key"
                },
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "security": [
            {
                "BearerAuth": []
            }
        ],
        "tags": []
    }
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        self.spec = None
        
    def generate_openapi_spec(self, api_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate complete OpenAPI specification from parsed API data
        
        Args:
            api_data: Parsed API data from APIParser
            
        Returns:
            Complete OpenAPI 3.1 specification
        """
        spec = self.config.copy()
        
        # Add paths
        spec["paths"] = self._generate_paths(api_data.get("endpoints", []))
        
        # Add components/schemas
        spec["components"]["schemas"] = api_data.get("schemas", {})
        
        # Add tags with descriptions
        spec["tags"] = self._generate_tags(api_data.get("tags", {}))
        
        self.spec = spec
        return spec
    
    def _generate_paths(self, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate OpenAPI paths from endpoints"""
        paths = {}
        
        for endpoint in endpoints:
            path = endpoint["path"]
            
            if path not in paths:
                paths[path] = {}
            
            for method in endpoint["methods"]:
                method_lower = method.lower()
                
                operation = {
                    "operationId": endpoint["operation_id"],
                    "summary": endpoint.get("summary", ""),
                    "description": endpoint.get("description", ""),
                    "tags": endpoint.get("tags", ["default"]),
                    "parameters": endpoint.get("parameters", []),
                    "responses": endpoint.get("responses", {})
                }
                
                # Add request body if present
                if endpoint.get("request_body"):
                    operation["requestBody"] = endpoint["request_body"]
                
                # Add deprecated flag
                if endpoint.get("deprecated"):
                    operation["deprecated"] = True
                
                # Add examples if present
                if endpoint.get("examples"):
                    operation["x-examples"] = endpoint["examples"]
                
                paths[path][method_lower] = operation
        
        return paths
    
    def _generate_tags(self, tags_dict: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, str]]:
        """Generate OpenAPI tags with descriptions"""
        tags = []
        
        tag_descriptions = {
            "auth": "Authentication and authorization endpoints",
            "users": "User management endpoints",
            "clients": "Client management endpoints",
            "barbers": "Barber management endpoints",
            "shops": "Barber shop management endpoints",
            "appointments": "Appointment scheduling and management",
            "services": "Service catalog and pricing",
            "calendar": "Calendar integration endpoints",
            "notifications": "Notification management",
            "reports": "Reporting and analytics",
            "webhooks": "Webhook configuration and management",
            "settings": "System settings and configuration",
            "cache": "Cache management endpoints",
            "metrics": "Performance metrics endpoints",
            "themes": "UI theme management",
            "archival": "Data archival endpoints",
            "default": "General API endpoints"
        }
        
        for tag_name in sorted(tags_dict.keys()):
            tags.append({
                "name": tag_name,
                "description": tag_descriptions.get(tag_name, f"{tag_name.capitalize()} endpoints")
            })
        
        return tags
    
    def save_openapi_spec(self, file_path: str, spec: Optional[Dict[str, Any]] = None) -> None:
        """
        Save OpenAPI specification to file
        
        Args:
            file_path: Path to save the specification
            spec: Specification to save (uses self.spec if not provided)
        """
        spec_to_save = spec or self.spec
        
        if not spec_to_save:
            raise ValueError("No specification to save. Call generate_openapi_spec() first.")
        
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(spec_to_save, f, indent=2, ensure_ascii=False)
    
    def save_openapi_yaml(self, file_path: str, spec: Optional[Dict[str, Any]] = None) -> None:
        """
        Save OpenAPI specification to YAML file
        
        Args:
            file_path: Path to save the YAML specification
            spec: Specification to save (uses self.spec if not provided)
        """
        try:
            import yaml
        except ImportError:
            raise ImportError("PyYAML is required to save YAML files. Install with: pip install pyyaml")
        
        spec_to_save = spec or self.spec
        
        if not spec_to_save:
            raise ValueError("No specification to save. Call generate_openapi_spec() first.")
        
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            yaml.dump(spec_to_save, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    def validate_openapi_spec(self, spec: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Validate OpenAPI specification
        
        Args:
            spec: Specification to validate (uses self.spec if not provided)
            
        Returns:
            Validation result with errors and warnings
        """
        spec_to_validate = spec or self.spec
        
        if not spec_to_validate:
            return {
                "valid": False,
                "errors": ["No specification to validate"],
                "warnings": []
            }
        
        errors = []
        warnings = []
        
        # Check required fields
        required_fields = ["openapi", "info", "paths"]
        for field in required_fields:
            if field not in spec_to_validate:
                errors.append(f"Missing required field: {field}")
        
        # Check version
        if "openapi" in spec_to_validate:
            version = spec_to_validate["openapi"]
            if not version.startswith("3."):
                errors.append(f"Unsupported OpenAPI version: {version}")
        
        # Check info fields
        if "info" in spec_to_validate:
            info_required = ["title", "version"]
            for field in info_required:
                if field not in spec_to_validate["info"]:
                    errors.append(f"Missing required info field: {field}")
        
        # Check paths
        if "paths" in spec_to_validate:
            if not spec_to_validate["paths"]:
                warnings.append("No paths defined in specification")
            
            for path, path_item in spec_to_validate["paths"].items():
                if not path.startswith('/'):
                    errors.append(f"Path must start with '/': {path}")
                
                for method, operation in path_item.items():
                    if method not in ["get", "post", "put", "patch", "delete", "options", "head", "trace"]:
                        errors.append(f"Invalid HTTP method: {method}")
                    
                    if "operationId" not in operation:
                        warnings.append(f"Operation {method} {path} missing operationId")
        
        # Check components
        if "components" in spec_to_validate:
            for component_type, components in spec_to_validate["components"].items():
                if not components:
                    warnings.append(f"Empty component: {component_type}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def merge_schemas(self, spec1: Dict[str, Any], spec2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge two OpenAPI specifications
        
        Args:
            spec1: First specification
            spec2: Second specification (takes precedence)
            
        Returns:
            Merged specification
        """
        merged = spec1.copy()
        
        # Merge paths
        if "paths" in spec2:
            if "paths" not in merged:
                merged["paths"] = {}
            merged["paths"] = {**merged["paths"], **spec2["paths"]}
        
        # Merge components
        if "components" in spec2:
            if "components" not in merged:
                merged["components"] = {}
            for component_type, components in spec2["components"].items():
                if component_type not in merged["components"]:
                    merged["components"][component_type] = {}
                merged["components"][component_type] = {
                    **merged["components"].get(component_type, {}),
                    **components
                }
        
        # Merge tags
        if "tags" in spec2:
            if "tags" not in merged:
                merged["tags"] = []
            existing_tag_names = {tag["name"] for tag in merged["tags"]}
            for tag in spec2["tags"]:
                if tag["name"] not in existing_tag_names:
                    merged["tags"].append(tag)
        
        # Override info from spec2
        if "info" in spec2:
            merged["info"] = {**merged.get("info", {}), **spec2["info"]}
        
        # Override servers from spec2
        if "servers" in spec2:
            merged["servers"] = spec2["servers"]
        
        return merged
    
    def get_spec_hash(self, spec: Optional[Dict[str, Any]] = None) -> str:
        """
        Get hash of specification for version tracking
        
        Args:
            spec: Specification to hash (uses self.spec if not provided)
            
        Returns:
            SHA256 hash of the specification
        """
        spec_to_hash = spec or self.spec
        
        if not spec_to_hash:
            raise ValueError("No specification to hash")
        
        spec_json = json.dumps(spec_to_hash, sort_keys=True)
        return hashlib.sha256(spec_json.encode()).hexdigest()
    
    def get_endpoint_count(self, spec: Optional[Dict[str, Any]] = None) -> int:
        """Get total number of endpoints in specification"""
        spec_to_count = spec or self.spec
        
        if not spec_to_count or "paths" not in spec_to_count:
            return 0
        
        count = 0
        for path_item in spec_to_count["paths"].values():
            count += len(path_item)
        
        return count
    
    def get_tag_summary(self, spec: Optional[Dict[str, Any]] = None) -> Dict[str, int]:
        """Get summary of endpoints by tag"""
        spec_to_summarize = spec or self.spec
        
        if not spec_to_summarize or "paths" not in spec_to_summarize:
            return {}
        
        tag_counts = {}
        
        for path_item in spec_to_summarize["paths"].values():
            for operation in path_item.values():
                for tag in operation.get("tags", ["default"]):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return tag_counts
    
    def add_server(self, url: str, description: str = "") -> None:
        """Add a server to the specification"""
        if "servers" not in self.config:
            self.config["servers"] = []
        
        server = {"url": url}
        if description:
            server["description"] = description
        
        self.config["servers"].append(server)
    
    def set_version(self, version: str) -> None:
        """Set API version"""
        if "info" not in self.config:
            self.config["info"] = {}
        self.config["info"]["version"] = version
    
    def set_title(self, title: str) -> None:
        """Set API title"""
        if "info" not in self.config:
            self.config["info"] = {}
        self.config["info"]["title"] = title
    
    def add_tag(self, name: str, description: str = "") -> None:
        """Add a tag to the specification"""
        if "tags" not in self.config:
            self.config["tags"] = []
        
        self.config["tags"].append({"name": name, "description": description})
    
    def export_to_dict(self) -> Dict[str, Any]:
        """Export specification as dictionary"""
        return self.spec.copy() if self.spec else {}
    
    def export_to_json(self) -> str:
        """Export specification as JSON string"""
        return json.dumps(self.spec, indent=2) if self.spec else "{}"
