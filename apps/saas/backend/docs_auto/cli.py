"""
CLI commands for API Documentation Generator
"""

import click
import json
import asyncio
from pathlib import Path
from typing import Optional
import logging
from datetime import datetime

# Import all generators
from .api_parser import APIParser
from .openapi_generator import OpenAPIGenerator
from .redoc_ui import generate_redoc_docs
from .swagger_ui import generate_swagger_docs
from .postman_collection_generator import PostmanCollectionGenerator, generate_environment_file, save_environment_file
from .typescript_fetch_generator import generate_typescript_api_client, generate_typescript_interfaces
from .docs_builder import DocsBuilder, WatchDocsBuilder
from .version_manager import VersionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# CLI Group
@click.group()
def cli():
    """BarberZap API Documentation Generator CLI"""
    pass


@cli.command()
@click.option(
    '--app-path',
    type=click.Path(exists=True),
    help='Path to FastAPI app module (e.g., backend.app:app)'
)
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Output directory for documentation'
)
@click.option(
    '--changes',
    default='',
    help='Description of changes for version tracking'
)
@click.option(
    '--watch',
    is_flag=True,
    help='Enable watch mode for auto-rebuild'
)
def generate(
    app_path: Optional[str],
    output_dir: str,
    changes: str,
    watch: bool
):
    """Generate all documentation (OpenAPI spec, ReDoc, Swagger, Postman, TypeScript)"""
    
    # Import FastAPI app if provided
    app = None
    if app_path:
        try:
            module_path, app_name = app_path.rsplit(':', 1)
            import importlib.util
            spec = importlib.util.spec_from_file_location("app_module", module_path.replace('.', '/') + '.py')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            app = getattr(module, app_name)
            logger.info(f"Loaded FastAPI app from {app_path}")
        except Exception as e:
            logger.error(f"Failed to load FastAPI app: {e}")
            logger.info("Will work with existing OpenAPI spec or require manual input")
    
    # Initialize version manager if database is available
    version_manager = None
    try:
        version_manager = VersionManager(db_url="postgresql://user:pass@localhost/barber")
    except Exception as e:
        logger.warning(f"Could not initialize version manager: {e}")
    
    # Create builder
    builder = DocsBuilder(output_dir=output_dir, app=app, version_manager=version_manager)
    
    if watch:
        # Watch mode
        watch_builder = WatchDocsBuilder(
            output_dir=output_dir,
            app=app,
            version_manager=version_manager,
            watch_files=list(Path('/root/barber/backend').rglob('*.py'))
        )
        logger.info("Starting watch mode (Ctrl+C to stop)...")
        try:
            asyncio.run(watch_builder.watch_and_rebuild())
        except KeyboardInterrupt:
            logger.info("Watch mode stopped")
    else:
        # Single build
        result = builder.build_all(changes=changes)
        
        if result['success']:
            click.echo(click.style("✓ Documentation generated successfully!", fg='green', bold=True))
            click.echo(f"  Build time: {result.get('build_time', 0):.2f}s")
            click.echo(f"  Files generated: {len(result['files_generated'])}")
            
            if 'version' in result:
                click.echo(f"  Version: {result['version']['version']}")
            
            # Show stats
            stats = builder.get_stats()
            click.echo(f"  Endpoints: {stats.get('endpoints', 0)}")
            click.echo(f"  Tags: {len(stats.get('tags', {}))}")
            
            click.echo(f"\n  Output directory: {output_dir}")
            click.echo(f"  Open docs: file://{output_dir}/index.html")
        else:
            click.echo(click.style("✗ Documentation generation failed!", fg='red', bold=True))
            for error in result.get('errors', []):
                click.echo(f"  Error: {error}")
            raise click.ClickException("Documentation generation failed")


@cli.command()
@click.option(
    '--app-path',
    type=click.Path(exists=True),
    help='Path to FastAPI app module'
)
@click.option(
    '--output',
    default='/root/barber/docs_output/specs/openapi.json',
    help='Output file path'
)
def openapi(app_path: Optional[str], output: str):
    """Generate OpenAPI specification only"""
    
    # Load app if provided
    app = None
    if app_path:
        try:
            module_path, app_name = app_path.rsplit(':', 1)
            import importlib.util
            spec = importlib.util.spec_from_file_location("app_module", module_path.replace('.', '/') + '.py')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            app = getattr(module, app_name)
        except Exception as e:
            logger.error(f"Failed to load FastAPI app: {e}")
    
    if app:
        parser = APIParser(app)
        api_data = parser.parse_all_routes()
    else:
        # Try to load existing OpenAPI spec
        click.echo("No app provided, cannot generate OpenAPI spec")
        return
    
    generator = OpenAPIGenerator()
    spec = generator.generate_openapi_spec(api_data)
    
    # Save spec
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if output_path.suffix == '.yaml':
        generator.save_openapi_yaml(str(output_path), spec)
    else:
        generator.save_openapi_spec(str(output_path), spec)
    
    # Validate
    validation = generator.validate_openapi_spec(spec)
    
    click.echo(click.style("✓ OpenAPI specification generated!", fg='green'))
    click.echo(f"  Output: {output}")
    click.echo(f"  Endpoints: {generator.get_endpoint_count(spec)}")
    click.echo(f"  Tags: {len(generator.get_tag_summary(spec))}")
    
    if validation['warnings']:
        click.echo("\n  Warnings:")
        for warning in validation['warnings']:
            click.echo(f"    - {warning}")
    
    if not validation['valid']:
        click.echo(click.style("\n  Errors:", fg='red'))
        for error in validation['errors']:
            click.echo(f"    - {error}")


