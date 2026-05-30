"""
Common Pydantic Models

Shared models used across multiple endpoints.
"""

from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field, ConfigDict


class SuccessResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    message: str = "Operation completed successfully"


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    data: Optional[Any] = None


T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: List[T]
    total: int = Field(..., description="Total number of items")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5
            }
        }
    )


class PaginationParams(BaseModel):
    """Pagination parameters for query."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    order_by: Optional[str] = Field(default="created_at", description="Field to order by")
    order_dir: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort direction")

    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.page_size


class IDResponse(BaseModel):
    """Response with just an ID."""
    id: Any
    message: Optional[str] = None


class CountResponse(BaseModel):
    """Response with a count."""
    count: int
    message: Optional[str] = None
