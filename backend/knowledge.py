import json
from config import PATTERNS_FILE, ARTIFACTS_FILE


def _load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_patterns():
    return _load_json(PATTERNS_FILE)


def get_pattern(pattern_id):
    patterns = _load_json(PATTERNS_FILE)
    return patterns.get(pattern_id)


def get_artifacts_by_pattern(pattern_id=None):
    artifacts = _load_json(ARTIFACTS_FILE)
    if pattern_id:
        return [a for a in artifacts if a.get("pattern") == pattern_id]
    return artifacts
