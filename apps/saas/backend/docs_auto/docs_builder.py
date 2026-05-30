"""
Docs Builder - Pipeline for building complete API documentation
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import asyncio
from datetime import datetime
import logging

from .api_parser import APIParser
from .openapi_generator import OpenAPIGenerator
from .redoc_ui import ReDocUI, ReDocWithThemeToggle, generate_redoc_docs
from .swagger_ui import SwaggerUI, SwaggerUIWithAuth, generate_swagger_docs
from .postman_collection_generator import PostmanCollectionGenerator, generate_environment_file, save_environment_file
from .typescript_fetch_generator import TypeScriptClientGenerator, generate_typescript_api_client, generate_typescript_interfaces
from .version_manager import VersionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocsBuilder:
    """Pipeline for building complete API documentation"""
    
    def __init__(
        self,
        output_dir: str = "/root/barber/docs_output",
        app=None,
        version_manager: Optional[VersionManager] = None
    ):
        """
        Initialize docs builder pipeline
        
        Args:
            output_dir: Directory to output documentation
            app: FastAPI application instance
            version_manager: Version manager instance (optional)
        """
        self.output_dir = Path(output_dir)
        self.app = app
        self.version_manager = version_manager
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / "redoc").mkdir(exist_ok=True)
        (self.output_dir / "swagger").mkdir(exist_ok=True)
        (self.output_dir / "postman").mkdir(exist_ok=True)
        (self.output_dir / "typescript").mkdir(exist_ok=True)
        (self.output_dir / "specs").mkdir(exist_ok=True)
        
        self.parsers = {
            "api_parser": None,
            "openapi_generator": OpenAPIGenerator(),
            "redoc_ui": ReDocUI(),
            "swagger_ui": SwaggerUI(),
            "postman_generator": PostmanCollectionGenerator(),
            "typescript_generator": TypeScriptClientGenerator()
        }
        
        self.last_build_info = {}
    
    def build_all(self, changes: str = "") -> Dict[str, Any]:
        """
        Build all documentation
        
        Args:
            changes: Description of changes for version tracking
            
        Returns:
            Build result with information about generated files
        """
        start_time = datetime.now()
        logger.info("Starting full documentation build...")
        
        result = {
            "success": False,
            "files_generated": [],
            "errors": [],
            "build_time": None,
            "spec_hash": None
        }
        
        try:
            # Step 1: Parse API routes
            api_data = self.parse_api()
            
            # Step 2: Generate OpenAPI spec
            openapi_spec = self.generate_openapi_spec(api_data)
            spec_hash = self.parsers["openapi_generator"].get_spec_hash(openapi_spec)
            result["spec_hash"] = spec_hash
            
            # Save OpenAPI spec
            spec_path = self.output_dir / "specs" / "openapi.json"
            self.parsers["openapi_generator"].save_openapi_spec(str(spec_path), openapi_spec)
            result["files_generated"].append(str(spec_path))
            
            # Save YAML spec
            spec_yaml_path = self.output_dir / "specs" / "openapi.yaml"
            self.parsers["openapi_generator"].save_openapi_yaml(str(spec_yaml_path), openapi_spec)
            result["files_generated"].append(str(spec_yaml_path))
            
            # Step 3: Generate ReDoc UI
            redoc_files = self.generate_redoc(openapi_spec)
            result["files_generated"].extend(redoc_files)
            
            # Step 4: Generate Swagger UI
            swagger_files = self.generate_swagger(openapi_spec)
            result["files_generated"].extend(swagger_files)
            
            # Step 5: Generate Postman collection
            postman_files = self.generate_postman(openapi_spec)
            result["files_generated"].extend(postman_files)
            
            # Step 6: Generate TypeScript client
            typescript_files = self.generate_typescript(openapi_spec)
            result["files_generated"].extend(typescript_files)
            
            # Step 7: Generate index page
            index_file = self.generate_index(openapi_spec)
            result["files_generated"].append(index_file)
            
            # Step 8: Track version if version manager is available
            if self.version_manager:
                version_info = self.version_manager.track_api_version(openapi_spec, changes)
                result["version"] = version_info
                logger.info(f"Tracked API version: {version_info['version']}")
            
            # Calculate build time
            build_time = (datetime.now() - start_time).total_seconds()
            result["build_time"] = build_time
            result["success"] = True
            
            # Store build info
            self.last_build_info = {
                "timestamp": datetime.now().isoformat(),
                "spec_hash": spec_hash,
                "files_generated": result["files_generated"],
                "build_time": build_time
            }
            
            # Save build info
            build_info_path = self.output_dir / "build_info.json"
            with open(build_info_path, 'w') as f:
                json.dump(self.last_build_info, f, indent=2)
            
            logger.info(f"Documentation build completed in {build_time:.2f}s")
            logger.info(f"Generated {len(result['files_generated'])} files")
            
        except Exception as e:
            logger.error(f"Documentation build failed: {e}", exc_info=True)
            result["errors"].append(str(e))
        
        return result
    
    def parse_api(self) -> Dict[str, Any]:
        """Parse API routes from FastAPI app"""
        if not self.app:
            raise ValueError("FastAPI app is required to parse API routes")
        
        parser = APIParser(self.app)
        api_data = parser.parse_all_routes()
        
        logger.info(f"Parsed {len(api_data.get('endpoints', []))} endpoints")
        logger.info(f"Found tags: {', '.join(api_data.get('tags', {}).keys())}")
        
        return api_data
    
    def generate_openapi_spec(self, api_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate OpenAPI specification"""
        generator = self.parsers["openapi_generator"]
        openapi_spec = generator.generate_openapi_spec(api_data)
        
        logger.info("Generated OpenAPI specification")
        
        return openapi_spec
    
    def generate_redoc(self, openapi_spec: Dict[str, Any]) -> List[str]:
        """Generate ReDoc documentation"""
        files = []
        
        # Generate ReDoc with light theme
        redoc_file = self.output_dir / "redoc" / "index.html"
        generate_redoc_docs(
            spec_data=openapi_spec,
            output_path=str(redoc_file),
            brand_name="BarberZap",
            theme="light",
            with_theme_toggle=True
        )
        files.append(str(redoc_file))
        
        # Generate ReDoc with dark theme
        redoc_dark_file = self.output_dir / "redoc" / "dark.html"
        generate_redoc_docs(
            spec_data=openapi_spec,
            output_path=str(redoc_dark_file),
            brand_name="BarberZap",
            theme="dark"
        )
        files.append(str(redoc_dark_file))
        
        logger.info(f"Generated ReDoc documentation (light + dark)")
        
        return files
    
    def generate_swagger(self, openapi_spec: Dict[str, Any]) -> List[str]:
        """Generate Swagger UI documentation"""
        files = []
        
        # Generate Swagger UI
        swagger_file = self.output_dir / "swagger" / "index.html"
        generate_swagger_docs(
            spec_data=openapi_spec,
            output_path=str(swagger_file),
            brand_name="BarberZap",
            theme="light",
            with_auth=True
        )
        files.append(str(swagger_file))
        
        # Generate Swagger UI with dark theme
        swagger_dark_file = self.output_dir / "swagger" / "dark.html"
        generate_swagger_docs(
            spec_data=openapi_spec,
            output_path=str(swagger_dark_file),
            brand_name="BarberZap",
            theme="dark",
            with_auth=True
        )
        files.append(str(swagger_dark_file))
        
        logger.info(f"Generated Swagger UI documentation (light + dark)")
        
        return files
    
    def generate_postman(self, openapi_spec: Dict[str, Any]) -> List[str]:
        """Generate Postman collection"""
        files = []
        
        # Generate collection
        collection_file = self.output_dir / "postman" / "barberzap_collection.json"
        generator = self.parsers["postman_generator"]
        generator.generate_and_save(openapi_spec, str(collection_file))
        files.append(str(collection_file))
        
        # Generate environment
        env_file = self.output_dir / "postman" / "barberzap_environment.json"
        environment = generate_environment_file()
        save_environment_file(environment, str(env_file))
        files.append(str(env_file))
        
        logger.info("Generated Postman collection and environment")
        
        return files
    
    def generate_typescript(self, openapi_spec: Dict[str, Any]) -> List[str]:
        """Generate TypeScript client"""
        files = []
        
        # Generate full client
        client_file = self.output_dir / "typescript" / "api_client.ts"
        generate_typescript_api_client(openapi_spec, str(client_file))
        files.append(str(client_file))
        
        # Generate interfaces only
        interfaces_file = self.output_dir / "typescript" / "types.ts"
        generate_typescript_interfaces(openapi_spec, str(interfaces_file))
        files.append(str(interfaces_file))
        
        logger.info("Generated TypeScript client and interfaces")
        
        return files
    
    def generate_index(self, openapi_spec: Dict[str, Any]) -> str:
        """Generate documentation index page"""
        spec_info = openapi_spec.get("info", {})
        title = spec_info.get("title", "API Documentation")
        version = spec_info.get("version", "1.0.0")
        description = spec_info.get("description", "")
        
        endpoint_count = self.parsers["openapi_generator"].get_endpoint_count(openapi_spec)
        tag_summary = self.parsers["openapi_generator"].get_tag_summary(openapi_spec)
        
        index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} v{version}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        
        .header {{
            background: #ff6b35;
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 32px;
            margin-bottom: 10px;
        }}
        
        .header .version {{
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 10px;
        }}
        
        .header .stats {{
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }}
        
        .stat {{
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 8px;
        }}
        
        .stat .value {{
            font-size: 24px;
            font-weight: bold;
        }}
        
        .stat .label {{
            font-size: 12px;
            opacity: 0.8;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .section {{
            margin-bottom: 40px;
        }}
        
        .section h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }}
        
        .card-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }}
        
        .card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ff6b35;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        
        .card h3 {{
            color: #ff6b35;
            margin-bottom: 10px;
            font-size: 18px;
        }}
        
        .card p {{
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
        }}
        
        .card a {{
            display: inline-block;
            color: #ff6b35;
            text-decoration: none;
            font-weight: 500;
        }}
        
        .card a:hover {{
            text-decoration: underline;
        }}
        
        .tag-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }}
        
        .tag {{
            background: #e9ecef;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            color: #495057;
        }}
        
        .tag .count {{
            background: #ff6b35;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 5px;
            font-size: 12px;
        }}
        
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
            <div class="version">Version {version}</div>
            <p style="opacity: 0.9; max-width: 600px; margin: 0 auto;">{description}</p>
            <div class="stats">
                <div class="stat">
                    <div class="value">{endpoint_count}</div>
                    <div class="label">Endpoints</div>
                </div>
                <div class="stat">
                    <div class="value">{len(tag_summary)}</div>
                    <div class="label">Tags</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Documentation Views</h2>
                <div class="card-grid">
                    <div class="card">
                        <h3>📘 ReDoc</h3>
                        <p>Clean, responsive API documentation with powerful search</p>
                        <a href="redoc/index.html">View ReDoc (Light)</a> |
                        <a href="redoc/dark.html">View ReDoc (Dark)</a>
                    </div>
                    <div class="card">
                        <h3>🚀 Swagger UI</h3>
                        <p>Interactive API explorer with Try-It-Now</p>
                        <a href="swagger/index.html">View Swagger (Light)</a> |
                        <a href="swagger/dark.html">View Swagger (Dark)</a>
                    </div>
                    <div class="card">
                        <h3>📥 Download Specs</h3>
                        <p>Download OpenAPI specification files</p>
                        <a href="specs/openapi.json">OpenAPI JSON</a> |
                        <a href="specs/openapi.yaml">OpenAPI YAML</a>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Developer Tools</h2>
                <div class="card-grid">
                    <div class="card">
                        <h3>📬 Postman Collection</h3>
                        <p>Import to Postman for API testing</p>
                        <a href="postman/barberzap_collection.json">Download Collection</a> |
                        <a href="postman/barberzap_environment.json">Download Environment</a>
                    </div>
                    <div class="card">
                        <h3>📘 TypeScript Client</h3>
                        <p>Fully-typed TypeScript API client</p>
                        <a href="typescript/api_client.ts">Download Client</a> |
                        <a href="typescript/types.ts">Download Types</a>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>API Tags</h2>
                <div class="tag-list">
