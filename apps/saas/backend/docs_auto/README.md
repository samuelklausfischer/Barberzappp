# BarberZap API Documentation Generator

Automatic API documentation generation for BarberZap with FastAPI integration. Generates OpenAPI specifications, interactive documentation (ReDoc & Swagger UI), Postman collections, and TypeScript clients.

## Features

- 🚀 **Automatic API Parsing** - Extract all routes, parameters, schemas from FastAPI
- 📚 **OpenAPI 3.1 Generator** - Generate compliant specifications
- 📘 **ReDoc UI** - Beautiful, responsive documentation with search
- 🌐 **Swagger UI** - Interactive explorer with Try-It-Now
- 📬 **Postman Collections** - Auto-generated with pre-request scripts
- 💻 **TypeScript Clients** - Fully-typed fetch client generation
- 📊 **Version Tracking** - Track and compare API versions over time
- 🔍 **Watch Mode** - Auto-regenerate on code changes
- 🎨 **Theme Support** - Light and dark modes for all documentation
- 📑 **Version History** - Track changes with auto-generated changelogs

## Installation

```bash
# From the project root
cd /root/barber/backend/docs_auto

# Install dependencies
pip install -r requirements.txt
```

### Required Dependencies

```
fastapi>=0.104.0
pydantic>=2.5.0
psycopg2-binary>=2.9.0
click>=8.1.0
watchfiles>=0.21.0
```

## Quick Start

### CLI Usage

Generate all documentation:

```bash
# Generate all documentation
python -m docs_auto.cli generate \
  --app-path backend.app:app \
  --output-dir /root/barber/docs_output

# Generate only OpenAPI spec
python -m docs_auto.cli openapi \
  --app-path backend.app:app \
  --output /root/barber/docs_output/specs/openapi.json

# Generate only ReDoc
python -m docs_auto.cli redoc \
  --spec /root/barber/docs_output/specs/openapi.json \
  --output /root/barber/docs_output/redoc/index.html \
  --theme light \
  --toggle

# Generate only Swagger UI
python -m docs_auto.cli swagger \
  --spec /root/barber/docs_output/specs/openapi.json \
  --output /root/barber/docs_output/swagger/index.html \
  --theme light

# Generate Postman collection
python -m docs_auto.cli postman \
  --spec /root/barber/docs_output/specs/openapi.json \
  --output /root/barber/docs_output/postman/collection.json

# Generate TypeScript client
python -m docs_auto.cli typescript \
  --spec /root/barber/docs_output/specs/openapi.json \
  --output /root/barber/docs_output/typescript/api_client.ts

# Watch mode (auto-rebuild on changes)
python -m docs_auto.cli watch \
  --output-dir /root/barber/docs_output

# Validate generated documentation
python -m docs_auto.cli validate \
  --output-dir /root/barber/docs_output

# Show stats
python -m docs_auto.cli stats \
  --output-dir /root/barber/docs_output

# Clean generated docs
python -m docs_auto.cli clean \
  --output-dir /root/barber/docs_output
```

### Python Usage

```python
from fastapi import FastAPI
from docs_auto import (
    DocsBuilder,
    APIParser,
    OpenAPIGenerator,
    ReDocUI,
    SwaggerUI,
    PostmanCollectionGenerator,
    TypeScriptClientGenerator,
    VersionManager
)

app = FastAPI()

# Generate all documentation
builder = DocsBuilder(
    output_dir="/root/barber/docs_output",
    app=app
)
result = builder.build_all(changes="Initial documentation")
print(f"Generated {len(result['files_generated'])} files")

# Parse API only
parser = APIParser(app)
api_data = parser.parse_all_routes()
print(f"Parsed {len(api_data['endpoints'])} endpoints")

# Generate OpenAPI spec
generator = OpenAPIGenerator()
spec = generator.generate_openapi_spec(api_data)
generator.save_openapi_spec("/root/barber/specs/openapi.json", spec)

# Generate ReDoc UI
redoc = ReDocUI(brand_name="BarberZap")
redoc.save_html("/root/barber/docs/redoc.html", spec_data=spec)

# Generate Swagger UI
swagger = SwaggerUI(brand_name="BarberZap")
swagger.save_html("/root/barber/docs/swagger.html", spec_data=spec)

# Generate Postman collection
postman = PostmanCollectionGenerator()
collection = postman.generate_postman_collection(spec)
postman.save_postman_collection(collection, "/root/barber/docs/postman.json")

# Generate TypeScript client
ts_gen = TypeScriptClientGenerator()
client = ts_gen.generate_typescript_client(spec)
ts_gen.save_typescript_client(client, "/root/barber/docs/api_client.ts")

# Track version
version_manager = VersionManager(db_url="postgresql://user:pass@localhost/barber")
version_info = version_manager.track_api_version(spec, "Added new endpoints")
print(f"Tracked version: {version_info.version}")
```

