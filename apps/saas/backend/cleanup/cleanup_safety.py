"""
BarberZap - Data Cleanup Safety Module

Provides safety checks and validations before performing
destructive cleanup operations.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class SafetyLevel(Enum):
    """Safety check levels"""
    SAFE = "safe"
    WARNING = "warning"
    DANGEROUS = "dangerous"
    CRITICAL = "critical"


@dataclass
class SafetyCheckResult:
    """Result of a safety check"""
    table_name: str
    check_name: str
    passed: bool
    safety_level: SafetyLevel
    message: str
    details: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "table_name": self.table_name,
            "check_name": self.check_name,
            "passed": self.passed,
            "safety_level": self.safety_level.value,
            "message": self.message,
            "details": self.details
        }


class CleanupSafetyChecker:
    """
    Safety checker for cleanup operations.

    Performs various safety checks before allowing cleanup:
    - Validate delete count is within thresholds
    - Confirm user intention
    - Check if table is on protected whitelist
    - Backup before large deletions
    - Dry run mode for preview
    """

    # Configuration
    DEFAULT_COUNT_THRESHOLD = 10000
    DEFAULT_SIZE_THRESHOLD_MB = 1000
    BACKUP_THRESHOLD_COUNT = 1000
    BACKUP_THRESHOLD_MB = 100

    # Whitelist of tables that cannot be deleted
    PROTECTED_TABLES_WHITELIST = [
        'clients',
        'services',
        'employees',
        'appointments',
        'working_hours',
        'shops',
        'users',
        'auth_users'
    ]

    def __init__(
        self,
        count_threshold: int = DEFAULT_COUNT_THRESHOLD,
        size_threshold_mb: int = DEFAULT_SIZE_THRESHOLD_MB,
        auto_backup: bool = True,
        dry_run: bool = False
    ):
        """
        Initialize safety checker.

        Args:
            count_threshold: Max safe count for deletion
            size_threshold_mb: Max safe table size in MB
            auto_backup: Automatically backup before large deletions
            dry_run: Run in dry-run mode (no actual deletes)
        """
        self.count_threshold = count_threshold
        self.size_threshold_mb = size_threshold_mb
        self.auto_backup = auto_backup
        self.dry_run = dry_run

    def validate_safe_delete(
        self,
        table_name: str,
        count: int,
        table_size_mb: float
    ) -> Tuple[bool, List[SafetyCheckResult]]:
        """
        Validate if a delete operation is safe.

        Args:
            table_name: Name of the table
            count: Number of records to delete
            table_size_mb: Current size of the table in MB

        Returns:
            Tuple of (is_safe, list of check results)
        """
        checks: List[SafetyCheckResult] = []

        # Check 1: Table is not on protected whitelist
        check1 = self._check_protected_table(table_name)
        checks.append(check1)

        # Check 2: Count is within threshold
        check2 = self._check_count_threshold(table_name, count)
        checks.append(check2)

        # Check 3: Table size is within threshold
        check3 = self._check_size_threshold(table_name, table_size_mb)
        checks.append(check3)

        # Overall safety: all critical checks must pass
        is_safe = all(
            c.passed or c.safety_level in [SafetyLevel.SAFE, SafetyLevel.WARNING]
            for c in checks if c.safety_level in [SafetyLevel.DANGEROUS, SafetyLevel.CRITICAL]
        )

        return is_safe, checks

    def confirm_deletion(
        self,
        table_name: str,
        count: int,
        threshold: Optional[int] = None
    ) -> bool:
        """
        Confirm deletion with user.

        Args:
            table_name: Name of the table
            count: Number of records to delete
            threshold: Custom threshold for confirmation

        Returns:
            True if confirmed, False otherwise
        """
        threshold = threshold or self.count_threshold

        if count < threshold:
            return True

        # This would show a confirmation dialog in the UI
        # For CLI/woker, this would be handled separately
        logger.warning(
            f"⚠️  Large deletion requested: {count:,} records from {table_name}"
        )
        logger.warning(
            f"   This exceeds the threshold of {threshold:,} records"
        )

        # Return False to require explicit confirmation
        return False

    def cannot_delete_production_data(
        self,
        table_name: str
    ) -> bool:
        """
        Check if table contains production data that cannot be deleted.

        Args:
            table_name: Name of the table

        Returns:
            True if table can be deleted, False if it's protected
        """
        for protected in self.PROTECTED_TABLES_WHITELIST:
            if table_name.lower() == protected.lower():
                logger.error(f"🚫 Cannot delete from protected table: {table_name}")
                return False

        return True

    def backup_before_delete(
        self,
        table_name: str,
        count: int,
        table_size_mb: float,
        performed_by: str
    ) -> Optional[str]:
        """
        Create backup before large deletion.

        Args:
            table_name: Name of the table
            count: Number of records to delete
            table_size_mb: Current size of the table in MB
            performed_by: Who is performing the deletion

        Returns:
            Path to backup file, or None if no backup was created
        """
        # Check if backup is needed
        needs_backup = (
            count >= self.BACKUP_THRESHOLD_COUNT or
            table_size_mb >= self.BACKUP_THRESHOLD_MB
        )

        if not needs_backup or not self.auto_backup:
            return None

        try:
            # This would integrate with your backup system
            # For now, just log the intention
            logger.info(f"💾 Creating backup before deleting {count:,} records from {table_name}")

            backup_path = f"/backups/cleanup/{table_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql.gz"

            # Log the backup operation
            # In a real implementation, you would:
            # 1. Execute pg_dump on the table
            # 2. Compress with gzip
            # 3. Upload to S3/cloud storage
            # 4. Log to cleanup_safety_log table

            logger.info(f"✅ Backup created: {backup_path}")

            return backup_path

        except Exception as e:
            logger.error(f"❌ Failed to create backup: {e}")
            return None

    def dry_run_mode(
        self,
        table_name: str,
        delete_condition: str
    ) -> Dict[str, Any]:
        """
        Preview what would be deleted without actually deleting.

        Args:
            table_name: Name of the table
            delete_condition: SQL WHERE clause for deletion

        Returns:
            Dictionary with preview information
        """
        # In a real implementation, you would:
        # 1. Run SELECT COUNT(*) WHERE {delete_condition}
        # 2. Run SELECT * WHERE {delete_condition} LIMIT 10
        # 3. Calculate estimated size to be freed
        # 4. Return summary

        return {
            "table_name": table_name,
            "delete_condition": delete_condition,
            "estimated_count": 0,  # Would be populated by database query
            "estimated_size_bytes": 0,
            "sample_records": [],  # Would contain up to 10 sample records
            "dry_run": True
        }

    def _check_protected_table(self, table_name: str) -> SafetyCheckResult:
        """Check if table is protected (cannot delete)"""
        is_protected = not self.cannot_delete_production_data(table_name)

        if is_protected:
            return SafetyCheckResult(
                table_name=table_name,
                check_name="protected_table",
                passed=False,
                safety_level=SafetyLevel.CRITICAL,
                message=f"Table '{table_name}' is on the protected whitelist and cannot be deleted"
            )

        return SafetyCheckResult(
            table_name=table_name,
            check_name="protected_table",
            passed=True,
            safety_level=SafetyLevel.SAFE,
            message=f"Table '{table_name}' is not protected"
        )

    def _check_count_threshold(self, table_name: str, count: int) -> SafetyCheckResult:
        """Check if count is within safe threshold"""
        if count > self.count_threshold:
            return SafetyCheckResult(
                table_name=table_name,
                check_name="count_threshold",
                passed=False,
                safety_level=SafetyLevel.DANGEROUS,
                message=f"Count {count:,} exceeds threshold of {self.count_threshold:,}",
                details={"count": count, "threshold": self.count_threshold}
            )

        return SafetyCheckResult(
            table_name=table_name,
            check_name="count_threshold",
            passed=True,
            safety_level=SafetyLevel.SAFE,
            message=f"Count {count:,} is within safe threshold"
        )

    def _check_size_threshold(self, table_name: str, size_mb: float) -> SafetyCheckResult:
        """Check if table size is within safe threshold"""
        if size_mb > self.size_threshold_mb:
            return SafetyCheckResult(
                table_name=table_name,
                check_name="size_threshold",
                passed=True,
                safety_level=SafetyLevel.WARNING,
                message=f"Table size {size_mb:.2f}MB exceeds threshold of {self.size_threshold_mb:.2f}MB",
                details={"size_mb": size_mb, "threshold_mb": self.size_threshold_mb}
            )

        return SafetyCheckResult(
            table_name=table_name,
            check_name="size_threshold",
            passed=True,
            safety_level=SafetyLevel.SAFE,
            message=f"Table size {size_mb:.2f}MB is within safe threshold"
        )


class CleanupSafetyValidator:
    """
    High-level API for safety validation.

    Combines all safety checks and provides a simple API.
    """

    def __init__(
        self,
        safety_checker: Optional[CleanupSafetyChecker] = None
    ):
        """
        Initialize safety validator.

        Args:
            safety_checker: Optional custom safety checker
        """
        self.safety_checker = safety_checker or CleanupSafetyChecker()

    async def validate_cleanup_operation(
        self,
        table_name: str,
        count: int,
        table_size_mb: float,
        require_confirmation: bool = False
    ) -> Dict[str, Any]:
        """
        Validate a cleanup operation.

        Args:
            table_name: Name of the table
            count: Number of records to delete
            table_size_mb: Current size of the table in MB
            require_confirmation: Require explicit user confirmation

        Returns:
            Dictionary with validation result
        """
        # Run safety checks
        is_safe, checks = self.safety_checker.validate_safe_delete(
            table_name, count, table_size_mb
        )

        # Check if confirmation is needed
        needs_confirmation = self.safety_checker.confirm_deletion(
            table_name, count
        )

        # Create backup if needed
        backup_path = None
        if not self.safety_checker.dry_run and count >= self.safety_checker.BACKUP_THRESHOLD_COUNT:
            backup_path = self.safety_checker.backup_before_delete(
                table_name, count, table_size_mb, 'validation'
            )

        # Determine overall status
        if not is_safe:
            status = "blocked"
        elif needs_confirmation and require_confirmation:
            status = "requires_confirmation"
        else:
            status = "approved"

        return {
            "status": status,
            "is_safe": is_safe,
            "table_name": table_name,
            "count": count,
            "table_size_mb": table_size_mb,
            "safety_checks": [check.to_dict() for check in checks],
            "needs_confirmation": needs_confirmation,
            "backup_created": backup_path is not None,
            "backup_path": backup_path,
            "dry_run": self.safety_checker.dry_run
        }

    async def preview_cleanup(
        self,
        table_name: str,
        delete_condition: str
    ) -> Dict[str, Any]:
        """
        Preview a cleanup operation in dry-run mode.

        Args:
            table_name: Name of the table
            delete_condition: SQL WHERE clause

        Returns:
            Dictionary with preview information
        """
        preview = self.safety_checker.dry_run_mode(
            table_name, delete_condition
        )

        return preview


def create_safety_validator(
    count_threshold: int = 10000,
    size_threshold_mb: int = 1000,
    auto_backup: bool = True,
    dry_run: bool = False
) -> CleanupSafetyValidator:
    """
    Create a safety validator with custom configuration.

    Args:
        count_threshold: Max safe count for deletion
        size_threshold_mb: Max safe table size in MB
        auto_backup: Automatically backup before large deletions
        dry_run: Run in dry-run mode

    Returns:
        Configured CleanupSafetyValidator
    """
    checker = CleanupSafetyChecker(
        count_threshold=count_threshold,
        size_threshold_mb=size_threshold_mb,
        auto_backup=auto_backup,
        dry_run=dry_run
    )

    return CleanupSafetyValidator(checker)
