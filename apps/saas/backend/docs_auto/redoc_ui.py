"""
ReDoc UI Integration - Generate interactive ReDoc HTML documentation
"""

from typing import Optional, Dict, Any
from pathlib import Path
import json


class ReDocUI:
    """Generate ReDoc HTML documentation"""
    
    REDOC_JS_URL = "https://cdn.jsdelivr.net/npm/redoc@2.0.0/redoc.min.js"
    REDOC_CSS_URL = "https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.css"
    
    def __init__(
        self,
        spec_url: Optional[str] = None,
        brand_name: str = "BarberZap",
        logo_url: Optional[str] = None,
        theme: str = "light"
    ):
        """
        Initialize ReDoc UI generator
        
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
        Generate ReDoc HTML
        
        Args:
            spec_file: Path to OpenAPI spec file (embedded mode)
            spec_data: OpenAPI spec data (embedded mode)
            
        Returns:
            Complete HTML document
        """
        if spec_data:
            spec_json = json.dumps(spec_data, indent=2)
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
    
    <!-- ReDoc CSS -->
    <link href="{self.REDOC_CSS_URL}" rel="stylesheet">
    
    <!-- Custom Styles -->
    <style>
        body {{
            margin: 0;
            padding: 0;
        }}
        
        .redoc {{
            min-height: 100vh;
        }}
        
        /* Loading overlay */
        #loading {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #f8f9fa;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.3s ease;
        }}
        
        #loading.hidden {{
            opacity: 0;
            pointer-events: none;
        }}
        
        .spinner {{
            width: 50px;
            height: 50px;
            border: 4px solid #e0e0e0;
            border-top-color: {theme_config['colors']['primary']['main']};
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }}
        
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        
        /* Custom header */
        .custom-header {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: {theme_config['colors']['primary']['main']};
            color: white;
            display: flex;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
        }}
        
        .custom-header .logo {{
            font-size: 20px;
            font-weight: bold;
        }}
        
        .custom-header .version {{
            margin-left: 20px;
            opacity: 0.8;
            font-size: 14px;
        }}
        
        .custom-header .download-btn {{
            margin-left: auto;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }}
        
        .custom-header .download-btn:hover {{
            background: rgba(255,255,255,0.3);
        }}
        
        /* Adjust redoc container for custom header */
        #redoc-container {{
            margin-top: 60px;
        }}
    </style>
</head>
<body>
    <!-- Loading Overlay -->
    <div id="loading">
        <div class="spinner"></div>
    </div>
    
    <!-- Custom Header -->
    <div class="custom-header">
        <div class="logo">{self.brand_name} API Docs</div>
        <div class="version">v1.0</div>
        <button class="download-btn" onclick="downloadSpec()">Download Spec</button>
    </div>
    
    <!-- ReDoc Container -->
    <div id="redoc-container"></div>
    
    <!-- ReDoc Script -->
    <script src="{self.REDOC_JS_URL}"></script>
    
    <script>
        // Theme configuration
        const themeConfig = {json.dumps(theme_config, indent=4)};
        
        // OpenAPI specification
        {f'const openApiSpec = {embedded_spec};' if embedded_spec else 'const openApiSpec = null;'}
        
        // Initialize ReDoc
        const initRedoc = () => {{
            const options = {{
                theme: themeConfig,
                expandResponses: '200,201',
                requiredPropsFirst: true,
                sortPropsAlphabetically: true,
                hideDownloadButton: false,
                hideHostname: false,
                expandOneSchemaPerOperation: true,
                scrollYOffset: 60
            }};
            
            {'Redoc.init(openApiSpec, document.getElementById("redoc-container"), options);' if embedded_spec else f'Redoc.init("{self.spec_url}", document.getElementById("redoc-container"), options);'}
            
            // Hide loading
            setTimeout(() => {{
                document.getElementById('loading').classList.add('hidden');
            }}, 500);
        }};
        
        // Download spec as JSON
        const downloadSpec = () => {{
            if (openApiSpec) {{
                const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], {{type: 'application/json'}});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'openapi.json';
                a.click();
                URL.revokeObjectURL(url);
            }} else if (window.specUrl) {{
                fetch(window.specUrl)
                    .then(r => r.json())
                    .then(spec => {{
                        const blob = new Blob([JSON.stringify(spec, null, 2)], {{type: 'application/json'}});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'openapi.json';
                        a.click();
                        URL.revokeObjectURL(url);
                    }});
            }}
        }};
        
        // Initialize on load
        document.addEventListener('DOMContentLoaded', initRedoc);
    </script>