@cli.command()
@click.option(
    '--spec',
    type=click.Path(exists=True),
    default='/root/barber/docs_output/specs/openapi.json',
    help='OpenAPI spec file path'
)
@click.option(
    '--output',
    default='/root/barber/docs_output/redoc/index.html',
    help='Output HTML file path'
)
@click.option(
    '--theme',
    type=click.Choice(['light', 'dark']),
    default='light',
    help='Color theme'
)
@click.option(
    '--toggle',
    is_flag=True,
    help='Include theme toggle button'
)
def redoc(spec: str, output: str, theme: str, toggle: bool):
    """Generate ReDoc UI only"""
    
    # Load OpenAPI spec
    with open(spec) as f:
        spec_data = json.load(f)
    
    generate_redoc_docs(
        spec_data=spec_data,
        output_path=output,
        brand_name="BarberZap",
        theme=theme,
        with_theme_toggle=toggle
    )
    
    click.echo(click.style("✓ ReDoc documentation generated!", fg='green'))
    click.echo(f"  Output: {output}")
    click.echo(f"  Theme: {theme}")


@cli.command()
@click.option(
    '--spec',
    type=click.Path(exists=True),
    default='/root/barber/docs_output/specs/openapi.json',
    help='OpenAPI spec file path'
)
@click.option(
    '--output',
    default='/root/barber/docs_output/swagger/index.html',
    help='Output HTML file path'
)
@click.option(
    '--theme',
    type=click.Choice(['light', 'dark']),
    default='light',
    help='Color theme'
)
@click.option(
    '--auth',
    is_flag=True,
    help='Include enhanced authentication support'
)
def swagger(spec: str, output: str, theme: str, auth: bool):
    """Generate Swagger UI only"""
    
    # Load OpenAPI spec
    with open(spec) as f:
        spec_data = json.load(f)
    
    generate_swagger_docs(
        spec_data=spec_data,
        output_path=output,
        brand_name="BarberZap",
        theme=theme,
        with_auth=auth
    )
    
    click.echo(click.style("✓ Swagger UI documentation generated!", fg='green'))
    click.echo(f"  Output: {output}")
    click.echo(f"  Theme: {theme}")


@cli.command()
@click.option(
    '--spec',
    type=click.Path(exists=True),
    default='/root/barber/docs_output/specs/openapi.json',
    help='OpenAPI spec file path'
)
@click.option(
    '--output',
    default='/root/barber/docs_output/postman/barberzap_collection.json',
    help='Output collection file path'
)
@click.option(
    '--env',
    default='/root/barber/docs_output/postman/barberzap_environment.json',
    help='Output environment file path'
)
def postman(spec: str, output: str, env: str):
    """Generate Postman collection only"""
    
    # Load OpenAPI spec
    with open(spec) as f:
        spec_data = json.load(f)
    
    # Generate collection
    generator = PostmanCollectionGenerator()
    generator.generate_and_save(spec_data, output)
    
    # Generate environment
    environment = generate_environment_file()
    save_environment_file(environment, env)
    
    click.echo(click.style("✓ Postman collection generated!", fg='green'))
    click.echo(f"  Collection: {output}")
    click.echo(f"  Environment: {env}")


@cli.command()
@click.option(
    '--spec',
    type=click.Path(exists=True),
    default='/root/barber/docs_output/specs/openapi.json',
    help='OpenAPI spec file path'
)
@click.option(
    '--output',
    default='/root/barber/docs_output/typescript/api_client.ts',
    help='Output TypeScript client file path'
)
@click.option(
    '--types-only',
    is_flag=True,
    help='Generate only TypeScript interfaces'
)
def typescript(spec: str, output: str, types_only: bool):
    """Generate TypeScript client only"""
    
    # Load OpenAPI spec
    with open(spec) as f:
        spec_data = json.load(f)
    
    if types_only:
        generate_typescript_interfaces(spec_data, output)
        click.echo(click.style("✓ TypeScript interfaces generated!", fg='green'))
    else:
        generate_typescript_api_client(spec_data, output)
        click.echo(click.style("✓ TypeScript client generated!", fg='green'))
    
    click.echo(f"  Output: {output}")