"""
        
        for tag, count in sorted(tag_summary.items()):
            index_html += f"""
                    <div class="tag">{tag}<span class="count">{count}</span></div>
"""
        
        index_html += f"""
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | BarberZap API Documentation Generator</p>
        </div>
    </div>
</body>
</html>
"""
        
        index_file = self.output_dir / "index.html"
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(index_html)
        
        logger.info("Generated documentation index page")
        
        return str(index_file)
    
    def validate_output(self) -> Dict[str, Any]:
        """Validate generated documentation"""
        validation = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Check required files exist
        required_files = [
            "index.html",
            "specs/openapi.json",
            "redoc/index.html",
            "swagger/index.html",
            "postman/barberzap_collection.json",
            "typescript/api_client.ts"
        ]
        
        for file_path in required_files:
            full_path = self.output_dir / file_path
            if not full_path.exists():
                validation["errors"].append(f"Missing file: {file_path}")
                validation["valid"] = False
        
        # Validate OpenAPI spec
        spec_path = self.output_dir / "specs" / "openapi.json"
        if spec_path.exists():
            with open(spec_path) as f:
                spec = json.load(f)
            
            generator = OpenAPIGenerator()
            spec_validation = generator.validate_openapi_spec(spec)
            validation["warnings"].extend(spec_validation["warnings"])
            if not spec_validation["valid"]:
                validation["errors"].extend(spec_validation["errors"])
                validation["valid"] = False
        
        return validation
    
    def get_stats(self) -> Dict[str, Any]:
        """Get documentation statistics"""
        spec_path = self.output_dir / "specs" / "openapi.json"
        
        if not spec_path.exists():
            return {
                "endpoints": 0,
                "tags": 0,
                "schemas": 0,
                "files": []
            }
        
        with open(spec_path) as f:
            spec = json.load(f)
        
        generator = OpenAPIGenerator()
        
        return {
            "endpoints": generator.get_endpoint_count(spec),
            "tags": generator.get_tag_summary(spec),
            "schemas": len(spec.get("components", {}).get("schemas", {})),
            "build_info": self.last_build_info
        }
    
    def clean(self) -> None:
        """Clean generated documentation"""
        import shutil
        
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / "redoc").mkdir(exist_ok=True)
        (self.output_dir / "swagger").mkdir(exist_ok=True)
        (self.output_dir / "postman").mkdir(exist_ok=True)
        (self.output_dir / "typescript").mkdir(exist_ok=True)
        (self.output_dir / "specs").mkdir(exist_ok=True)
        
        logger.info("Cleaned generated documentation")


class WatchDocsBuilder(DocsBuilder):
    """Docs builder with auto-rebuild on file changes"""
    
    def __init__(self, *args, watch_files: Optional[List[str]] = None, **kwargs):
        """
        Initialize watch-enabled docs builder
        
        Args:
            watch_files: List of files to watch for changes
        """
        super().__init__(*args, **kwargs)
        self.watch_files = watch_files or []
        
    async def watch_and_rebuild(self, delay: int = 2) -> None:
        """
        Watch for file changes and rebuild documentation
        
        Args:
            delay: Delay in seconds before rebuilding after change
        """
        from watchfiles import awatch
        
        logger.info(f"Starting watch mode for {len(self.watch_files)} files...")
        
        async for changes in awatch(*self.watch_files):
            logger.info(f"Detected {len(changes)} file changes, rebuilding...")
            
            # Wait for file system to settle
            await asyncio.sleep(delay)
            
            try:
                self.build_all(changes="Auto-rebuild from file changes")
            except Exception as e:
                logger.error(f"Auto-rebuild failed: {e}")


def create_startup_event(app, builder: DocsBuilder):
    """Create FastAPI startup event for auto-generating docs"""
    @app.on_event("startup")
    async def startup():
        logger.info("Auto-generating API documentation on startup...")
        try:
            builder.build_all("API startup")
        except Exception as e:
            logger.error(f"Failed to auto-generate docs: {e}")
    
    return startup