### FastAPI Integration

Auto-generate docs on startup:

```python
from fastapi import FastAPI
from docs_auto import DocsBuilder, create_startup_event

app = FastAPI()

# Create builder
builder = DocsBuilder(
    output_dir="/root/barber/docs_output",
    app=app
)

# Register startup event
create_startup_event(app, builder)
```

Enable watch mode for development:

```python
import asyncio
from docs_auto import WatchDocsBuilder

# Create watch-enabled builder
watch_builder = WatchDocsBuilder(
    output_dir="/root/barber/docs_output",
    app=app,
    watch_files=list(Path("/root/barber/backend").rglob("*.py"))
)

# Start watching (usually in a separate thread/task)
async def watch_docs():
    await watch_builder.watch_and_rebuild()
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `docs generate` | Generate all documentation |
| `docs openapi` | Generate OpenAPI specification only |
| `docs redoc` | Generate ReDoc UI only |
| `docs swagger` | Generate Swagger UI only |
| `docs postman` | Generate Postman collection only |
| `docs typescript` | Generate TypeScript client only |
| `docs watch` | Watch mode - auto-regenerate on changes |
| `docs deploy` | Deploy to docs.barberzap.com |
| `docs validate` | Validate generated documentation |
| `docs stats` | Show documentation statistics |
| `docs clean` | Clean generated documentation |

## Output Structure

After running the documentation generator, you'll get:

```
docs_output/
├── index.html                    # Main index page
├── specs/
│   ├── openapi.json             # OpenAPI 3.1 spec (JSON)
│   └── openapi.yaml             # OpenAPI 3.1 spec (YAML)
├── redoc/
│   ├── index.html               # ReDoc UI (light)
│   └── dark.html                # ReDoc UI (dark)
├── swagger/
│   ├── index.html               # Swagger UI (light)
│   └── dark.html                # Swagger UI (dark)
├── postman/
│   ├── barberzap_collection.json # Postman collection
│   └── barberzap_environment.json # Postman environment
├── typescript/
│   ├── api_client.ts            # TypeScript API client
│   └── types.ts                 # TypeScript interfaces
└── build_info.json              # Build metadata
```

## React Component Usage

Import the ApiDocs component in your React app:

```tsx
import { ApiDocs } from '@/docs/ApiDocs';

function App() {
  return (
    <ApiDocs
      baseUrl="/api/docs"
      defaultView="redoc"
      defaultTheme="light"
      showVersionSelector={true}
      enableSearch={true}
      title="BarberZap API Documentation"
    />
  );
}
```

### ApiDocs Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `baseUrl` | `string` | `'/api/docs'` | Base URL for API docs |
| `defaultView` | `'redoc' \| 'swagger'` | `'redoc'` | Default documentation view |
| `defaultTheme` | `'light' \| 'dark'` | `'light'` | Default theme |
| `showVersionSelector` | `boolean` | `true` | Show version dropdown |
| `enableSearch` | `boolean` | `true` | Enable search functionality |
| `title` | `string` | `'BarberZap API Documentation'` | Documentation title |

## Version Management

Track API versions and generate changelogs:

```python
from docs_auto import VersionManager

