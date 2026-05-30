"""
Themes API Module
Backend endpoints for theme management (FastAPI/Flask compatible)
"""

import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from pathlib import Path

# ============================================================================
# Types and Models
# ============================================================================

@dataclass
class ColorScale:
    primary: str
    primaryLight: str
    primaryDark: str
    secondary: str
    secondaryLight: str
    secondaryDark: str
    background: str
    backgroundAlt: str
    surface: str
    surfaceAlt: str
    text: str
    textSecondary: str
    textMuted: str
    border: str
    borderLight: str
    success: str
    successLight: str
    warning: str
    warningLight: str
    error: str
    errorLight: str
    info: str
    infoLight: str


@dataclass
class FontConfig:
    heading: str
    body: str
    mono: str


@dataclass
class ThemePreset:
    id: str
    presetKey: str
    name: str
    description: Optional[str]
    colors: Dict[str, str]
    fonts: Dict[str, str]
    borderRadius: str
    spacing: str
    accentEmoji: Optional[str]
    category: str
    sortOrder: int


@dataclass
class ShopTheme:
    id: str
    shopId: str
    themeName: str
    colors: Dict[str, str]
    fonts: Dict[str, str]
    borderRadius: str
    spacing: str
    customCss: Optional[str]
    logoUrl: Optional[str]
    faviconUrl: Optional[str]
    accentEmoji: Optional[str]
    isActive: bool
    isDefault: bool
    createdAt: str
    updatedAt: str


@dataclass
class ThemeUploadResponse:
    success: bool
    message: str
    url: Optional[str] = None


@dataclass
class ThemeValidationResult:
    isValid: bool
    errors: List[str]
    warnings: List[str]


# ============================================================================
# Database Interface (mock with file storage for demo)
# ============================================================================

