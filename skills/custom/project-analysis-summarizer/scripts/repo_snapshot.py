#!/usr/bin/env python3
"""Create a lightweight snapshot of a repository for token-efficient analysis.

Outputs JSON with:
- tree (depth-limited)
- detected stacks (node/python/docker)
- key files found

Usage:
  python3 repo_snapshot.py /path/to/repo --depth 4 --out snapshot.json

"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Dict, List

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "dist",
    "build",
    "__pycache__",
    ".next",
    ".cache",
}

KEY_FILES = [
    "README.md",
    "README.txt",
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "requirements.txt",
    "pyproject.toml",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
]


def walk_tree(root: Path, depth: int) -> Dict:
    def helper(p: Path, d: int) -> Dict:
        node = {"name": p.name, "type": "dir" if p.is_dir() else "file"}
        if p.is_dir() and d > 0:
            children = []
            try:
                for child in sorted(p.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
                    if child.is_dir() and child.name in EXCLUDE_DIRS:
                        continue
                    children.append(helper(child, d - 1))
            except PermissionError:
                children.append({"name": "<permission denied>", "type": "meta"})
            node["children"] = children
        return node

    return helper(root, depth)


def detect_stack(root: Path) -> Dict[str, bool]:
    def exists(rel: str) -> bool:
        return (root / rel).exists()

    return {
        "node": exists("package.json"),
        "python": exists("requirements.txt") or exists("pyproject.toml"),
        "docker": exists("Dockerfile") or exists("docker-compose.yml"),
        "git": (root / ".git").exists(),
    }


def find_key_files(root: Path) -> List[str]:
    found = []
    for rel in KEY_FILES:
        p = root / rel
        if p.exists():
            found.append(rel)
    # also find common variants
    for p in root.rglob("Dockerfile*"):
        if any(part in EXCLUDE_DIRS for part in p.parts):
            continue
        found.append(str(p.relative_to(root)))
    return sorted(set(found))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("repo", help="Repository root")
    ap.add_argument("--depth", type=int, default=4)
    ap.add_argument("--out", default="repo_snapshot.json")
    args = ap.parse_args()

    root = Path(args.repo).resolve()
    snap = {
        "root": str(root),
        "stack": detect_stack(root),
        "key_files": find_key_files(root),
        "tree": walk_tree(root, args.depth),
    }

    out = Path(args.out).resolve()
    out.write_text(json.dumps(snap, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(str(out))


if __name__ == "__main__":
    main()
