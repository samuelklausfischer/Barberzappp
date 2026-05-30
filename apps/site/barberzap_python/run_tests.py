#!/usr/bin/env python3
"""
BarberZap Test Runner (Python)

Cross-platform test execution script.
"""

import sys
import subprocess
import argparse


def run_pytest(args):
    """Run pytest with given arguments."""
    cmd = ['pytest'] + args
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='BarberZap Test Runner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py              # Run all tests
  python run_tests.py unit         # Run unit tests only
  python run_tests.py integration  # Run integration tests only
  python run_tests.py coverage     # Run with coverage report
  python run_tests.py -v           # Verbose output
        """
    )

    parser.add_argument(
        'category',
        nargs='?',
        choices=['unit', 'integration', 'wrapper', 'core', 'agent', 'crm', 'placeholder', 'fast', 'coverage'],
        help='Test category to run (default: all tests)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )

    parser.add_argument(
        '-k', '--keyword',
        help='Filter tests by keyword expression'
    )

    parser.add_argument(
        '-f', '--file',
        help='Run specific test file'
    )

    parser.add_argument(
        '--cov',
        action='store_true',
        help='Run with coverage report'
    )

    args, unknown = parser.parse_known_args()

    # Build pytest arguments
    pytest_args = []

    # Add verbose
    if args.verbose:
        pytest_args.append('-v')

    # Add coverage
    if args.cov or args.category == 'coverage':
        pytest_args.extend([
            '--cov=barberzap_python',
            '--cov-report=html',
            '--cov-report=term-missing'
        ])

    # Add category marker
    if args.category:
        if args.category == 'fast':
            pytest_args.append('-m')
            pytest_args.append('"fast and not slow"')
        else:
            pytest_args.append('-m')
            pytest_args.append(args.category)

    # Add keyword filter
    if args.keyword:
        pytest_args.append('-k')
        pytest_args.append(args.keyword)

    # Add specific file
    if args.file:
        pytest_args.append(args.file)

    # Add any remaining arguments
    pytest_args.extend(unknown)

    # Run pytest
    return run_pytest(pytest_args)


if __name__ == '__main__':
    sys.exit(main())