@cli.command()
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Output directory to watch'
)
def watch(output_dir: str):
    """Watch mode - regenerate documentation on changes"""
    
    builder = WatchDocsBuilder(
        output_dir=output_dir,
        watch_files=list(Path('/root/barber/backend').rglob('*.py'))
    )
    
    click.echo(click.style("Starting watch mode...", fg='yellow', bold=True))
    click.echo("Press Ctrl+C to stop")
    
    try:
        asyncio.run(builder.watch_and_rebuild())
    except KeyboardInterrupt:
        click.echo(click.style("\nWatch mode stopped", fg='yellow'))


@cli.command()
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Documentation output directory'
)
@click.option(
    '--target',
    default='/var/www/docs.barberzap.com',
    help='Deployment target directory'
)
def deploy(output_dir: str, target: str):
    """Deploy documentation to docs.barberzap.com"""
    
    import shutil
    
    output_path = Path(output_dir)
    target_path = Path(target)
    
    click.echo(f"Deploying documentation from {output_dir} to {target}...")
    
    try:
        # Create target directory
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Remove old deployment
        if target_path.exists():
            shutil.rmtree(target_path)
        
        # Copy documentation
        shutil.copytree(output_path, target_path)
        
        # Set permissions
        for root, dirs, files in os.walk(target_path):
            for name in dirs + files:
                os.chmod(os.path.join(root, name), 0o755)
        
        click.echo(click.style("✓ Documentation deployed successfully!", fg='green', bold=True))
        click.echo(f"  Source: {output_dir}")
        click.echo(f"  Target: {target}")
        click.echo(f"  URL: https://docs.barberzap.com")
        
    except Exception as e:
        click.echo(click.style(f"✗ Deployment failed: {e}", fg='red'))
        raise click.ClickException("Deployment failed")


@cli.command()
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Documentation output directory'
)
def validate(output_dir: str):
    """Validate generated documentation"""
    
    click.echo("Validating generated documentation...\n")
    
    builder = DocsBuilder(output_dir=output_dir)
    validation = builder.validate_output()
    
    if validation['valid']:
        click.echo(click.style("✓ Documentation is valid!", fg='green', bold=True))
    else:
        click.echo(click.style("✗ Documentation has errors!", fg='red', bold=True))
    
    if validation['errors']:
        click.echo("\nErrors:")
        for error in validation['errors']:
            click.echo(click.style(f"  ✗ {error}", fg='red'))
    
    if validation['warnings']:
        click.echo("\nWarnings:")
        for warning in validation['warnings']:
            click.echo(click.style(f"  ⚠ {warning}", fg='yellow'))
    
    # Show stats
    stats = builder.get_stats()
    click.echo(f"\nStats:")
    click.echo(f"  Endpoints: {stats.get('endpoints', 0)}")
    click.echo(f"  Tags: {len(stats.get('tags', {}))}")
    click.echo(f"  Schemas: {stats.get('schemas', 0)}")
    
    if not validation['valid']:
        raise click.ClickException("Validation failed")


@cli.command()
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Documentation output directory'
)
def clean(output_dir: str):
    """Clean generated documentation"""
    
    import shutil
    
    output_path = Path(output_dir)
    
    if output_path.exists():
        click.echo(f"Removing documentation from {output_dir}...")
        shutil.rmtree(output_path)
    
    click.echo(click.style("✓ Documentation cleaned!", fg='green'))


@cli.command()
@click.option(
    '--output-dir',
    default='/root/barber/docs_output',
    help='Documentation output directory'
)
def stats(output_dir: str):
    """Show documentation statistics"""
    
    builder = DocsBuilder(output_dir=output_dir)
    stats = builder.get_stats()
    
    click.echo("Documentation Statistics\n")
    click.echo(f"  Endpoints: {stats.get('endpoints', 0)}")
    click.echo(f"  Tags: {len(stats.get('tags', {}))}")
    click.echo(f"  Schemas: {stats.get('schemas', 0)}")
    
    if 'tags' in stats and stats['tags']:
        click.echo("\n  Endpoints by tag:")
        for tag, count in sorted(stats['tags'].items()):
            click.echo(f"    {tag}: {count}")
    
    if 'build_info' in stats and stats['build_info']:
        build_info = stats['build_info']
        click.echo(f"\n  Last build:")
        click.echo(f"    Time: {build_info.get('timestamp', 'N/A')}")
        click.echo(f"    Duration: {build_info.get('build_time', 0):.2f}s")
        click.echo(f"    Spec hash: {build_info.get('spec_hash', 'N/A')[:16]}...")


@cli.command()
def version():
    """Show version information"""
    
    version_info = {
        "name": "BarberZap API Documentation Generator",
        "version": "1.0.0",
        "components": [
            "API Parser",
            "OpenAPI Generator",
            "ReDoc UI",
            "Swagger UI",
            "Postman Generator",
            "TypeScript Client Generator",
            "Version Manager"
        ]
    }
    
    click.echo(f"{version_info['name']} v{version_info['version']}")
    click.echo("\nComponents:")
    for component in version_info['components']:
        click.echo(f"  • {component}")


if __name__ == '__main__':
    cli()
