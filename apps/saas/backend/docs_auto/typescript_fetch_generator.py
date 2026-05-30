"""
TypeScript Fetch Client Generator - Generate typed TypeScript API clients
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import re
from string import Template


class TypeScriptClientGenerator:
    """Generate TypeScript fetch client from OpenAPI specification"""
    
    def __init__(
        self,
        client_name: str = "BarberZapClient",
        base_url: str = "https://api.barberzap.com"
    ):
        """
        Initialize TypeScript client generator
        
        Args:
            client_name: Name of the client class
            base_url: Base URL for the API
        """
        self.client_name = client_name
        self.base_url = base_url
        self.schemas = {}
        self.type_definitions = []
        self.client_methods = []
    
    def generate_typescript_client(self, openapi_spec: Dict[str, Any]) -> str:
        """
        Generate complete TypeScript client
        
        Args:
            openapi_spec: OpenAPI specification
            
        Returns:
            Complete TypeScript code
        """
        paths = openapi_spec.get("paths", {})
        components = openapi_spec.get("components", {})
        self.schemas = components.get("schemas", {})
        
        # Generate type definitions
        self._generate_type_definitions(self.schemas)
        
        # Generate client methods
        for path, path_item in paths.items():
            for method, operation in path_item.items():
                self._generate_client_method(path, method, operation)
        
        # Build complete client
        client = self._build_client()
        
        return client
    
    def _generate_type_definitions(self, schemas: Dict[str, Any]) -> None:
        """Generate TypeScript type definitions from schemas"""
        for schema_name, schema in schemas.items():
            type_def = self._generate_type(schema_name, schema)
            self.type_definitions.append(type_def)
    
    def _generate_type(self, name: str, schema: Dict[str, Any], indent: int = 0) -> str:
        """Generate TypeScript type definition"""
        indent_str = "    " * indent
        type_name = self._to_pascal_case(name)
        
        if "$ref" in schema:
            ref = schema["$ref"]
            ref_name = ref.split("/")[-1]
            return f"{indent_str}{type_name} = {self._to_pascal_case(ref_name)}"
        
        schema_type = schema.get("type")
        
        if schema_type == "object":
            properties = schema.get("properties", {})
            required = set(schema.get("required", []))
            
            if not properties:
                return f"{indent_str}{type_name} = {{}}"
            
            props_str = []
            for prop_name, prop_schema in properties.items():
                prop_type = self._get_typescript_type(prop_schema)
                optional = "?" if prop_name not in required else ""
                props_str.append(f"{indent_str}    {prop_name}{optional}: {prop_type};")
            
            return f"{indent_str}{type_name} = {{\n" + "\n".join(props_str) + f"\n{indent_str}}}"
        
        elif schema_type == "array":
            items = schema.get("items", {})
            item_type = self._get_typescript_type(items)
            return f"{indent_str}{type_name} = {item_type}[]"
        
        elif schema_type == "enum":
            enum_values = schema.get("enum", [])
            enum_str = " | ".join(f'"{v}"' for v in enum_values)
            return f"{indent_str}{type_name} = {enum_str}"
        
        else:
            ts_type = self._get_typescript_type(schema)
            return f"{indent_str}{type_name} = {ts_type}"
    
    def _get_typescript_type(self, schema: Dict[str, Any]) -> str:
        """Get TypeScript type from JSON schema"""
        if "$ref" in schema:
            ref = schema["$ref"]
            ref_name = ref.split("/")[-1]
            return self._to_pascal_case(ref_name)
        
        schema_type = schema.get("type", "any")
        
        if schema_type == "string":
            format_name = schema.get("format", "")
            if format_name == "date-time":
                return "string"
            elif format_name == "date":
                return "string"
            elif format_name == "uuid":
                return "string"
            elif format_name == "email":
                return "string"
            return "string"
        elif schema_type == "integer":
            return "number"
        elif schema_type == "number":
            return "number"
        elif schema_type == "boolean":
            return "boolean"
        elif schema_type == "array":
            items = schema.get("items", {})
            return f"{self._get_typescript_type(items)}[]"
        elif schema_type == "object":
            return "Record<string, any>"
        else:
            return "any"
    
    def _generate_client_method(self, path: str, method: str, operation: Dict[str, Any]) -> None:
        """Generate TypeScript client method"""
        method_name = self._generate_method_name(operation, method, path)
        
        summary = operation.get("summary", "")
        description = operation.get("description", "")
        tags = operation.get("tags", [])
        
        # Get parameters
        params = operation.get("parameters", [])
        path_params = []
        query_params = []
        
        for param in params:
            if param["in"] == "path":
                ts_type = self._get_typescript_type(param.get("schema", {}))
                path_params.append({
                    "name": param["name"],
                    "type": ts_type
                })
            elif param["in"] == "query":
                ts_type = self._get_typescript_type(param.get("schema", {}))
                query_params.append({
                    "name": param["name"],
                    "type": ts_type,
                    "required": param.get("required", False)
                })
        
        # Get request body
        request_body = operation.get("requestBody")
        body_type = None
        if request_body:
            content = request_body.get("content", {})
            json_content = content.get("application/json", {})
            schema = json_content.get("schema", {})
            body_type = self._get_typescript_type(schema)
        
        # Get response type
        response_type = "any"
        responses = operation.get("responses", {})
        if "200" in responses:
            response_schema = responses["200"].get("content", {}).get("application/json", {}).get("schema", {})
            response_type = self._get_typescript_type(response_schema)
        
        # Build method signature
        method_def = self._build_method_definition(
            method_name,
            method.upper(),
            path,
            path_params,
            query_params,
            body_type,
            response_type,
            summary,
            description,
            tags
        )
        
        self.client_methods.append(method_def)
    
    def _generate_method_name(self, operation: Dict[str, Any], method: str, path: str) -> str:
        """Generate method name from operation"""
        # Check for custom operationId
        operation_id = operation.get("operation_id")
        if operation_id:
            operation_id = operation_id.replace("-", "_")
            # Remove method prefix if present
            for m in ["get", "post", "put", "patch", "delete"]:
                if operation_id.startswith(m):
                    operation_id = operation_id[len(m):]
                    break
            return self._to_pascal_case(operation_id)
        
        # Generate from path
        # Remove path parameters
        clean_path = re.sub(r'\{\w+\}', '', path)
        clean_path = clean_path.replace("/", "_").strip("_")
        
        # Add method prefix
        method_map = {
            "get": "get",
            "post": "create",
            "put": "update",
            "patch": "patch",
            "delete": "delete"
        }
        
        prefix = method_map.get(method.lower(), "do")
        
        if clean_path:
            return self._to_pascal_case(f"{prefix}_{clean_path}")
        
        return self._to_pascal_case(prefix)
    
    def _build_method_definition(
        self,
        name: str,
        method: str,
        path: str,
        path_params: List[Dict[str, str]],
        query_params: List[Dict[str, Any]],
        body_type: Optional[str],
        response_type: str,
        summary: str,
        description: str,
        tags: List[str]
    ) -> str:
        """Build complete method definition"""
        # Build parameters
        params_str = []
        
        # Path parameters
        for param in path_params:
            params_str.append(f"        {param['name']}: {param['type']}")
        
        # Query parameters (as object)
        if query_params:
            query_obj_props = []
            for param in query_params:
                optional = "?" if not param["required"] else ""
                query_obj_props.append(f"            {param['name']}{optional}: {param['type']}")
            
            query_type = f"{{\n{chr(10).join(query_obj_props)}\n        }}"
            params_str.append(f"        query?: {query_type}")
        
        # Request body
        if body_type:
            params_str.append(f"        data: {body_type}")
        
        # Options
        params_str.append("        options?: RequestOptions")
        
        params_joined = ",\n".join(params_str)
        
        # Build docstring
        doc_lines = [
            "        /**",
            f"         * {summary}"
        ]
        
        if description:
            doc_lines.append(f"         * {description}")
        
        if tags:
            doc_lines.append(f"         * @tags {', '.join(tags)}")
        
        # Add parameter documentation
        for param in path_params:
            doc_lines.append(f"         * @param {param['name']} Path parameter")
        
        if body_type:
            doc_lines.append("         * @param data Request body")
        
        if query_params:
            doc_lines.append("         * @param query Query parameters")
        
        doc_lines.append("         */")
        
        # Build URL construction
        url_path = path
        for param in path_params:
            url_path = url_path.replace(f"{{{param['name']}}}", f"${{{param['name']}}}")
        
        # Build fetch call
        fetch_lines = []
        fetch_lines.append("        const url = `${this.baseUrl}${url_path}`;")
        fetch_lines.append("")
        
        # Build query string
        if query_params:
            fetch_lines.append("        const queryParams = new URLSearchParams();")
            fetch_lines.append("        if (query) {")
            fetch_lines.append("            Object.entries(query).forEach(([key, value]) => {")
            fetch_lines.append("                if (value !== undefined && value !== null) {")
            fetch_lines.append("                    queryParams.append(key, String(value));")
            fetch_lines.append("                }")
            fetch_lines.append("            });")
            fetch_lines.append("        }")
            fetch_lines.append("")
        
        # Build headers
        fetch_lines.append("        const headers: Record<string, string> = {")
        fetch_lines.append("            'Content-Type': 'application/json',")
        fetch_lines.append("            ...(options?.headers || {})")
        fetch_lines.append("        };")
        fetch_lines.append("")
        
        # Add auth header
        fetch_lines.append("        if (this.authToken) {")
        fetch_lines.append("            headers['Authorization'] = `Bearer ${this.authToken}`;")
        fetch_lines.append("        }")
        fetch_lines.append("")
        
        # Build fetch options
        fetch_lines.append("        const fetchOptions: RequestInit = {")
        fetch_lines.append(f"            method: '{method}',")
        fetch_lines.append("            headers,")
        
        if body_type:
            fetch_lines.append("            body: JSON.stringify(data),")
        
        fetch_lines.append("            ...(options || {})")
        fetch_lines.append("        };")
        fetch_lines.append("")
        
        # Execute fetch
        fetch_lines.append("        const response = await fetch(url, fetchOptions);")
        fetch_lines.append("")
        fetch_lines.append("        if (!response.ok) {")
        fetch_lines.append("            throw new ApiError(response.status, response.statusText, await response.text())")
        fetch_lines.append("        }")
        fetch_lines.append("")
        
        # Return response
        if response_type != "void":
            fetch_lines.append(f"        return response.json() as Promise<{response_type}>;")
        else:
            fetch_lines.append("        return;")
        
        method_code = "\n".join(doc_lines) + "\n" + \
        f"        {name}(\n{params_joined}\n    ): Promise<{response_type}> {{\n" + \
        "\n".join(fetch_lines) + "\n    }"
        
        return method_code
    
    def _build_client(self) -> str:
        """Build complete TypeScript client"""
        client_code = f'''// Auto-generated TypeScript API client for {self.client_name}
// Generated by BarberZap API Documentation Generator

/**
 * API error class
 */
export class ApiError extends Error {{
    constructor(
        public status: number,
        public statusText: string,
        public responseText: string
    ) {{
        super(`API Error: ${{status}} ${{statusText}}`)
        this.name = 'ApiError'
    }}
}}

/**
 * Request options interface
 */
export interface RequestOptions extends RequestInit {{
    headers?: Record<string, string>
}}

/**
 * {self.client_name} - Auto-generated API client
 */
export interface {self.client_name} {{
    // Configuration
    baseUrl: string
    authToken?: string
    
    // Methods
{chr(10).join(f"    {method['name']}; {method.get('summary', '')}" for method in [{}}])}

/**
 * Type definitions
 */
{chr(10).join(self.type_definitions)}

/**
 * {self.client_name} implementation
 */
export class {self.client_name}Impl implements {self.client_name} {{
    public baseUrl: string
    public authToken?: string
    
    constructor(config?: {{ baseUrl?: string; authToken?: string }}) {{
        this.baseUrl = config?.baseUrl || '{self.base_url}'
        this.authToken = config?.authToken
    }}
    
    /**
     * Set authentication token
     */
    public setAuthToken(token: string): void {{
        this.authToken = token
    }}
    
    /**
     * Clear authentication token
     */
    public clearAuthToken(): void {{
        this.authToken = undefined
    }}
    
    /**
     * Update base URL
     */
    public setBaseUrl(url: string): void {{
        this.baseUrl = url
    }}

{chr(10).join(self.client_methods)}
}}

// Export default client instance
export const {self.client_name} = new {self.client_name}Impl()
export default {self.client_name}
'''
        
        # Add methods to interface
        client_code = client_code.replace(
            "// Methods\n" + "\n".join(f"    {method['name']}; {method.get('summary', '')}" for method in [{}]) + "\n",
            "// Methods\n" + "\n".join(
                f"    {self._extract_method_name(method)}(...args: any[]): Promise<any>"
                for method in self.client_methods[:5]
            )
        )
        
        return client_code
    
    def _extract_method_name(self, method_code: str) -> str:
        """Extract method name from method code"""
        match = re.search(r'(\w+)\(', method_code)
        return match.group(1) if match else "unknown"
    
    def _to_pascal_case(self, name: str) -> str:
        """Convert string to PascalCase"""
        # Remove separators and convert to PascalCase
        name = name.replace("-", "_").replace("/", "_")
        parts = name.split("_")
        return "".join(part.capitalize() for part in parts if part)
    
    def save_typescript_client(self, client_code: str, file_path: str) -> None:
        """
        Save TypeScript client to file
        
        Args:
            client_code: Generated TypeScript code
            file_path: Path to save the file
        """
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(client_code)
    
    def generate_and_save(
        self,
        openapi_spec: Dict[str, Any],
        file_path: str
    ) -> None:
        """
        Generate and save TypeScript client
        
        Args:
            openapi_spec: OpenAPI specification
            file_path: Path to save the TypeScript file
        """
        client_code = self.generate_typescript_client(openapi_spec)
        self.save_typescript_client(client_code, file_path)


def generate_typescript_api_client(openapi_spec: Dict[str, Any], output_path: str) -> None:
    """
    Convenience function to generate TypeScript API client
    
    Args:
        openapi_spec: OpenAPI specification
        output_path: Path to save the TypeScript file
    """
    generator = TypeScriptClientGenerator()
    generator.generate_and_save(openapi_spec, output_path)


def generate_typescript_interfaces(openapi_spec: Dict[str, Any], output_path: str) -> str:
    """
    Generate TypeScript interfaces from OpenAPI schemas
    
    Args:
        openapi_spec: OpenAPI specification
        output_path: Path to save the TypeScript types file
        
    Returns:
        TypeScript interfaces code
    """
    components = openapi_spec.get("components", {})
    schemas = components.get("schemas", {})
    
    generator = TypeScriptClientGenerator()
    generator._generate_type_definitions(schemas)
    
    header = f"""
// Auto-generated TypeScript interfaces
// Generated by BarberZap API Documentation Generator

"""
    
    footer = "\nexport default {}"
    
    full_code = header + "\n\n".join(generator.type_definitions) + footer
    
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(full_code)
    
    return full_code
