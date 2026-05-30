"""
Calendar Integration Exceptions
"""

class CalendarIntegrationError(Exception):
    """Base exception for all calendar integration errors"""
    pass


class CalendarAuthError(CalendarIntegrationError):
    """Exception raised for authentication/authorization errors"""
    def __init__(self, message: str, needs_reauth: bool = False):
        super().__init__(message)
        self.needs_reauth = needs_reauth


class CalendarSyncError(CalendarIntegrationError):
    """Exception raised for synchronization errors"""
    def __init__(self, message: str, retryable: bool = True):
        super().__init__(message)
        self.retryable = retryable


class CalendarConflictError(CalendarIntegrationError):
    """Exception raised when a scheduling conflict is detected"""
    def __init__(self, message: str, conflicting_events: list = None):
        super().__init__(message)
        self.conflicting_events = conflicting_events or []


class CalendarQuotaError(CalendarIntegrationError):
    """Exception raised when API quota is exceeded"""
    pass


class CalendarInvalidTokenError(CalendarAuthError):
    """Exception raised when the access token is invalid or expired"""
    def __init__(self, message: str = "Invalid or expired access token"):
        super().__init__(message, needs_reauth=True)


class CalendarNotFoundError(CalendarIntegrationError):
    """Exception raised when a calendar or event is not found"""
    pass


class CalendarRateLimitError(CalendarIntegrationError):
    """Exception raised when rate limit is hit"""
    def __init__(self, message: str, retry_after: int = None):
        super().__init__(message)
        self.retry_after = retry_after
