import hashlib
import json
import logging
import os
import re
from functools import lru_cache
from pathlib import Path

from .bias_catalog import bias_name_tr, normalize_bias_label
from .embedding_service import kosinus_benzerligi, metinleri_embeddinge_cevir


AGENTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = AGENTS_DIR.parents[1]
DATA_FILE = AGENTS_DIR / "data" / "rag_sources.json"
CACHE_VERSION = 2
DEFAULT_CHUNK_SIZE = 1200
DEFAULT_CHUNK_OVERLAP = 180
DEFAULT_CACHE_FILE = REPO_ROOT / ".rag_cache" / "rag_index.json"
SPACE_PATTERN = re.compile(r"\s+")
ENCODING_NOISE_PATTERN = re.compile(r"(?:/[A-Z0-9]{2}){3,}")
READABLE_WORD_PATTERN = re.compile(r"[A-Za-zÇĞİÖŞÜçğıöşü]{3,}")
BIAS_QUERY_EXPANSIONS = {
    "loss_aversion": "loss aversion losses gains risk reference point",
    "anchoring": "anchoring initial value estimate adjustment judgment",
    "mental_accounting": "mental accounting budget money spending account",
    "disposition_effect": "disposition effect hold losses sell winners",
    "present_bias": "present bias immediate reward future saving",
    "overconfidence": "overconfidence excessive trading confidence ability judgment",
    "herd_behavior": "herd behavior imitate others social information decisions",
    "status_quo_bias": "status quo inertia default choice change",
    "sunk_cost": "sunk cost past investment continue decision",
    "moral_hazard": "moral hazard risk consequences responsibility incentives",
    "confirmation_bias": "confirmation bias supporting evidence disconfirming evidence selective evaluation",
}


@lru_cache(maxsize=1)
def kaynaklari_yukle() -> list[dict]:
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def pdf_klasorunu_bul() -> Path | None:
    configured = os.getenv("FINSIM_RAG_DIR")
    candidates = [
        _resolve_local_path(configured) if configured else None,
        REPO_ROOT / "research" / "pdfs",
        REPO_ROOT / "rag",
    ]
    for candidate in candidates:
        if candidate and candidate.is_dir() and any(candidate.glob("*.pdf")):
            return candidate
    return None


def _resolve_local_path(value: str) -> Path:
    path = Path(value).expanduser()
    return path if path.is_absolute() else REPO_ROOT / path


