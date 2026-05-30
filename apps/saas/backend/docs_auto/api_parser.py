"""
API Parser - Parse FastAPI routes and extract documentation
"""

from typing import Dict, List, Any, Optional, Tuple
from fastapi import FastAPI, APIRouter, routing
from pydantic import BaseModel
from inspect import signature, Parameter
import re


class APIParser:
    """Parser for FastAPI routes to extract API documentation"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.routes_data = {}
        
    def parse_all_routes(self) -> Dict[str, Any]:
        """
        Parse all routes from the FastAPI application
        
        Returns:
            Dict with routes grouped by tags
        """
        parsed = {
            "endpoints": [],
            "tags": {},
            "schemas": {}
        }
        
        for route in self.app.routes:
            if not hasattr(route, 'methods') or not route.methods:
                continue
                
            # Only parse actual API routes
            if not hasattr(route, 'path') or not hasattr(route, 'endpoint'):
                continue
                
            endpoint_info = self._parse_route(route)
            if endpoint_info:
                parsed["endpoints"].append(endpoint_info)
                
                # Group by tags
                for tag in endpoint_info.get("tags", ["default"]):
                    if tag not in parsed["tags"]:
                        parsed["tags"][tag] = []
                    parsed["tags"][tag].append(endpoint_info)
        
        # Extract all Pydantic schemas
        parsed["schemas"] = self._extract_schemas()
        
        return parsed
    
    def _parse_route(self, route: Any) -> Optional[Dict[str, Any]]:
        """Parse a single route"""
        path = route.path
        methods = list(route.methods)
        
        endpoint_func = route.endpoint
        if not endpoint_func:
            return None
            
        sig = signature(endpoint_func)
        docstring = endpoint_func.__doc__ or ""
        
        # Parse docstring
        doc_info = self._parse_docstring(docstring)
        
        # Extract parameters
        params = self._extract_parameters(sig, route)
        
        # Extract path parameters from route
        path_params = self._extract_path_params(path)
        
        # Check for request body
        request_body = self._extract_request_body(sig)
        
        # Extract response models
        response_models = self._extract_response_models(route)
        
        # Extract dependencies
        dependencies = self._extract_dependencies(route)
        
        # Get tags from route
        tags = getattr(route, 'tags', ['default'])
        
        # Get summary and description
        summary = getattr(route, 'summary', None) or doc_info.get('summary')
        description = getattr(route, 'description', None) or doc_info.get('description')
        
        # Extract operation_id
        operation_id = getattr(route, 'operation_id', self._generate_operation_id(path, methods[0]))
        
        # Extract examples from docstring
        examples = doc_info.get('examples', {})
        
        # Determine deprecated status
        deprecated = getattr(route, 'deprecated', False)
        
        return {
            "path": path,
            "methods": methods,
            "operation_id": operation_id,
            "summary": summary,
            "description": description,
            "tags": tags,
            "parameters": params + path_params,
            "request_body": request_body,
            "responses": response_models,
            "dependencies": dependencies,
            "examples": examples,
            "deprecated": deprecated
        }
    
    def _parse_docstring(self, docstring: str) -> Dict[str, Any]:
        """Parse docstring to extract documentation elements"""
        if not docstring:
            return {}
            
        result = {
            "summary": "",
            "description": "",
            "parameters": {},
            "returns": {},
            "examples": {},
            "raises": {}
        }
        
        lines = docstring.strip().split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.rstrip()
            
            # Check for section headers
            if line.startswith('Args:') or line.startswith('Parameters:') or line.startswith('Args:'):
                current_section = 'parameters'
                continue
            elif line.startswith('Returns:') or line.startswith('Return:'):
                current_section = 'returns'
                continue
            elif line.startswith('Raises:') or line.startswith('Raises:'):
                current_section = 'raises'
                continue
            elif line.startswith('Example:') or line.startswith('Examples:'):
                current_section = 'examples'
                continue
            elif line.startswith('---'):
                continue
            elif line.strip() == '' and current_section:
                current_section = None
                continue
            
            if current_section is None:
                if not result["summary"]:
                    # First line is summary
                    result["summary"] = line.strip()
                else:
                    result["description"] += line + '\n'
            else:
                if current_section == 'parameters':
                    param_match = re.match(r'\s*(\w+)\s*:\s*(.+)', line)
                    if param_match:
                        param_name, param_desc = param_match.groups()
                        result["parameters"][param_name] = param_desc
                elif current_section == 'returns':
                    result["returns"]["description"] = line.strip()
                elif current_section == 'raises':
                    raise_match = re.match(r'\s*(\w+)\s*:\s*(.+)', line)
                    if raise_match:
                        exc_name, exc_desc = raise_match.groups()
                        result["raises"][exc_name] = exc_desc
                elif current_section == 'examples':
                    current_content.append(line)
        
        if current_section == 'examples':
            result["examples"] = self._parse_example_section('\n'.join(current_content))
        
        return result
    
    def _parse_example_section(self, example_text: str) -> Dict[str, Any]:
        """Parse example section from docstring"""
        examples = {}
        
        # Try to extract JSON examples
        json_pattern = r'```json\s*(\{[\s\S]*?\})\s*```'
        json_matches = re.findall(json_pattern, example_text)
        if json_matches:
            try:
                import json
                examples["request"] = json.loads(json_matches[0])
                if len(json_matches) > 1:
                    examples["response"] = json.loads(json_matches[1])
            except json.JSONDecodeError:
                pass
        
        return examples
    
    def _extract_parameters(self, sig: signature, route: Any) -> List[Dict[str, Any]]:
        """Extract function parameters"""
        params = []
        
        for name, param in sig.parameters.items():
            if name in ('self', 'cls'):
                continue
                
            param_info = {
                "name": name,
                "in": "query",  # default
                "required": param.default == Parameter.empty,
                "schema": self._get_param_type(param.annotation),
                "description": ""
            }
            
            # Check if it's a path parameter
            if name in sig.parameters and hasattr(route, 'path'):
                if f"{{{name}}}" in route.path:
                    param_info["in"] = "path"
                    param_info["required"] = True
            
            params.append(param_info)
        
        return params
    
    def _extract_path_params(self, path: str) -> List[Dict[str, Any]]:
        """Extract path parameters from the route path"""
        path_params = []
        matches = re.findall(r'\{(\w+)\}', path)
        
        for match in matches:
            path_params.append({
                "name": match,
                "in": "path",
                "required": True,
                "schema": {"type": "string"},
                "description": f"Path parameter: {match}"
            })
        
        return path_params
    
    def _extract_request_body(self, sig: signature) -> Optional[Dict[str, Any]]:
        """Extract request body from signature"""
        for name, param in sig.parameters.items():
            if name in ('self', 'cls', 'request', 'response'):
                continue
                
            # Check if this parameter is a Pydantic model
            annotation = param.annotation
            if self._is_pydantic_model(annotation):
                return {
                    "required": param.default == Parameter.empty,
                    "content": {
                        "application/json": {
                            "schema": self._get_schema_from_model(annotation)
                        }
                    }
                }
        
        return None
    
    def _extract_response_models(self, route: Any) -> Dict[str, Any]:
        """Extract response models from route"""
        responses = {}
        
        # Get response_model from route decorator
        if hasattr(route, 'response_model'):
            response_model = route.response_model
            if response_model:
                responses["200"] = {
                    "description": "Successful response",
                    "content": {
                        "application/json": {
                            "schema": self._get_schema_from_model(response_model)
                        }
                    }
                }
        
        # Get additional responses
        if hasattr(route, 'responses'):
            additional_responses = route.responses
            for status_code, response in additional_responses.items():
                if status_code not in responses:
                    responses[str(status_code)] = response
        
        # Add default error responses
        if "400" not in responses:
            responses["400"] = {
                "description": "Bad Request"
            }
        if "401" not in responses:
            responses["401"] = {
                "description": "Unauthorized"
            }
        if "404" not in responses:
            responses["404"] = {
                "description": "Not Found"
            }
        if "422" not in responses:
            responses["422"] = {
                "description": "Validation Error"
            }
        if "500" not in responses:
            responses["500"] = {
                "description": "Internal Server Error"
            }
        
        return responses
    
    def _extract_dependencies(self, route: Any) -> List[Dict[str, Any]]:
        """Extract dependencies from route"""
        dependencies = []
        
        if hasattr(route, 'dependencies'):
            for dep in route.dependencies:
                dependencies.append({
                    "name": dep.__class__.__name__ if hasattr(dep, '__class__') else str(dep)
                })
        
        return dependencies
    
    def _extract_schemas(self) -> Dict[str, Any]:
        """Extract all Pydantic model schemas from the app"""
        schemas = {}
        
        # Get schemas from app's openapi
        try:
            openapi_schema = self.app.openapi()
            if "components" in openapi_schema and "schemas" in openapi_schema["components"]:
                schemas = openapi_schema["components"]["schemas"]
        except Exception:
            pass
        
        return schemas
    
    def _is_pydantic_model(self, annotation: Any) -> bool:
        """Check if annotation is a Pydantic model"""
        try:
            from pydantic import BaseModel
            if isinstance(annotation, type) and issubclass(annotation, BaseModel):
                return True
        except Exception:
            pass
        return False
    
    def _get_param_type(self, annotation: Any) -> Dict[str, Any]:
        """Get JSON Schema type from Python type annotation"""
        type_map = {
            str: {"type": "string"},
            int: {"type": "integer"},
            float: {"type": "number"},
            bool: {"type": "boolean"},
            list: {"type": "array"},
            dict: {"type": "object"}
        }
        
        if annotation in type_map:
            return type_map[annotation].copy()
        
        # Handle Optional
        origin = getattr(annotation, '__origin__', None)
        if origin is Union:
            return self._get_param_type(annotation.__args__[0])
        
        # Handle List
        if origin is list:
            item_type = self._get_param_type(annotation.__args__[0])
            return {"type": "array", "items": item_type}
        
        # Default to string for complex types
        return {"type": "string"}
    
    def _get_schema_from_model(self, model: Any) -> Dict[str, Any]:
        """Get schema from Pydantic model"""
        try:
            return model.model_json_schema() if hasattr(model, 'model_json_schema') else model.schema()
        except Exception:
            return {"type": "object"}
    
    def _generate_operation_id(self, path: str, method: str) -> str:
        """Generate operation ID from path and method"""
        # Remove path parameters
        clean_path = re.sub(r'\{\w+\}', '', path)
        clean_path = clean_path.replace('/', '_').strip('_')
        
        return f"{method.lower()}{clean_path}" if clean_path else method.lower()
    
    def get_routes_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """Get all routes for a specific tag"""
        parsed = self.parse_all_routes()
        return parsed.get("tags", {}).get(tag, [])
    
    def get_all_tags(self) -> List[str]:
        """Get all unique tags from routes"""
        parsed = self.parse_all_routes()
        return list(parsed.get("tags", {}).keys())
    
    def get_endpoints_summary(self) -> List[Dict[str, Any]]:
        """Get a summary of all endpoints"""
        parsed = self.parse_all_routes()
        summary = []
        
        for endpoint in parsed.get("endpoints", []):
            for method in endpoint.get("methods", []):
                summary.append({
                    "path": endpoint["path"],
                    "method": method,
                    "operation_id": endpoint["operation_id"],
                    "summary": endpoint.get("summary", ""),
                    "tags": endpoint.get("tags", ["default"])
                })
        
        return summary


from typing import Union