</body>
</html>
"""
        return html
    
    def _get_theme_config(self) -> Dict[str, Any]:
        """Get theme configuration based on selected theme"""
        if self.theme == "dark":
            return {
                "colors": {
                    "primary": {
                        "main": "#ff6b35"
                    },
                    "success": {
                        "main": "#4caf50"
                    },
                    "warning": {
                        "main": "#ff9800"
                    },
                    "error": {
                        "main": "#f44336"
                    },
                    "text": {
                        "primary": "#ffffff"
                    },
                    "border": {
                        "color": "#333"
                    }
                },
                "sidebar": {
                    "backgroundColor": "#1a1a1a",
                    "textColor": "#ffffff"
                },
                "rightPanel": {
                    "backgroundColor": "#2a2a2a",
                    "textColor": "#ffffff"
                }
            }
        else:  # light theme
            return {
                "colors": {
                    "primary": {
                        "main": "#ff6b35"
                    },
                    "success": {
                        "main": "#4caf50"
                    },
                    "warning": {
                        "main": "#ff9800"
                    },
                    "error": {
                        "main": "#f44336"
                    },
                    "text": {
                        "primary": "#333333"
                    }
                },
                "sidebar": {
                    "backgroundColor": "#ffffff",
                    "textColor": "#333333"
                },
                "rightPanel": {
                    "backgroundColor": "#f8f9fa",
                    "textColor": "#333333"
                }
            }
    
    def save_html(self, file_path: str, spec_file: Optional[str] = None, spec_data: Optional[Dict[str, Any]] = None) -> None:
        """
        Save ReDoc HTML to file
        
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
        Generate standalone ReDoc documentation with embedded spec
        
        Args:
            spec_data: OpenAPI specification data
            output_path: Path to save the HTML file
        """
        self.save_html(output_path, spec_data=spec_data)


class ReDocWithSearch(ReDocUI):
    """ReDoc UI with search functionality"""
    
    def generate_html(
        self,
        spec_file: Optional[str] = None,
        spec_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate ReDoc HTML with search"""
        base_html = super().generate_html(spec_file, spec_data)
        
        # Add search functionality
        search_script = '''
        <script>
            // Search functionality
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search endpoints...';
            searchInput.style.cssText = `
                margin-left: 20px;
                padding: 6px 12px;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                background: rgba(255,255,255,0.1);
                color: white;
                font-size: 14px;
            `;
            
            document.querySelector('.custom-header').appendChild(searchInput);
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                // Implement search logic here
                console.log('Searching for:', query);
            });
        </script>
        '''
        
        # Insert before closing body tag
        html = base_html.replace('</body>', search_script + '</body>')
        
        return html


class ReDocWithThemeToggle(ReDocUI):
    """ReDoc UI with theme toggle"""
    
    def __init__(
        self,
        spec_url: Optional[str] = None,
        brand_name: str = "BarberZap",
        logo_url: Optional[str] = None,
        theme: str = "light"
    ):
        super().__init__(spec_url, brand_name, logo_url, theme)
        self.themes = {
            'light': self._get_light_theme(),
            'dark': self._get_dark_theme()
        }
    
    def _get_light_theme(self) -> Dict[str, Any]:
        """Get light theme configuration"""
        return self._get_theme_config()
    
    def _get_dark_theme(self) -> Dict[str, Any]:
        """Get dark theme configuration"""
        original_theme = self.theme
        self.theme = "dark"
        dark_theme = self._get_theme_config()
        self.theme = original_theme
        return dark_theme
    
    def generate_html(
        self,
        spec_file: Optional[str] = None,
        spec_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate ReDoc HTML with theme toggle"""
        base_html = super().generate_html(spec_file, spec_data)
        
        theme_toggle_script = '''
        <script>
            // Theme toggle functionality
            const themeToggle = document.createElement('button');
            themeToggle.innerHTML = '🌓';
            themeToggle.title = 'Toggle theme';
            themeToggle.className = 'download-btn';
            themeToggle.style.marginLeft = '10px';
            themeToggle.style.fontSize = '16px';
            
            let isDark = false;
            const themes = ''' + json.dumps(self.themes) + ''';
            
            themeToggle.addEventListener('click', () => {
                isDark = !isDark;
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                // Re-initialize ReDoc with new theme
                location.reload();
            });
            
            document.querySelector('.custom-header').appendChild(themeToggle);
        </script>
        '''
        
        # Insert before closing body tag
        html = base_html.replace('</body>', theme_toggle_script + '</body>')
        
        return html


def generate_redoc_docs(
    spec_data: Dict[str, Any],
    output_path: str,
    brand_name: str = "BarberZap",
    theme: str = "light",
    with_search: bool = False,
    with_theme_toggle: bool = False
) -> None:
    """
    Convenience function to generate ReDoc documentation
    
    Args:
        spec_data: OpenAPI specification data
        output_path: Path to save the HTML file
        brand_name: Brand name for documentation
        theme: Color theme (light/dark)
        with_search: Include search functionality
        with_theme_toggle: Include theme toggle button
    """
    if with_theme_toggle:
        generator = ReDocWithThemeToggle(brand_name=brand_name, theme=theme)
    elif with_search:
        generator = ReDocWithSearch(brand_name=brand_name, theme=theme)
    else:
        generator = ReDocUI(brand_name=brand_name, theme=theme)
    
    generator.save_html(output_path, spec_data=spec_data)
