import json
from functools import lru_cache
from pathlib import Path

from .bias_catalog import normalize_bias_label


DATA_FILE = Path(__file__).parent / "data" / "rag_sources.json"


@lru_cache(maxsize=1)
def kaynaklari_yukle() -> list[dict]:
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


def ilgili_kaynaklari_getir(bias_label: str | None = None, agent: str | None = None, query: str = "", limit: int = 3) -> list[dict]:
    canonical = normalize_bias_label(bias_label)
    words = {word for word in query.lower().split() if len(word) > 3}
    ranked = []
    for source in kaynaklari_yukle():
        labels = {normalize_bias_label(label) for label in source.get("bias_labels", [])}
        agents = set(source.get("used_by", []))
        if agent and agents and agent not in agents:
            continue
        haystack = " ".join((source.get("title", ""), source.get("summary_tr", ""))).lower()
        score = (10 if canonical in labels else 0) + sum(1 for word in words if word in haystack)
        if score > 0 or (not bias_label and not query):
            ranked.append((score, source))
    ranked.sort(key=lambda item: (-item[0], item[1]["year"], item[1]["id"]))
    return [source for _, source in ranked[: max(0, limit)]]


def kaynak_baglamini_olustur(sources: list[dict]) -> str:
    return "\n".join(f"- {item['title']} ({item['year']}): {item['summary_tr']}" for item in sources)


kaynaklari_getir = ilgili_kaynaklari_getir