# Initialize
vm = VersionManager(
    storage_path="/root/barber/docs_output/versions",
    db_url="postgresql://user:pass@localhost/barber"
)

# Track a new version
version_info = vm.track_api_version(
    spec=api_spec,
    changes="Added user endpoints and fixed authentication"
)
print(f"Version {version_info.version} tracked")

# Get latest version
latest = vm.get_latest_version()
print(f"Latest: v{latest.version}")

# Get specific version
v1 = vm.get_version("1.0.0")

# Get version history
history = vm.get_version_history(limit=10)

# Compare versions
diff = vm.compare_versions("1.0.0", "1.1.0")
print(diff)

# Get changelog
changelog = vm.get_changelog("1.0.0", "1.1.0")
print(changelog)

# Archive old versions
vm.archive_old_versions(keep_count=10)
```

### Database Setup

Run the database migration:

```bash
# Apply migration
psql -U postgres -d barber -f /root/barber/database/21_api_versions.sql
```

The migration creates:
- `api_versions` table with full spec storage
- Auto-populating triggers for stats
- Version comparison functions
- Changelog generation

## Customization

### Custom OpenAPI Configuration

```python
from docs_auto import OpenAPIGenerator

config = {
    "openapi": "3.1.0",
    "info": {
        "title": "BarberZap API",
        "version": "2.0.0",
        "description": "Custom description"
    },
    "servers": [
        {"url": "https://api.barberzap.com", "description": "Production"}
    ],
    "components": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer"
            }
        }
    }
}

generator = OpenAPIGenerator(config)
```

### Custom ReDoc Theme

```python
from docs_auto import ReDocUIWithThemeToggle

redoc = ReDocUIWithThemeToggle(
    brand_name="My Brand",
    logo_url="https://example.com/logo.png",
    theme="dark"
)
```

### Custom TypeScript Client

```python
from docs_auto import TypeScriptClientGenerator

generator = TypeScriptClientGenerator(
    client_name="MyApiClient",
    base_url="https://api.myapp.com"
)
```

## Deployment

### Serve Static Files with Nginx

```nginx
server {
    listen 80;
    server_name docs.barberzap.com;

    location / {
        root /var/www/docs.barberzap.com;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # CORS support
    add_header Access-Control-Allow-Origin *;
}
```

### Deploy via CLI

```bash
# Build and deploy
python -m docs_auto.cli generate \
  --app-path backend.app:app \
  --output-dir /root/barber/docs_output

python -m docs_auto.cli deploy \
  --output-dir /root/barber/docs_output \
  --target /var/www/docs.barberzap.com
```

### CI/CD Integration

```yaml
# .github/workflows/docs.yml
name: Generate API Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Generate docs
        run: |
          python -m docs_auto.cli generate \
            --app-path backend.app:app \
            --output-dir ./docs_output
      
      - name: Deploy to documentation site
        run: |
          python -m docs_auto.cli deploy \
            --output-dir ./docs_output \
            --target /var/www/docs.barberzap.com
```

## Troubleshooting

### FastAPI not found error

```bash
# Ensure the app-path is correct
python -m docs_auto.cli generate --app-path backend.main:app
```

### Database connection errors

```python
# Check database URL and credentials
vm = VersionManager(db_url="postgresql://user:password@host:port/database")
```

### Type generation issues

```python
# Ensure Pydantic models are properly defined
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    
    class Config:
        json_schema_extra = {
            "example": {"id": 1, "name": "John Doe"}
        }
```

## Examples

See the `/root/barber/backend/docs_auto/examples/` directory for:
- Basic generation examples
- Custom theme examples
- Version tracking examples
- CLI integration examples
- FastAPI startup integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/barberzap/barber/issues
- Documentation: https://docs.barberzap.com
- Email: api@barberzap.com

## Version

Current version: **1.0.0**

See CHANGELOG.md for version history.