def metni_chunklara_bol(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:
    clean = SPACE_PATTERN.sub(" ", text or "").strip()
    if not clean:
        return []
    chunk_size = max(200, chunk_size)
    overlap = max(0, min(overlap, chunk_size // 2))
    chunks = []
    start = 0
    while start < len(clean):
        end = min(len(clean), start + chunk_size)
        if end < len(clean):
            boundary = max(
                clean.rfind(". ", start + chunk_size // 2, end),
                clean.rfind("; ", start + chunk_size // 2, end),
                clean.rfind(" ", start + chunk_size // 2, end),
            )
            if boundary > start:
                end = boundary + 1
        chunk = clean[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(clean):
            break
        start = max(start + 1, end - overlap)
    return chunks


def _pdf_fingerprint(pdf_dir: Path | None) -> str:
    records = []
    if pdf_dir:
        for path in sorted(pdf_dir.glob("*.pdf")):
            try:
                stat = path.stat()
                records.append(f"{path.name}:{stat.st_size}:{stat.st_mtime_ns}")
            except OSError:
                continue
    try:
        records.append(hashlib.sha256(DATA_FILE.read_bytes()).hexdigest())
    except OSError:
        records.append("no-source-cards")
    records.extend(
        (
            os.getenv("FINSIM_EMBEDDING_BACKEND", "sentence_transformers"),
            os.getenv(
                "FINSIM_EMBEDDING_MODEL",
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            ),
            os.getenv("FINSIM_ALLOW_MODEL_DOWNLOAD", "false"),
            str(DEFAULT_CHUNK_SIZE),
            str(DEFAULT_CHUNK_OVERLAP),
        )
    )
    return hashlib.sha256("|".join(records).encode("utf-8")).hexdigest()


def _source_by_filename() -> dict[str, dict]:
    return {
        Path(source.get("source", "")).name.casefold(): source
        for source in kaynaklari_yukle()
        if source.get("source")
    }


def _metin_kaliteli_mi(text: str) -> bool:
    if len(text) < 120 or ENCODING_NOISE_PATTERN.search(text):
        return False
    letters = sum(character.isalpha() for character in text)
    visible = sum(not character.isspace() for character in text)
    return visible > 0 and letters / visible >= 0.55 and len(text.split()) >= 20


def _okunabilir_pasaj(text: str, limit: int = 700) -> str:
    clean = SPACE_PATTERN.sub(" ", text or "").strip()
    first_word = READABLE_WORD_PATTERN.search(clean[:160])
    if first_word and 0 < first_word.start() < 80:
        clean = clean[first_word.start() :]
    return clean[:limit].strip()


def _pdf_chunklarini_cikar(pdf_dir: Path | None) -> list[dict]:
    if not pdf_dir:
        return []
    try:
        from pypdf import PdfReader
    except ImportError:
        return []

    logging.getLogger("pypdf").setLevel(logging.ERROR)
    source_map = _source_by_filename()
    chunks = []
    for pdf_path in sorted(pdf_dir.glob("*.pdf")):
        source = source_map.get(pdf_path.name.casefold())
        if not source:
            continue
        try:
            reader = PdfReader(str(pdf_path))
            for page_number, page in enumerate(reader.pages, start=1):
                for chunk_number, text in enumerate(
                    metni_chunklara_bol(page.extract_text() or ""),
                    start=1,
                ):
                    if not _metin_kaliteli_mi(text):
                        continue
                    chunks.append(
                        {
                            "chunk_id": f"{source['id']}:p{page_number}:c{chunk_number}",
                            "source_id": source["id"],
                            "page": page_number,
                            "text": text,
                            "bias_labels": source.get("bias_labels", []),
                            "used_by": source.get("used_by", []),
                        }
                    )
        except Exception:
            continue
    return chunks


def _cache_file() -> Path:
    configured = os.getenv("FINSIM_RAG_CACHE")
    return _resolve_local_path(configured) if configured else DEFAULT_CACHE_FILE


def _cache_read(fingerprint: str) -> dict | None:
    try:
        payload = json.loads(_cache_file().read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if (
        payload.get("version") != CACHE_VERSION
        or payload.get("pdf_fingerprint") != fingerprint
        or not payload.get("chunks")
        or not payload.get("embeddings")
        or len(payload["chunks"]) != len(payload["embeddings"])
    ):
        return None
    return payload


def _cache_write(payload: dict) -> None:
    try:
        cache_file = _cache_file()
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    except OSError:
        pass


def rag_indeksini_yukle() -> dict:
    pdf_dir = pdf_klasorunu_bul()
    fingerprint = _pdf_fingerprint(pdf_dir)
    cached = _cache_read(fingerprint)
    if cached:
        return cached

    chunks = _pdf_chunklarini_cikar(pdf_dir)
    source_cards = {source["id"]: source for source in kaynaklari_yukle()}
    embedding_inputs = []
    for chunk in chunks:
        source = source_cards.get(chunk["source_id"], {})
        embedding_inputs.append(
            " ".join(
                (
                    source.get("title", ""),
                    source.get("summary_tr", ""),
                    source.get("game_usage", ""),
                    chunk["text"],
                )
            )
        )
    embeddings, backend = metinleri_embeddinge_cevir(embedding_inputs)
    payload = {
        "version": CACHE_VERSION,
        "pdf_fingerprint": fingerprint,
        "embedding_backend": backend,
        "chunks": chunks,
        "embeddings": embeddings,
    }
    if chunks and embeddings:
        _cache_write(payload)
    return payload


def _source_card_results(
    bias_label: str | None,
    agent: str | None,
    query: str,
    limit: int,
) -> list[dict]:
    canonical = normalize_bias_label(bias_label)
    words = {word.casefold() for word in SPACE_PATTERN.split(query) if len(word) > 3}
    ranked = []
    sources = kaynaklari_yukle()
    matching_sources = [
        source
        for source in sources
        if canonical
        and canonical
        in {normalize_bias_label(label) for label in source.get("bias_labels", [])}
    ]
    for source in matching_sources or sources:
        labels = {normalize_bias_label(label) for label in source.get("bias_labels", [])}
        agents = set(source.get("used_by", []))
        if agent and agents and agent not in agents:
            continue
        haystack = " ".join(
            (source.get("title", ""), source.get("summary_tr", ""), source.get("game_usage", ""))
        ).casefold()
        score = (10 if canonical and canonical in labels else 0) + sum(
            1 for word in words if word in haystack
        )
        if score > 0 or (not bias_label and not query):
            ranked.append((score, source))
    ranked.sort(key=lambda item: (-item[0], item[1]["year"], item[1]["id"]))
    return [
        {
            **source,
            "excerpt": source.get("summary_tr", ""),
            "retrieval_backend": "source_card_fallback",
            "retrieval_score": score,
        }
        for score, source in ranked[:limit]
    ]


def ilgili_kaynaklari_getir(
    bias_label: str | None = None,
    agent: str | None = None,
    query: str = "",
    limit: int = 3,
) -> list[dict]:
    limit = max(0, limit)
    if not limit:
        return []

    canonical = normalize_bias_label(bias_label)
    semantic_query = " ".join(
        part
        for part in (
            bias_name_tr(canonical) if canonical else "",
            BIAS_QUERY_EXPANSIONS.get(canonical, ""),
            query,
        )
        if part
    ).strip()
    index = rag_indeksini_yukle()
    chunks = index.get("chunks", [])
    embeddings = index.get("embeddings", [])
    backend = index.get("embedding_backend")
    query_vectors, query_backend = metinleri_embeddinge_cevir(
        [semantic_query or "davranışsal finans karar farkındalığı"],
        preferred_backend=backend,
    )
    if not chunks or not query_vectors or query_backend != backend:
        return _source_card_results(bias_label, agent, query, limit)

    source_cards = {source["id"]: source for source in kaynaklari_yukle()}
    label_matched_chunks = [
        chunk
        for chunk in chunks
        if canonical
        and canonical
        in {normalize_bias_label(label) for label in chunk.get("bias_labels", [])}
    ]
    if canonical and not label_matched_chunks:
        return _source_card_results(bias_label, agent, query, limit)
    ranked = []
    candidate_ids = {
        chunk["chunk_id"] for chunk in (label_matched_chunks or chunks)
    }
    for chunk, embedding in zip(chunks, embeddings):
        if chunk["chunk_id"] not in candidate_ids:
            continue
        labels = {normalize_bias_label(label) for label in chunk.get("bias_labels", [])}
        agents = set(chunk.get("used_by", []))
        if agent and agents and agent not in agents:
            continue
        semantic_score = kosinus_benzerligi(query_vectors[0], embedding)
        label_bonus = 0.25 if canonical and canonical in labels else 0.0
        ranked.append((semantic_score + label_bonus, chunk))
    ranked.sort(key=lambda item: (-item[0], item[1]["chunk_id"]))

    results = []
    used_sources = set()
    for score, chunk in ranked:
        source_id = chunk["source_id"]
        if source_id in used_sources or source_id not in source_cards:
            continue
        used_sources.add(source_id)
        results.append(
            {
                **source_cards[source_id],
                "chunk_id": chunk["chunk_id"],
                "page": chunk["page"],
                "excerpt": _okunabilir_pasaj(chunk["text"]),
                "retrieval_backend": backend,
                "retrieval_score": round(score, 4),
            }
        )
        if len(results) >= limit:
            break
    return results or _source_card_results(bias_label, agent, query, limit)


def kaynak_baglamini_olustur(sources: list[dict]) -> str:
    lines = []
    for item in sources:
        passage = item.get("excerpt") or item.get("summary_tr", "")
        page = f", p. {item['page']}" if item.get("page") else ""
        lines.append(f"- {item['title']} ({item['year']}{page}): {passage}")
    return "\n".join(lines)


def rag_durumunu_getir() -> dict:
    index = rag_indeksini_yukle()
    return {
        "pdf_directory": str(pdf_klasorunu_bul()) if pdf_klasorunu_bul() else None,
        "chunk_count": len(index.get("chunks", [])),
        "embedding_backend": index.get("embedding_backend"),
        "cache_file": str(_cache_file()),
    }


kaynaklari_getir = ilgili_kaynaklari_getir