class ThemeDatabase:
    def __init__(self, data_dir: str = "./data/themes"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.presets_file = self.data_dir / "presets.json"
        self.themes_dir = self.data_dir / "shops"
        self.themes_dir.mkdir(exist_ok=True)
        
        # Initialize presets if not exists
        if not self.presets_file.exists():
            self._initialize_presets()
    
    def _initialize_presets(self):
        """Initialize default theme presets"""
        presets = [
            self._create_default_light(),
            self._create_default_dark(),
            self._create_amber_blue(),
            self._create_midnight_teal(),
            self._create_rose_gold(),
            self._create_ocean_blue(),
            self._create_high_contrast(),
        ]
        
        self.presets_file.write_text(json.dumps([asdict(p) for p in presets], indent=2))
    
    def _create_default_light(self) -> ThemePreset:
        return ThemePreset(
            id="preset-default-light",
            presetKey="defaultLight",
            name="Default Light",
            description="Clean and minimalist light theme",
            colors={
                "primary": "#3b82f6",
                "primaryLight": "#60a5fa",
                "primaryDark": "#2563eb",
                "secondary": "#6366f1",
                "secondaryLight": "#818cf8",
                "secondaryDark": "#4f46e5",
                "background": "#ffffff",
                "backgroundAlt": "#f3f4f6",
                "surface": "#ffffff",
                "surfaceAlt": "#f9fafb",
                "text": "#111827",
                "textSecondary": "#6b7280",
                "textMuted": "#9ca3af",
                "border": "#e5e7eb",
                "borderLight": "#f3f4f6",
                "success": "#10b981",
                "successLight": "#34d399",
                "warning": "#f59e0b",
                "warningLight": "#fbbf24",
                "error": "#ef4444",
                "errorLight": "#f87171",
                "info": "#3b82f6",
                "infoLight": "#60a5fa",
            },
            fonts={
                "heading": "Inter, system-ui, sans-serif",
                "body": "Inter, system-ui, sans-serif",
                "mono": "JetBrains Mono, monospace",
            },
            borderRadius="0.5rem",
            spacing="1rem",
            accentEmoji="🌟",
            category="light",
            sortOrder=1,
        )
    
    def _create_default_dark(self) -> ThemePreset:
        return ThemePreset(
            id="preset-default-dark",
            presetKey="defaultDark",
            name="Default Dark",
            description="Elegant dark mode for night use",
            colors={
                "primary": "#60a5fa",
                "primaryLight": "#93c5fd",
                "primaryDark": "#3b82f6",
                "secondary": "#818cf8",
                "secondaryLight": "#a5b4fc",
                "secondaryDark": "#6366f1",
                "background": "#111827",
                "backgroundAlt": "#1f2937",
                "surface": "#1f2937",
                "surfaceAlt": "#374151",
                "text": "#f9fafb",
                "textSecondary": "#d1d5db",
                "textMuted": "#9ca3af",
                "border": "#374151",
                "borderLight": "#4b5563",
                "success": "#34d399",
                "successLight": "#6ee7b7",
                "warning": "#fbbf24",
                "warningLight": "#fcd34d",
                "error": "#f87171",
                "errorLight": "#fca5a5",
                "info": "#60a5fa",
                "infoLight": "#93c5fd",
            },
            fonts={
                "heading": "Inter, system-ui, sans-serif",
                "body": "Inter, system-ui, sans-serif",
                "mono": "JetBrains Mono, monospace",
            },
            borderRadius="0.5rem",
            spacing="1rem",
            accentEmoji="🌙",
            category="dark",
            sortOrder=2,
        )
    
    def _create_amber_blue(self) -> ThemePreset:
        return ThemePreset(
            id="preset-amber-blue",
            presetKey="amberBlue",
            name="Amber & Blue",
            description="Professional and trustworthy color scheme",
            colors={
                "primary": "#f59e0b",
                "primaryLight": "#fbbf24",
                "primaryDark": "#d97706",
                "secondary": "#3b82f6",
                "secondaryLight": "#60a5fa",
                "secondaryDark": "#2563eb",
                "background": "#fef3c7",
                "backgroundAlt": "#fdf6e3",
                "surface": "#ffffff",
                "surfaceAlt": "#fef3c7",
                "text": "#1e1b4b",
                "textSecondary": "#4338ca",
                "textMuted": "#6366f1",
                "border": "#fcd34d",
                "borderLight": "#fde68a",
                "success": "#059669",
                "successLight": "#10b981",
                "warning": "#d97706",
                "warningLight": "#f59e0b",
                "error": "#dc2626",
                "errorLight": "#ef4444",
                "info": "#3b82f6",
                "infoLight": "#60a5fa",
            },
            fonts={
                "heading": "Playfair Display, serif",
                "body": "Inter, system-ui, sans-serif",
                "mono": "Fira Code, monospace",
            },
            borderRadius="0.375rem",
            spacing="1rem",
            accentEmoji="✂️",
            category="light",
            sortOrder=3,
        )
    
    def _create_midnight_teal(self) -> ThemePreset:
        return ThemePreset(
            id="preset-midnight-teal",
            presetKey="midnightTeal",
            name="Midnight Teal",
            description="Classic barbershop feel with modern touches",
            colors={
                "primary": "#14b8a6",
                "primaryLight": "#2dd4bf",
                "primaryDark": "#0d9488",
                "secondary": "#1e293b",
                "secondaryLight": "#334155",
                "secondaryDark": "#0f172a",
                "background": "#0f172a",
                "backgroundAlt": "#1e2937",
                "surface": "#1e2937",
                "surfaceAlt": "#334155",
                "text": "#f1f5f9",
                "textSecondary": "#94a3b8",
                "textMuted": "#64748b",
                "border": "#334155",
                "borderLight": "#475569",
                "success": "#14b8a6",
                "successLight": "#2dd4bf",
                "warning": "#f59e0b",
                "warningLight": "#fbbf24",
                "error": "#ef4444",
                "errorLight": "#f87171",
                "info": "#0ea5e9",
                "infoLight": "#38bdf8",
            },
            fonts={
                "heading": "Oswald, sans-serif",
                "body": "Open Sans, sans-serif",
                "mono": "Space Mono, monospace",
            },
            borderRadius="0.25rem",
            spacing="1.25rem",
            accentEmoji="🎩",
            category="dark",
            sortOrder=4,
        )
    
    def _create_rose_gold(self) -> ThemePreset:
        return ThemePreset(
            id="preset-rose-gold",
            presetKey="roseGold",
            name="Rose Gold",
            description="Modern and luxurious feel",
            colors={
                "primary": "#e11d48",
                "primaryLight": "#f43f5e",
                "primaryDark": "#be123c",
                "secondary": "#764af1",
                "secondaryLight": "#8b5cf6",
                "secondaryDark": "#6d28d9",
                "background": "#fff1f2",
                "backgroundAlt": "#ffe4e6",
                "surface": "#ffffff",
                "surfaceAlt": "#fff1f2",
                "text": "#1c1917",
                "textSecondary": "#57534e",
                "textMuted": "#a8a29e",
                "border": "#fecdd3",
                "borderLight": "#fda4af",
                "success": "#059669",
                "successLight": "#10b981",
                "warning": "#d97706",
                "warningLight": "#f59e0b",
                "error": "#dc2626",
                "errorLight": "#ef4444",
                "info": "#0891b2",
                "infoLight": "#06b6d4",
            },
            fonts={
                "heading": "DM Sans, sans-serif",
                "body": "DM Sans, sans-serif",
                "mono": "IBM Plex Mono, monospace",
            },
            borderRadius="1rem",
            spacing="1.25rem",
            accentEmoji="🌸",
            category="light",
            sortOrder=5,
        )
    
    def _create_ocean_blue(self) -> ThemePreset:
        return ThemePreset(
            id="preset-ocean-blue",
            presetKey="oceanBlue",
            name="Ocean Blue",
            description="Fresh and calming coastal vibes",
            colors={
                "primary": "#0284c7",
                "primaryLight": "#0ea5e9",
                "primaryDark": "#0369a1",
                "secondary": "#06b6d4",
                "secondaryLight": "#22d3ee",
                "secondaryDark": "#0891b2",
                "background": "#f0f9ff",
                "backgroundAlt": "#e0f2fe",
                "surface": "#ffffff",
                "surfaceAlt": "#f0f9ff",
                "text": "#0c4a6e",
                "textSecondary": "#0369a1",
                "textMuted": "#7dd3fc",
                "border": "#bae6fd",
                "borderLight": "#e0f2fe",
                "success": "#059669",
                "successLight": "#10b981",
                "warning": "#d97706",
                "warningLight": "#f59e0b",
                "error": "#dc2626",
                "errorLight": "#ef4444",
                "info": "#0284c7",
                "infoLight": "#0ea5e9",
            },
            fonts={
                "heading": "Poppins, sans-serif",
                "body": "Poppins, sans-serif",
                "mono": "PT Mono, monospace",
            },
            borderRadius="0.75rem",
            spacing="1rem",
            accentEmoji="🌊",
            category="light",
            sortOrder=6,
        )
    
    def _create_high_contrast(self) -> ThemePreset:
        return ThemePreset(
            id="preset-high-contrast",
            presetKey="highContrast",
            name="High Contrast",
            description="Maximum accessibility and readability",
            colors={
                "primary": "#000000",
                "primaryLight": "#1a1a1a",
                "primaryDark": "#000000",
                "secondary": "#0000ff",
                "secondaryLight": "#0000ff",
                "secondaryDark": "#00008b",
                "background": "#ffffff",
                "backgroundAlt": "#ffffff",
                "surface": "#ffffff",
                "surfaceAlt": "#ffffff",
                "text": "#000000",
                "textSecondary": "#000000",
                "textMuted": "#333333",
                "border": "#000000",
                "borderLight": "#cccccc",
                "success": "#000000",
                "successLight": "#00cc00",
                "warning": "#000000",
                "warningLight": "#ffcc00",
                "error": "#000000",
                "errorLight": "#ff0000",
                "info": "#000000",
                "infoLight": "#0066ff",
            },
            fonts={
                "heading": "Arial, Helvetica, sans-serif",
                "body": "Arial, Helvetica, sans-serif",
                "mono": "Courier New, monospace",
            },
            borderRadius="0rem",
            spacing="1rem",
            accentEmoji="♿",
            category="custom",
            sortOrder=7,
        )
    
    def get_presets(self) -> List[ThemePreset]:
        """Get all theme presets"""
        data = json.loads(self.presets_file.read_text())
        return [ThemePreset(**item) for item in data]
    
    def get_preset(self, presetKey: str) -> Optional[ThemePreset]:
        """Get a specific preset by key"""
        presets = self.get_presets()
        return next((p for p in presets if p.presetKey == presetKey), None)
    
    def get_shop_theme(self, shopId: str) -> Optional[ShopTheme]:
        """Get custom theme for a shop"""
        theme_file = self.themes_dir / f"{shopId}.json"
        if not theme_file.exists():
            return None
        data = json.loads(theme_file.read_text())
        return ShopTheme(**data)
    
    def save_shop_theme(self, shopId: str, themeData: Dict[str, Any]) -> ShopTheme:
        """Save or update shop theme"""
        now = datetime.utcnow().isoformat() + "Z"
        theme_file = self.themes_dir / f"{shopId}.json"
        
        existing_theme = None
        if theme_file.exists():
            existing_theme = json.loads(theme_file.read_text())
        
        theme = ShopTheme(
            id=existing_theme.get("id", str(uuid.uuid4())) if existing_theme else str(uuid.uuid4()),
            shopId=shopId,
            themeName=themeData.get("themeName", "Custom Theme"),
            colors=themeData.get("colors", {}),
            fonts=themeData.get("fonts", {}),
            borderRadius=themeData.get("borderRadius", "0.5rem"),
            spacing=themeData.get("spacing", "1rem"),
            customCss=themeData.get("customCss"),
            logoUrl=themeData.get("logoUrl") or (existing_theme.get("logoUrl") if existing_theme else None),
            faviconUrl=themeData.get("faviconUrl") or (existing_theme.get("faviconUrl") if existing_theme else None),
            accentEmoji=themeData.get("accentEmoji"),
            isActive=themeData.get("isActive", True),
            isDefault=themeData.get("isDefault", False),
            createdAt=existing_theme.get("createdAt", now) if existing_theme else now,
            updatedAt=now,
        )
        
        theme_file.write_text(json.dumps(asdict(theme), indent=2))
        return theme
    
    def delete_shop_theme(self, shopId: str) -> bool:
        """Delete shop theme (reset to default)"""
        theme_file = self.themes_dir / f"{shopId}.json"
        if theme_file.exists():
            theme_file.unlink()
            return True
        return False


# ============================================================================
# Theme Validator
# ============================================================================

class ThemeValidator:
    """Validate theme colors and CSS for WCAG compliance"""
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
        """Convert hex color to RGB"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c + c for c in hex_color])
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    @staticmethod
    def rgb_to_luminance(r: int, g: int, b: int) -> float:
        """Calculate relative luminance"""
        r_linear = r / 255
        g_linear = g / 255
        b_linear = b / 255
        
        r_lin = r_linear / 12.92 if r_linear <= 0.03928 else ((r_linear + 0.055) / 1.055) ** 2.4
        g_lin = g_linear / 12.92 if g_linear <= 0.03928 else ((g_linear + 0.055) / 1.055) ** 2.4
        b_lin = b_linear / 12.92 if b_linear <= 0.03928 else ((b_linear + 0.055) / 1.055) ** 2.4
        
        return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin
    
    @staticmethod
    def get_contrast_ratio(foreground: str, background: str) -> float:
        """Calculate contrast ratio between two colors"""
        fg_rgb = ThemeValidator.hex_to_rgb(foreground)
        bg_rgb = ThemeValidator.hex_to_rgb(background)
        
        fg_lum = ThemeValidator.rgb_to_luminance(*fg_rgb)
        bg_lum = ThemeValidator.rgb_to_luminance(*bg_rgb)
        
        lighter = max(fg_lum, bg_lum)
        darker = min(fg_lum, bg_lum)
        
        return (lighter + 0.05) / (darker + 0.05)
    
    @staticmethod
    def validate_theme(colors: Dict[str, str]) -> ThemeValidationResult:
        """Validate theme colors for accessibility"""
        errors: List[str] = []
        warnings: List[str] = []
        
        # Check required colors
        required_colors = [
            'primary', 'secondary', 'background', 'surface', 'text'
        ]
        
        for color_name in required_colors:
            if color_name not in colors or not colors[color_name]:
                errors.append(f"Missing required color: {color_name}")
                continue
            
            # Validate hex format
            color = colors[color_name]
            if not isinstance(color, str) or not color.startswith('#'):
                errors.append(f"Invalid hex format for {color_name}: {color}")
        
        if errors:
            return ThemeValidationResult(isValid=False, errors=errors, warnings=warnings)
        
        # Check contrast ratios
        critical_pairs = [
            ('text', 'background', 4.5),
            ('textSecondary', 'background', 3.0),
            ('primary', 'background', 4.5),
        ]
        
        for fg, bg, min_ratio in critical_pairs:
            if fg in colors and bg in colors:
                ratio = ThemeValidator.get_contrast_ratio(colors[fg], colors[bg])
                if ratio < min_ratio:
                    warnings.append(
                        f"Low contrast for {fg} on {bg}: {ratio:.2f}:1 "
                        f"(recommended: {min_ratio}:1)"
                    )
        
        return ThemeValidationResult(
            isValid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    @staticmethod
    def validate_css(css: str) -> ThemeValidationResult:
        """Validate custom CSS (basic check)"""
        errors: List[str] = []
        warnings: List[str] = []
        
        # Check for dangerous CSS
        dangerous_patterns = [
            ('!important', '!important should be avoided'),
            ('expression(', 'expression() is deprecated and dangerous'),
        ]
        
        for pattern, message in dangerous_patterns:
            if pattern in css:
                warnings.append(message)
        
        return ThemeValidationResult(
            isValid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )


# ============================================================================
# API Handlers (FastAPI style)
# ============================================================================

class ThemesAPI:
    def __init__(self, db: ThemeDatabase, upload_dir: str = "./uploads/themes"):
        self.db = db
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.validator = ThemeValidator()
    
    async def get_presets(self) -> List[Dict[str, Any]]:
        """GET /api/themes - List all presets"""
        presets = self.db.get_presets()
        return [asdict(p) for p in presets]
    
    async def get_shop_theme(self, shopId: str) -> Optional[Dict[str, Any]]:
        """GET /api/themes/shop/{shopId} - Get custom theme"""
        theme = self.db.get_shop_theme(shopId)
        if theme:
            return asdict(theme)
        
        # Return default if no custom theme
        default_preset = self.db.get_preset('defaultLight')
        return asdict(default_preset) if default_preset else None
    
    async def save_shop_theme(
        self,
        shopId: str,
        themeData: Dict[str, Any]
    ) -> Dict[str, Any]:
        """PUT /api/themes/shop/{shopId} - Save custom theme"""
        
        # Validate theme
        if 'colors' in themeData:
            validation = self.validator.validate_theme(themeData['colors'])
            if not validation.isValid:
                return {
                    "success": False,
                    "message": "Theme validation failed",
                    "errors": validation.errors,
                }
        
        if 'customCss' in themeData:
            validation = self.validator.validate_css(themeData['customCss'])
            if not validation.isValid:
                return {
                    "success": False,
                    "message": "CSS validation failed",
                    "errors": validation.errors,
                }
        
        # Save theme
        theme = self.db.save_shop_theme(shopId, themeData)
        
        return {
            "success": True,
            "message": "Theme saved successfully",
            "theme": asdict(theme),
        }
    
    async def upload_logo(
        self,
        shopId: str,
        filename: str,
        content: bytes,
        content_type: str
    ) -> ThemeUploadResponse:
        """POST /api/themes/shop/{shopId}/logo - Upload logo"""
        
        # Validate file type
        allowed_types = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
        if content_type not in allowed_types:
            return ThemeUploadResponse(
                success=False,
                message=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Save file
        file_ext = Path(filename).suffix
        new_filename = f"{shopId}{file_ext}"
        file_path = self.upload_dir / f"logos/{new_filename}"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        url = f"/uploads/themes/logos/{new_filename}"
        
        # Update theme
        existing_theme = self.db.get_shop_theme(shopId)
        if existing_theme:
            themeData = asdict(existing_theme)
            themeData['logoUrl'] = url
            self.db.save_shop_theme(shopId, themeData)
        
        return ThemeUploadResponse(
            success=True,
            message="Logo uploaded successfully",
            url=url
        )
    
    async def upload_favicon(
        self,
        shopId: str,
        filename: str,
        content: bytes,
        content_type: str
    ) -> ThemeUploadResponse:
        """POST /api/themes/shop/{shopId}/favicon - Upload favicon"""
        
        # Validate file type (favicon must be ICO or PNG)
        allowed_types = ['image/x-icon', 'image/png', 'image/vnd.microsoft.icon']
        if content_type not in allowed_types:
            return ThemeUploadResponse(
                success=False,
                message=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Save file
        file_ext = Path(filename).suffix
        new_filename = f"{shopId}{file_ext}"
        file_path = self.upload_dir / "favicons" / new_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        url = f"/uploads/themes/favicons/{new_filename}"
        
        # Update theme
        existing_theme = self.db.get_shop_theme(shopId)
        if existing_theme:
            themeData = asdict(existing_theme)
            themeData['faviconUrl'] = url
            self.db.save_shop_theme(shopId, themeData)
        
        return ThemeUploadResponse(
            success=True,
            message="Favicon uploaded successfully",
            url=url
        )
    
    async def delete_theme(self, shopId: str) -> Dict[str, Any]:
        """DELETE /api/themes/shop/{shopId} - Reset to default"""
        deleted = self.db.delete_shop_theme(shopId)
        
        return {
            "success": deleted,
            "message": "Theme reset to default" if deleted else "No custom theme found",
        }
    
    async def preview_theme(self, colors: Dict[str, str]) -> Dict[str, Any]:
        """POST /api/themes/preview - Validate and preview CSS"""
        validation = self.validator.validate_theme(colors)
        
        return {
            "isValid": validation.isValid,
            "errors": validation.errors,
            "warnings": validation.warnings,
        }


# ============================================================================
# Example: FastAPI Integration
# ============================================================================

"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()
themes_db = ThemeDatabase()
themes_api = ThemesAPI(themes_db)

@app.get("/api/themes")
async def get_themes():
    """GET /api/themes - List all presets"""
    return await themes_api.get_presets()

@app.get("/api/themes/shop/{shop_id}")
async def get_shop_theme(shop_id: str):
    """GET /api/themes/shop/{shopId} - Get custom theme"""
    theme = await themes_api.get_shop_theme(shop_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    return theme

@app.put("/api/themes/shop/{shop_id}")
async def save_shop_theme(shop_id: str, themeData: dict):
    """PUT /api/themes/shop/{shopId} - Save custom theme"""
    result = await themes_api.save_shop_theme(shop_id, themeData)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/themes/shop/{shop_id}/logo")
async def upload_logo(shop_id: str, file: UploadFile = File(...)):
    \"\"\"POST /api/themes/shop/{shopId}/logo - Upload logo\"\"\"
    content = await file.read()
    result = await themes_api.upload_logo(shop_id, file.filename, content, file.content_type)
    return result

@app.post("/api/themes/shop/{shop_id}/favicon")
async def upload_favicon(shop_id: str, file: UploadFile = File(...)):
    \"\"\"POST /api/themes/shop/{shopId}/favicon - Upload favicon\"\"\"
    content = await file.read()
    result = await themes_api.upload_favicon(shop_id, file.filename, content, file.content_type)
    return result

@app.delete("/api/themes/shop/{shop_id}")
async def delete_theme(shop_id: str):
    \"\"\"DELETE /api/themes/shop/{shopId} - Reset to default\"\"\"
    return await themes_api.delete_theme(shop_id)

@app.post("/api/themes/preview")
async def preview_theme(colors: dict):
    \"\"\"POST /api/themes/preview - Validate and preview CSS\"\"\"
    return await themes_api.preview_theme(colors)
"""

# ============================================================================
# Module Exports
# ============================================================================

__all__ = [
    'ThemeDatabase',
    'ThemesAPI',
    'ThemeValidator',
    'ThemePreset',
    'ShopTheme',
    'ThemeValidationResult',
    'ThemeUploadResponse',
]
