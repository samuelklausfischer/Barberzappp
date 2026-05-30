"""
Quickstart Example - API Documentation Generator
Shows basic usage of the documentation generator
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

# Import documentation generators
from docs_auto import (
    DocsBuilder,
    APIParser,
    OpenAPIGenerator,
    ReDocUI,
    SwaggerUI,
    PostmanCollectionGenerator,
    TypeScriptClientGenerator,
    create_startup_event
)

# ===== FastAPI App Setup =====

app = FastAPI(
    title="BarberZap API",
    description="Complete barber shop management system",
    version="1.0.0"
)

# ===== Example Pydantic Models =====

class BarberBase(BaseModel):
    name: str
    email: str
    phone: str

class BarberCreate(BarberBase):
    shop_id: str

class Barber(BarberBase):
    id: str
    shop_id: str
    is_active: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-123",
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1-555-1234",
                "shop_id": "shop-uuid",
                "is_active": True
            }
        }

# ===== Example Endpoints =====

@app.get("/barbers", tags=["barbers"])
async def list_barbers(shop_id: Optional[str] = None, limit: int = 50):
    """
    List all barbers
    
    Args:
        shop_id: Filter by shop ID
        limit: Maximum number of results
    
    Returns:
        List of barbers
    """
    return {"barbers": [], "total": 0}

@app.post("/barbers", tags=["barbers"])
async def create_barber(barber: BarberCreate) -> Barber:
    """
    Create a new barber
    
    Args:
        barber: Barber data
    
    Returns:
        Created barber with ID
    """
    return Barber(
        id="new-uuid",
        **barber.dict()
    )

@app.get("/barbers/{barber_id}", tags=["barbers"])
async def get_barber(barber_id: str) -> Barber:
    """
    Get barber by ID
    
    Args:
        barber_id: Barber UUID
    
    Returns:
        Barber details
    """
    if barber_id == "not-found":
        raise HTTPException(status_code=404, detail="Barber not found")
    
    return Barber(
        id=barber_id,
        name="John Doe",
        email="john@example.com",
        phone="+1-555-1234",
        shop_id="shop-uuid"
    )

@app.get("/shops/{shop_id}/barbers", tags=["shops"])
async def get_shop_barbers(shop_id: str, limit: int = 50):
    """
    Get all barbers for a shop
    
    Args:
        shop_id: Shop UUID
        limit: Maximum number of results
    """
    return {"barbers": [], "total": 0}


# ===== Documentation Generation =====

# Option 1: Auto-generate on startup
# This will automatically build all docs when the FastAPI app starts
builder = DocsBuilder(
    output_dir="/root/barber/docs_output",
    app=app
)
create_startup_event(app, builder)


# ===== Manual Generation Examples =====

def parse_and_inspect_api():
    """Example: Parse API routes and inspect"""
    parser = APIParser(app)
    api_data = parser.parse_all_routes()
    
    print(f"Endpoints found: {len(api_data['endpoints'])}")
    print(f"Tags: {list(api_data['tags'].keys())}")
    
    # Get routes by tag
    barbers_routes = parser.get_routes_by_tag("barbers")
    print(f"\nBarber routes: {len(barbers_routes)}")
    for route in barbers_routes:
        print(f"  {route['methods']}: {route['path']}")


def generate_openapi_spec():
    """Example: Generate OpenAPI specification"""
    parser = APIParser(app)
    api_data = parser.parse_all_routes()
    
    generator = OpenAPIGenerator()
    spec = generator.generate_openapi_spec(api_data)
    
    # Save to file
    generator.save_openapi_spec("/root/barber/openapi.json", spec)
    print("✓ OpenAPI spec saved to /root/barber/openapi.json")
    
    # Validate
    validation = generator.validate_openapi_spec(spec)
    print(f"Valid: {validation['valid']}")
    if validation['warnings']:
        for warning in validation['warnings']:
            print(f"  Warning: {warning}")


def generate_documentation_html():
    """Example: Generate ReDoc and Swagger UI"""
    parser = APIParser(app)
    api_data = parser.parse_all_routes()
    
    generator = OpenAPIGenerator()
    spec = generator.generate_openapi_spec(api_data)
    
    # ReDoc
    redoc = ReDocUI(brand_name="BarberZap")
    redoc.save_html("/root/barber/redoc.html", spec_data=spec)
    print("✓ ReDoc UI saved to /root/barber/redoc.html")
    
    # Swagger UI
    swagger = SwaggerUI(brand_name="BarberZap")
    swagger.save_html("/root/barber/swagger.html", spec_data=spec)
    print("✓ Swagger UI saved to /root/barber/swagger.html")


def generate_postman_collection():
    """Example: Generate Postman collection"""
    parser = APIParser(app)
    api_data = parser.parse_all_routes()
    
    generator = OpenAPIGenerator()
    spec = generator.generate_openapi_spec(api_data)
    
    # Generate collection
    postman = PostmanCollectionGenerator()
    collection = postman.generate_postman_collection(spec)
    postman.save_postman_collection(collection, "/root/barber/postman.json")
    print("✓ Postman collection saved to /root/barber/postman.json")


def generate_typescript_client():
    """Example: Generate TypeScript client"""
    parser = APIParser(app)
    api_data = parser.parse_all_routes()
    
    generator = OpenAPIGenerator()
    spec = generator.generate_openapi_spec(api_data)
    
    # Generate client
    ts_gen = TypeScriptClientGenerator()
    client = ts_gen.generate_typescript_client(spec)
    ts_gen.save_typescript_client(client, "/root/barber/api_client.ts")
    print("✓ TypeScript client saved to /root/barber/api_client.ts")


def build_all_docs():
    """Example: Build all documentation using DocsBuilder pipeline"""
    builder = DocsBuilder(
        output_dir="/root/barber/docs_output",
        app=app
    )
    
    result = builder.build_all(changes="Initial documentation")
    
    if result['success']:
        print(f"✓ Documentation built successfully!")
        print(f"  Build time: {result.get('build_time', 0):.2f}s")
        print(f"  Files generated: {len(result['files_generated'])}")
        print(f"  Output directory: /root/barber/docs_output")
        
        # Show stats
        stats = builder.get_stats()
        print(f"\n  Statistics:")
        print(f"    Endpoints: {stats.get('endpoints', 0)}")
        print(f"    Tags: {len(stats.get('tags', {}))}")
        print(f"    Schemas: {stats.get('schemas', 0)}")
    else:
        print("✗ Build failed:")
        for error in result.get('errors', []):
            print(f"  Error: {error}")


# ===== Run Examples =====

if __name__ == "__main__":
    import sys
    
    print("BarberZap API Documentation Generator - Quickstart")
    print("=" * 50)
    
    # Check command line args
    command = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    if command == "parse":
        parse_and_inspect_api()
    elif command == "openapi":
        generate_openapi_spec()
    elif command == "html":
        generate_documentation_html()
    elif command == "postman":
        generate_postman_collection()
    elif command == "typescript":
        generate_typescript_client()
    elif command == "all":
        build_all_docs()
    else:
        print("Usage:")
        print("  python quickstart.py parse      - Parse and inspect API")
        print("  python quickstart.py openapi    - Generate OpenAPI spec")
        print("  python quickstart.py html       - Generate ReDoc/Swagger")
        print("  python quickstart.py postman    - Generate Postman collection")
        print("  python quickstart.py typescript - Generate TypeScript client")
        print("  python quickstart.py all        - Build all documentation")
