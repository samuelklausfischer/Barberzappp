"""
Version Manager - Track and manage API version history
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
from pathlib import Path
from dataclasses import dataclass, asdict
import hashlib


@dataclass
class APIVersion:
    """API version data"""
    version: str
    spec_hash: str
    spec: Dict[str, Any]
    changes: str
    published_at: str
    endpoints_count: int
    tags_count: int
    schemas_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class VersionManager:
    """Manager for API version tracking"""
    
    def __init__(self, storage_path: str = "/root/barber/docs_output/versions", db_url: Optional[str] = None):
        """
        Initialize version manager
        
        Args:
            storage_path: File system storage path
            db_url: Database connection URL (optional)
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.db_url = db_url
        
        # Initialize database connection if provided
        self.db_conn = None
        if db_url:
            self._init_database()
    
    def _init_database(self) -> None:
        """Initialize database connection"""
        try:
            import psycopg2
            from psycopg2.extras import Json
            
            self.db_conn = psycopg2.connect(self.db_url)
            self.cursor = self.db_conn.cursor()
        except ImportError:
            raise ImportError("psycopg2 is required for database functionality")
        except Exception as e:
            print(f"Warning: Could not connect to database: {e}")
            self.db_conn = None
    
    def track_api_version(
        self,
        spec: Dict[str, Any],
        changes: str = "",
        force_version: Optional[str] = None
    ) -> APIVersion:
        """
        Track a new API version
        
        Args:
            spec: OpenAPI specification
            changes: Description of changes
            force_version: Force specific version instead of auto-incrementing
            
        Returns:
            APIVersion object
        """
        spec_hash = hashlib.sha256(json.dumps(spec, sort_keys=True).encode()).hexdigest()
        
        # Check if spec already exists
        existing = self.get_version_by_hash(spec_hash)
        if existing:
            return existing
        
        # Determine version
        if force_version:
            version = force_version
        else:
            version = self._next_version()
        
        # Calculate stats
        from .openapi_generator import OpenAPIGenerator
        generator = OpenAPIGenerator()
        
        version_data = APIVersion(
            version=version,
            spec_hash=spec_hash,
            spec=spec,
            changes=changes,
            published_at=datetime.now().isoformat(),
            endpoints_count=generator.get_endpoint_count(spec),
            tags_count=len(generator.get_tag_summary(spec)),
            schemas_count=len(spec.get("components", {}).get("schemas", {}))
        )
        
        # Save to file system
        self._save_version_file(version_data)
        
        # Save to database if available
        if self.db_conn:
            self._save_version_db(version_data)
        
        # Update latest symlink
        self._set_latest_version(version)
        
        return version_data
    
    def get_latest_version(self) -> Optional[APIVersion]:
        """Get the latest API version"""
        latest_file = self.storage_path / "latest.json"
        
        if latest_file.exists():
            with open(latest_file) as f:
                data = json.load(f)
            return APIVersion(**data)
        
        # Try database
        if self.db_conn:
            self.cursor.execute("""
                SELECT version, spec_hash, spec, changes, published_at,
                       endpoints_count, tags_count, schemas_count
                FROM api_versions
                WHERE is_latest = TRUE
                LIMIT 1
            """)
            
            result = self.cursor.fetchone()
            if result:
                return APIVersion(
                    version=result[0],
                    spec_hash=result[1],
                    spec=result[2],
                    changes=result[3],
                    published_at=result[4].isoformat(),
                    endpoints_count=result[5],
                    tags_count=result[6],
                    schemas_count=result[7]
                )
        
        return None
    
    def get_version(self, version: str) -> Optional[APIVersion]:
        """Get a specific API version"""
        version_file = self.storage_path / f"{version}.json"
        
        if version_file.exists():
            with open(version_file) as f:
                data = json.load(f)
            return APIVersion(**data)
        
        # Try database
        if self.db_conn:
            from psycopg2.extras import Json
            
            self.cursor.execute("""
                SELECT version, spec_hash, spec, changes, published_at,
                       endpoints_count, tags_count, schemas_count
                FROM api_versions
                WHERE version = %s
                LIMIT 1
            """, (version,))
            
            result = self.cursor.fetchone()
            if result:
                return APIVersion(
                    version=result[0],
                    spec_hash=result[1],
                    spec=result[2],
                    changes=result[3],
                    published_at=result[4].isoformat(),
                    endpoints_count=result[5],
                    tags_count=result[6],
                    schemas_count=result[7]
                )
        
        return None
    
    def get_version_by_hash(self, spec_hash: str) -> Optional[APIVersion]:
        """Get version by spec hash"""
        for version_file in self.storage_path.glob("*.json"):
            if version_file.name == "latest.json":
                continue
            
            try:
                with open(version_file) as f:
                    data = json.load(f)
                
                if data.get("spec_hash") == spec_hash:
                    return APIVersion(**data)
            except Exception:
                continue
        
        # Try database
        if self.db_conn:
            self.cursor.execute("""
                SELECT version, spec_hash, spec, changes, published_at,
                       endpoints_count, tags_count, schemas_count
                FROM api_versions
                WHERE spec_hash = %s
                LIMIT 1
            """, (spec_hash,))
            
            result = self.cursor.fetchone()
            if result:
                return APIVersion(
                    version=result[0],
                    spec_hash=result[1],
                    spec=result[2],
                    changes=result[3],
                    published_at=result[4].isoformat(),
                    endpoints_count=result[5],
                    tags_count=result[6],
                    schemas_count=result[7]
                )
        
        return None
    
    def get_version_history(self, limit: int = 10) -> List[APIVersion]:
        """Get API version history"""
        versions = []
        
        # Load from file system
        version_files = sorted(
            self.storage_path.glob("*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )
        
        for version_file in version_files:
            if version_file.name == "latest.json":
                continue
            
            try:
                with open(version_file) as f:
                    data = json.load(f)
                versions.append(APIVersion(**data))
            except Exception:
                continue
        
        return versions[:limit]
    
    def compare_versions(self, version1: str, version2: str) -> Dict[str, Any]:
        """Compare two API versions"""
        v1 = self.get_version(version1)
        v2 = self.get_version(version2)
        
        if not v1 or not v2:
            return {"error": "One or both versions not found"}
        
        spec1 = v1.spec
        spec2 = v2.spec
        
        comparison = {
            "version1": v1.version,
            "version2": v2.version,
            "stats": {
                "endpoints_added": 0,
                "endpoints_removed": 0,
                "endpoints_modified": 0,
                "schemas_added": 0,
                "schemas_removed": 0,
                "tags_added": 0,
                "tags_removed": 0
            },
            "details": {
                "endpoints": {
                    "added": [],
                    "removed": [],
                    "modified": []
                },
                "schemas": {
                    "added": [],
                    "removed": []
                },
                "tags": {
                    "added": [],
                    "removed": []
                }
            }
        }
        
        # Compare paths/endpoints
        paths1 = set(spec1.get("paths", {}).keys())
        paths2 = set(spec2.get("paths", {}).keys())
        
        comparison["details"]["endpoints"]["added"] = list(paths2 - paths1)
        comparison["details"]["endpoints"]["removed"] = list(paths1 - paths2)
        comparison["stats"]["endpoints_added"] = len(comparison["details"]["endpoints"]["added"])
        comparison["stats"]["endpoints_removed"] = len(comparison["details"]["endpoints"]["removed"])
        
        # Check for modified endpoints
        common_paths = paths1 & paths2
        for path in common_paths:
            path_item1 = spec1["paths"][path]
            path_item2 = spec2["paths"][path]
            if path_item1 != path_item2:
                comparison["details"]["endpoints"]["modified"].append(path)
                comparison["stats"]["endpoints_modified"] += 1
        
        # Compare schemas
        schemas1 = set(spec1.get("components", {}).get("schemas", {}).keys())
        schemas2 = set(spec2.get("components", {}).get("schemas", {}).keys())
        
        comparison["details"]["schemas"]["added"] = list(schemas2 - schemas1)
        comparison["details"]["schemas"]["removed"] = list(schemas1 - schemas2)
        comparison["stats"]["schemas_added"] = len(comparison["details"]["schemas"]["added"])
        comparison["stats"]["schemas_removed"] = len(comparison["details"]["schemas"]["removed"])
        
        # Compare tags
        tags1 = set()
        for path_item in spec1.get("paths", {}).values():
            for operation in path_item.values():
                tags1.update(operation.get("tags", []))
        
        tags2 = set()
        for path_item in spec2.get("paths", {}).values():
            for operation in path_item.values():
                tags2.update(operation.get("tags", []))
        
        comparison["details"]["tags"]["added"] = list(tags2 - tags1)
        comparison["details"]["tags"]["removed"] = list(tags1 - tags2)
        comparison["stats"]["tags_added"] = len(comparison["details"]["tags"]["added"])
        comparison["stats"]["tags_removed"] = len(comparison["details"]["tags"]["removed"])
        
        return comparison
    
    def archive_old_versions(self, keep_count: int = 10) -> None:
        """Archive old versions, keeping only the most recent"""
        versions = self.get_version_history(limit=100)
        
        if len(versions) <= keep_count:
            return
        
        # Remove old versions
        for version in versions[keep_count:]:
            version_file = self.storage_path / f"{version.version}.json"
            if version_file.exists():
                version_file.unlink()
        
        # Update database if available
        if self.db_conn:
            self.cursor.execute("""
                DELETE FROM api_versions
                WHERE version NOT IN (
                    SELECT version
                    FROM (
                        SELECT version, ROW_NUMBER() OVER (ORDER BY published_at DESC) as row_num
                        FROM api_versions
                        WHERE is_latest = FALSE
                    ) ranked
                    WHERE row_num <= %s
                )
                AND is_latest = FALSE
            """, (keep_count,))
            self.db_conn.commit()
    
    def _next_version(self) -> str:
        """Generate next version number"""
        versions = self.get_version_history(limit=100)
        
        if not versions:
            return "1.0.0"
        
        latest = versions[0]
        version_parts = latest.version.split(".")
        
        if len(version_parts) == 3:
            major, minor, patch = map(int, version_parts)
            # Increment patch by default
            patch += 1
            return f"{major}.{minor}.{patch}"
        
        return "1.0.1"
    
    def _save_version_file(self, version_data: APIVersion) -> None:
        """Save version to file system"""
        version_file = self.storage_path / f"{version_data.version}.json"
        
        with open(version_file, 'w') as f:
            json.dump(version_data.to_dict(), f, indent=2, ensure_ascii=False)
    
    def _save_version_db(self, version_data: APIVersion) -> None:
        """Save version to database"""
        from psycopg2.extras import Json
        
        # Mark all previous versions as not latest
        self.cursor.execute("""
            UPDATE api_versions
            SET is_latest = FALSE
        """)
        
        # Insert new version
        self.cursor.execute("""
            INSERT INTO api_versions
            (version, spec_hash, spec, is_latest, changes, published_at, endpoints_count, tags_count, schemas_count)
            VALUES (%s, %s, %s, TRUE, %s, %s, %s, %s, %s)
            ON CONFLICT (version) DO UPDATE
            SET spec_hash = EXCLUDED.spec_hash,
                spec = EXCLUDED.spec,
                is_latest = EXCLUDED.is_latest,
                changes = EXCLUDED.changes,
                endpoints_count = EXCLUDED.endpoints_count,
                tags_count = EXCLUDED.tags_count,
                schemas_count = EXCLUDED.schemas_count
        """, (
            version_data.version,
            version_data.spec_hash,
            Json(version_data.spec),
            version_data.changes,
            version_data.published_at,
            version_data.endpoints_count,
            version_data.tags_count,
            version_data.schemas_count
        ))
        
        self.db_conn.commit()
    
    def _set_latest_version(self, version: str) -> None:
        """Set latest version symlink"""
        # Update file system
        version_file = self.storage_path / f"{version}.json"
        latest_file = self.storage_path / "latest.json"
        
        if version_file.exists():
            import shutil
            shutil.copy(version_file, latest_file)
    
    def get_changelog(self, version1: Optional[str] = None, version2: Optional[str] = None) -> str:
        """Generate changelog between versions"""
        if version1 is None:
            # Start from latest
            latest = self.get_latest_version()
            version1 = latest.version if latest else "1.0.0"
        
        if version2 is None:
            # Get previous version
            history = self.get_version_history(limit=10)
            if len(history) > 1:
                version2 = history[1].version
            else:
                version2 = version1
        
        comparison = self.compare_versions(version1, version2)
        
        changelog = f"""# API Changelog: {version2} → {version1}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

- Endpoints added: {comparison['stats']['endpoints_added']}
- Endpoints removed: {comparison['stats']['endpoints_removed']}
- Endpoints modified: {comparison['stats']['endpoints_modified']}
- Schemas added: {comparison['stats']['schemas_added']}
- Schemas removed: {comparison['stats']['schemas_removed']}
- Tags added: {comparison['stats']['tags_added']}
- Tags removed: {comparison['stats']['tags_removed']}

"""
        
        if comparison['details']['endpoints']['added']:
            changelog += "### Added Endpoints\n\n"
            for endpoint in comparison['details']['endpoints']['added']:
                changelog += f"- `{endpoint}`\n"
            changelog += "\n"
        
        if comparison['details']['endpoints']['removed']:
            changelog += "### Removed Endpoints\n\n"
            for endpoint in comparison['details']['endpoints']['removed']:
                changelog += f"- `{endpoint}`\n"
            changelog += "\n"
        
        if comparison['details']['endpoints']['modified']:
            changelog += "### Modified Endpoints\n\n"
            for endpoint in comparison['details']['endpoints']['modified']:
                changelog += f"- `{endpoint}`\n"
            changelog += "\n"
        
        return changelog
    
    def close(self) -> None:
        """Close database connection"""
        if self.db_conn:
            self.db_conn.close()
    
    def __del__(self):
        """Cleanup on deletion"""
        self.close()
