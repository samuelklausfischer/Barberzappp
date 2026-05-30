"""
Postman Collection Generator - Generate Postman collections from OpenAPI specs
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import uuid as uuid_lib


class PostmanCollectionGenerator:
    """Generate Postman collections from OpenAPI specifications"""
    
    def __init__(self, collection_name: str = "BarberZap API"):
        """
        Initialize Postman collection generator
        
        Args:
            collection_name: Name of the Postman collection
        """
        self.collection_name = collection_name
    
    def generate_postman_collection(
        self,
        openapi_spec: Dict[str, Any],
        base_url: str = "https://api.barberzap.com"
    ) -> Dict[str, Any]:
        """
        Generate Postman collection from OpenAPI specification
        
        Args:
            openapi_spec: OpenAPI specification
            base_url: Base URL for the API
            
        Returns:
            Complete Postman collection
        """
        info = openapi_spec.get("info", {})
        paths = openapi_spec.get("paths", {})
        components = openapi_spec.get("components", {})
        servers = openapi_spec.get("servers", [])
        
        # Determine base URL from servers or use provided
        if servers:
            base_url = servers[0].get("url", base_url)
        
        collection = {
            "info": {
                "name": self.collection_name,
                "description": info.get("description", f"{info.get('title', 'API')} Collection"),
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                "_postman_id": str(uuid_lib.uuid4()),
                "version": {
                    "major": 1,
                    "minor": 0,
                    "patch": 0
                }
            },
            "variable": [
                {
                    "key": "baseUrl",
                    "value": base_url,
                    "type": "string"
                },
                {
                    "key": "apiVersion",
                    "value": info.get("version", "v1"),
                    "type": "string"
                }
            ],
            "auth": {
                "type": "bearer",
                "bearer": [
                    {
                        "key": "token",
                        "value": "{{jwt_token}}",
                        "type": "string"
                    }
                ]
            },
            "event": [
                {
                    "listen": "prerequest",
                    "script": {
                        "type": "text/javascript",
                        "exec": self._get_pre_request_script()
                    }
                },
                {
                    "listen": "test",
                    "script": {
                        "type": "text/javascript",
                        "exec": self._get_test_script()
                    }
                }
            ],
            "item": self._generate_folders(paths, components)
        }
        
        return collection
    
    def _generate_folders(self, paths: Dict[str, Any], components: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate folder structure organized by tags"""
        folders = {}
        
        for path, path_item in paths.items():
            for method, operation in path_item.items():
                tags = operation.get("tags", ["default"])
                tag = tags[0] if tags else "default"
                
                if tag not in folders:
                    folders[tag] = {
                        "name": self._format_tag_name(tag),
                        "description": f"{tag.capitalize()} endpoints",
                        "item": []
                    }
                
                request = self._generate_request(path, method, operation, components)
                folders[tag]["item"].append(request)
        
        # Convert to list and sort
        return [folders[key] for key in sorted(folders.keys())]
    
    def _format_tag_name(self, tag: str) -> str:
        """Format tag name for display"""
        tag_names = {
            "auth": "Authentication",
            "users": "Users",
            "clients": "Clients",
            "barbers": "Barbers",
            "shops": "Shops",
            "appointments": "Appointments",
            "services": "Services",
            "calendar": "Calendar",
            "notifications": "Notifications",
            "reports": "Reports",
            "webhooks": "Webhooks",
            "settings": "Settings",
            "cache": "Cache",
            "metrics": "Metrics",
            "themes": "Themes",
            "archival": "Archival",
            "default": "General"
        }
        
        return tag_names.get(tag, tag.capitalize())
    
    def _generate_request(self, path: str, method: str, operation: Dict[str, Any], components: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a Postman request from an OpenAPI operation"""
        summary = operation.get("summary", operation.get("operation_id", f"{method} {path}"))
        description = operation.get("description", "")
        
        # Get parameters
        params = operation.get("parameters", [])
        query_params = []
        path_params = []
        headers = []
        
        for param in params:
            param_obj = {
                "key": param["name"],
                "description": param.get("description", ""),
                "disabled": not param.get("required", False)
            }
            
            if param["in"] == "query":
                param_obj["value"] = "{{" + param["name"] + "}}"
                query_params.append(param_obj)
            elif param["in"] == "path":
                param_obj["value"] = ":" + param["name"]
                path_params.append(param_obj)
            elif param["in"] == "header":
                headers.append(param_obj)
        
        # Get request body
        body = None
        if "requestBody" in operation:
            body = self._generate_request_body(operation["requestBody"], components)
        
        # Generate request
        request = {
            "name": summary,
            "description": {
                "content": description,
                "type": "text/plain"
            },
            "request": {
                "method": method.upper(),
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    },
                    # API key header
                    {
                        "key": "X-API-Key",
                        "value": "{{api_key}}",
                        "description": "API Key for authentication"
                    }
                ],
                "url": {
                    "raw": "{{baseUrl}}" + path,
                    "host": ["{{baseUrl}}"],
                    "path": self._split_path(path),
                    "variable": path_params
                },
                "description": description
            },
            "response": self._generate_responses(operation.get("responses", {}), components)
        }
        
        # Add query parameters
        if query_params:
            request["request"]["url"]["query"] = query_params
        
        # Add request body
        if body:
            request["request"]["body"] = body
        
        # Add additional headers
        if headers:
            request["request"]["header"].extend(headers)
        
        return request
    
    def _generate_request_body(self, request_body: Dict[str, Any], components: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Postman request body from OpenAPI requestBody"""
        content = request_body.get("content", {})
        json_content = content.get("application/json", {})
        schema = json_content.get("schema", {})
        
        # Generate example from schema
        example = self._generate_example_from_schema(schema, components)
        
        return {
            "mode": "raw",
            "raw": json.dumps(example, indent=2),
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        }
    
    def _generate_example_from_schema(self, schema: Dict[str, Any], components: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example JSON from schema"""
        if "$ref" in schema:
            ref = schema["$ref"]
            schema_name = ref.split("/")[-1]
            schema = components.get("schemas", {}).get(schema_name, {})
        
        properties = schema.get("properties", {})
        example = {}
        
        for prop_name, prop_schema in properties.items():
            if "example" in prop_schema:
                example[prop_name] = prop_schema["example"]
            elif "default" in prop_schema:
                example[prop_name] = prop_schema["default"]
            else:
                example[prop_name] = self._generate_value_from_type(prop_schema)
        
        return example
    
    def _generate_value_from_type(self, schema: Dict[str, Any]) -> Any:
        """Generate example value based on type"""
        type_name = schema.get("type", "string")
        format_name = schema.get("format", "")
        
        if type_name == "string":
            if format_name == "email":
                return "user@example.com"
            elif format_name == "date-time":
                return "2024-01-01T00:00:00Z"
            elif format_name == "uuid":
                return str(uuid_lib.uuid4())
            else:
                return "string"
        elif type_name == "integer":
            return 0
        elif type_name == "number":
            return 0.0
        elif type_name == "boolean":
            return True
        elif type_name == "array":
            items_schema = schema.get("items", {})
            return [self._generate_value_from_type(items_schema)]
        elif type_name == "object":
            return {}
        
        return None
    
    def _generate_responses(self, responses: Dict[str, Any], components: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate example responses"""
        response_list = []
        
        for status_code, response in responses.items():
            response_obj = {
                "name": f"{status_code} - {response.get('description', '')}",
                "originalRequest": {},
                "status": "OK",
                "code": int(status_code),
                "_postman_previewlanguage": "json",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": "{}"
            }
            
            # Generate example from schema
            content = response.get("content", {})
            json_content = content.get("application/json", {})
            schema = json_content.get("schema", {})
            
            if schema:
                example = self._generate_example_from_schema(schema, components)
                response_obj["body"] = json.dumps(example, indent=2)
            
            response_list.append(response_obj)
        
        return response_list
    
    def _split_path(self, path: str) -> List[str]:
        """Split URL path into segments"""
        segments = []
        for segment in path.split('/'):
            if segment:
                if segment.startswith('{') and segment.endswith('}'):
                    segments.append(':' + segment[1:-1])
                else:
                    segments.append(segment)
        return segments
    
    def _get_pre_request_script(self) -> List[str]:
        """Get pre-request script for collection"""
        return [
            "// Auto-generate JWT token if available",
            "const jwtToken = pm.environment.get('jwt_token');",
            "if (jwtToken) {",
            "    pm.request.headers.add({",
            "        key: 'Authorization',",
            "        value: 'Bearer ' + jwtToken",
            "    });",
            "}",
            "",
            "// Add timestamp to requests",
            "pm.request.headers.add({",
            "    key: 'X-Request-ID',",
            "    value: pm.variables.replace('{{$guid}}')",
            "});"
        ]
    
    def _get_test_script(self) -> List[str]:
        """Get test script for collection"""
        return [
            "// Basic response validation",
            "pm.test('Status code is 2xx or 3xx', function () {",
            "    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202, 204, 301, 302]);",
            "});",
            "",
            "// Response time check",
            "pm.test('Response time is less than 2000ms', function () {",
            "    pm.expect(pm.response.responseTime).to.be.below(2000);",
            "});",
            "",
            "// Check if response is JSON",
            "pm.test('Response has Content-Type header', function () {",
            "    pm.expect(pm.response.headers.has('Content-Type')).to.be.true;",
            "});",
            "",
            "// Save JWT token if present",
            "try {",
            "    const jsonData = pm.response.json();",
            "    if (jsonData.access_token || jsonData.token) {",
            "        pm.environment.set('jwt_token', jsonData.access_token || jsonData.token);",
            "    }",
            "} catch (e) {",
            "    // Not a JSON response",
            "}"
        ]
    
    def save_postman_collection(self, collection: Dict[str, Any], file_path: str) -> None:
        """
        Save Postman collection to file
        
        Args:
            collection: Postman collection
            file_path: Path to save the collection
        """
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(collection, f, indent=2, ensure_ascii=False)
    
    def generate_and_save(
        self,
        openapi_spec: Dict[str, Any],
        file_path: str,
        base_url: str = "https://api.barberzap.com"
    ) -> None:
        """
        Generate and save Postman collection
        
        Args:
            openapi_spec: OpenAPI specification
            file_path: Path to save the collection
            base_url: Base URL for the API
        """
        collection = self.generate_postman_collection(openapi_spec, base_url)
        self.save_postman_collection(collection, file_path)


def generate_environment_file(base_url: str = "https://api.barberzap.com") -> Dict[str, Any]:
    """Generate Postman environment file"""
    return {
        "id": str(uuid_lib.uuid4()),
        "name": "BarberZap API - Development",
        "values": [
            {
                "key": "baseUrl",
                "value": base_url,
                "enabled": True
            },
            {
                "key": "apiVersion",
                "value": "v1",
                "enabled": True
            },
            {
                "key": "api_key",
                "value": "",
                "enabled": True,
                "type": "secret"
            },
            {
                "key": "jwt_token",
                "value": "",
                "enabled": True,
                "type": "secret"
            },
            {
                "key": "user_id",
                "value": "",
                "enabled": True
            },
            {
                "key": "shop_id",
                "value": "",
                "enabled": True
            }
        ],
        "_postman_variable_scope": "environment"
    }


def save_environment_file(environment: Dict[str, Any], file_path: str) -> None:
    """Save Postman environment file"""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(environment, f, indent=2, ensure_ascii=False)
