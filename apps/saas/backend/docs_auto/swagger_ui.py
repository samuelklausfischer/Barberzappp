"""
Swagger UI Integration - Generate interactive Swagger UI documentation
"""

from typing import Optional, Dict, Any
from pathlib import Path
import json


class SwaggerUI:
    """Generate Swagger UI HTML documentation"""
    
    SWAGGER_JS_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"
    SWAGGER_CSS_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css"
    SWAGGER_STANDALONE_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"
    
    def __init__(
        self,
        spec_url: Optional[str] = None,
        brand_name: str = "BarberZap",
        logo_url: Optional[str] = None,
        theme: str = "light"
    ):
        """
        Initialize Swagger UI generator
        
        Args:
            spec_url: URL or path to OpenAPI specification
            brand_name: Brand name for the documentation
            logo_url: URL to logo image
            theme: Color theme (light/dark)
        """
        self.spec_url = spec_url
        self.brand_name = brand_name
        self.logo_url = logo_url
        self.theme = theme
    
    def generate_html(
        self,
        spec_file: Optional[str] = None,
        spec_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate Swagger UI HTML
        
        Args:
            spec_file: Path to OpenAPI spec file (embedded mode)
            spec_data: OpenAPI spec data (embedded mode)
            
        Returns:
            Complete HTML document
        """
        if spec_data:
            spec_json = json.dumps(spec_data)
            embedded_spec = spec_json
        elif spec_file:
            spec_path = Path(spec_file)
            with open(spec_path, 'r') as f:
                spec_json = f.read()
            embedded_spec = spec_json
        else:
            embedded_spec = None
        
        theme_config = self._get_theme_config()
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{self.brand_name} API Documentation</title>
    <link rel="stylesheet" type="text/css" href="{self.SWAGGER_CSS_URL}">
    
    <!-- Custom Styles -->
    <style>
        html {{
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }}
        
        *, *:before, *:after {{
            box-sizing: inherit;
        }}
        
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }}
        
        .topbar-wrapper {{
            background: {theme_config['primary_color']} !important;
        }}
        
        .topbar-wrapper .topbar {{
            background: {theme_config['primary_color']} !important;
        }}
        
        .topbar-wrapper .link {{
            color: white !important;
        }}
        
        /* Custom header */
        .custom-header {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            background: {theme_config['primary_color']};
            color: white;
            display: flex;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 9999;
        }}
        
        .custom-header .logo {{
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .custom-header .logo img {{
            height: 32px;
        }}
        
        .custom-header .actions {{
            margin-left: auto;
            display: flex;
            gap: 10px;
        }}
        
        .custom-header .btn {{
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }}
        
        .custom-header .btn:hover {{
            background: rgba(255,255,255,0.3);
        }}
        
        /* Dark mode styles */
        {"body { background: #1a1a1a; } .swagger-ui .info { background: #1a1a1a; }" if self.theme == "dark" else ""}
        
        /* Loading overlay */
        #loading {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: {theme_config['bg_color']};
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }}
        
        .spinner {{
            width: 50px;
            height: 50px;
            border: 4px solid {theme_config['border_color']};
            border-top-color: {theme_config['primary_color']};
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }}
        
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        
        #swagger-ui {{
            margin-top: 50px;
        }}
    </style>
</head>
<body>
    <!-- Loading -->
    <div id="loading">
        <div class="spinner"></div>
    </div>
    
    <!-- Custom Header -->
    <div class="custom-header">
        <div class="logo">
            {f'<img src="{self.logo_url}" alt="Logo">' if self.logo_url else ''}
            {self.brand_name} API
        </div>
        <div class="actions">
            <button class="btn" onclick="downloadSpec()">Download Spec</button>
            <button class="btn" onclick="clearAuth()">Clear Auth</button>
        </div>
    </div>
    
    <!-- Swagger UI -->
    <div id="swagger-ui"></div>
    
    <!-- Scripts -->
    <script src="{self.SWAGGER_JS_URL}"></script>
    <script src="{self.SWAGGER_STANDALONE_URL}"></script>
    
    <script>
        // Parse openapi spec data
        {f'const spec = {embedded_spec};' if embedded_spec else 'const spec = null;'}
        
        // Theme configuration
        const themeConfig = {json.dumps(theme_config)};
        
        // Authorization configuration
        const authConfig = {{
            apiKey: {{
                name: 'X-API-Key',
                in: 'header'
            }},
            bearer: {{
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }}
        }};
        
        // Initialize Swagger UI
        const ui = SwaggerUIBundle({{
            url: {f'"{self.spec_url}"' if not embedded_spec else 'undefined'},
            spec: spec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            docExpansion: "list",
            filter: true,
            showRequestHeaders: true,
            tryItOutEnabled: true,
            persistAuthorization: true,
            
            // Theme customization
            oauth2RedirectUrl: window.location.href,
            validatorUrl: null,
            syntaxHighlight: {{
                activate: true,
                theme: "monokai"
            }},
            
            onComplete: () => {{
                document.getElementById('loading').style.display = 'none';
            }}
        }});
        
        // Make ui available globally for debugging
        window.ui = ui;
        
        // Download spec as JSON
        function downloadSpec() {{
            {f'''
            const blob = new Blob([JSON.stringify(spec, null, 2)], {{type: 'application/json'}});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'openapi.json';
            a.click();
            URL.revokeObjectURL(url);
            ''' if embedded_spec else f'''
            fetch("{self.spec_url}")
                .then(r => r.json())
                .then(data => {{
                    const blob = new Blob([JSON.stringify(data, null, 2)], {{type: 'application/json'}});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'openapi.json';
                    a.click();
                    URL.revokeObjectURL(url);
                }});
            '''}
        }}
        
        // Clear authorization
        function clearAuth() {{
            // Clear any stored auth tokens
            Object.keys(localStorage).forEach(key => {{
                if (key.startsWith('authorized-swaggger') || key.startsWith('bearerAuth')) {{
                    localStorage.removeItem(key);
                }}
            }});
            // Reload the page
            location.reload();
        }}
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {{
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {{
                e.preventDefault();
                const searchInput = document.querySelector('.swagger-ui .input');
                if (searchInput) {{
                    searchInput.focus();
                }}
            }}
        }});
    </script>
</body>
</html>
"""
        return html
    
    def _get_theme_config(self) -> Dict[str, Any]:
        """Get theme configuration"""
        if self.theme == "dark":
            return {
                "primary_color": "#ff6b35",
                "bg_color": "#1a1a1a",
                "border_color": "#333",
                "text_color": "#ffffff"
            }
        else:
            return {
                "primary_color": "#ff6b35",
                "bg_color": "#ffffff",
                "border_color": "#e0e0e0",
                "text_color": "#333333"
            }
    
    def save_html(self, file_path: str, spec_file: Optional[str] = None, spec_data: Optional[Dict[str, Any]] = None) -> None:
        """
        Save Swagger UI HTML to file
        
        Args:
            file_path: Path to save the HTML file
            spec_file: Path to OpenAPI spec file
            spec_data: OpenAPI spec data
        """
        html = self.generate_html(spec_file=spec_file, spec_data=spec_data)
        
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
    
    def generate_standalone(self, spec_data: Dict[str, Any], output_path: str) -> None:
        """
        Generate standalone Swagger UI documentation with embedded spec
        
        Args:
            spec_data: OpenAPI specification data
            output_path: Path to save the HTML file
        """
        self.save_html(output_path, spec_data=spec_data)


class SwaggerUIWithAuth(SwaggerUI):
    """Swagger UI with enhanced authentication support"""
    
    def generate_html(
        self,
        spec_file: Optional[str] = None,
        spec_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate Swagger UI HTML with enhanced auth support"""
        base_html = super().generate_html(spec_file, spec_data)
        
        auth_script = '''
        <script>
            // Enhanced auth handling
            function setApiKey(key) {
                ui.authActions.authorize({
                    ApiKeyAuth: {
                        name: 'API Key',
                        schema: {type: 'apiKey', in: 'header', name: 'X-API-Key'},
                        value: key
                    }
                });
            }
            
            function setBearerToken(token) {
                ui.authActions.authorize({
                    BearerAuth: {
                        name: 'Bearer',
                        schema: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
                        value: token
                    }
                });
            }
            
            // Auto-set auth from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const apiKey = urlParams.get('api_key');
            const bearerToken = urlParams.get('token');
            
            if (apiKey) setApiKey(apiKey);
            if (bearerToken) setBearerToken(bearerToken);
        </script>
        '''
        
        html = base_html.replace('</body>', auth_script + '</body>')
        
        return html
    
    def set_api_key(self, key: str) -> str:
        """Generate JavaScript to set API key"""
        return f"setApiKey('{key}');"
    
    def set_bearer_token(self, token: str) -> str:
        """Generate JavaScript to set bearer token"""
        return f"setBearerToken('{token}');"


class SwaggerUIWithExport(SwaggerUI):
    """Swagger UI with additional export options"""
    
    def generate_html(
        self,
        spec_file: Optional[str] = None,
        spec_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate Swagger UI HTML with export options"""
        base_html = super().generate_html(spec_file, spec_data)
        
        export_script = '''
        <script>
            // Export to Postman collection
            function exportToPostman() {
                const spec = ui.specSelectors.spec();
                const collection = {
                    info: {
                        name: spec.info.title,
                        description: spec.info.description
                    },
                    item: []
                };
                
                for (const path in spec.paths) {
                    for (const method in spec.paths[path]) {
                        const operation = spec.paths[path][method];
                        collection.item.push({
                            name: operation.summary || operation.operationId || method + ' ' + path,
                            request: {
                                method: method.toUpperCase(),
                                url: '{{baseUrl}}' + path,
                                header: [],
                                body: {}
                            }
                        });
                    }
                }
                
                const blob = new Blob([JSON.stringify(collection, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'postman_collection.json';
                a.click();
                URL.revokeObjectURL(url);
            }
            
            // Add export button
            const actionsDiv = document.querySelector('.custom-header .actions');
            if (actionsDiv) {
                const exportBtn = document.createElement('button');
                exportBtn.className = 'btn';
                exportBtn.textContent = 'Export Postman';
                exportBtn.onclick = exportToPostman;
                actionsDiv.appendChild(exportBtn);
            }
        </script>
        '''
        
        html = base_html.replace('</body>', export_script + '</body>')
        
        return html


def generate_swagger_docs(
    spec_data: Dict[str, Any],
    output_path: str,
    brand_name: str = "BarberZap",
    theme: str = "light",
    with_auth: bool = False
) -> None:
    """
    Convenience function to generate Swagger UI documentation
    
    Args:
        spec_data: OpenAPI specification data
        output_path: Path to save the HTML file
        brand_name: Brand name for documentation
        theme: Color theme (light/dark)
        with_auth: Include enhanced authentication support
    """
    if with_auth:
        generator = SwaggerUIWithAuth(brand_name=brand_name, theme=theme)
    else:
        generator = SwaggerUI(brand_name=brand_name, theme=theme)
    
    generator.save_html(output_path, spec_data=spec_data)
