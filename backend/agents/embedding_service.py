import hashlib
import math
import os
import re
from functools import lru_cache


DEFAULT_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
HASH_EMBEDDING_DIMENSION = 384
TOKEN_PATTERN = re.compile(
    r"[0-9a-zA-Z\u00e7\u011f\u0131\u00f6\u015f\u00fc"
    r"\u00c7\u011e\u0130\u00d6\u015e\u00dc]+",
    re.UNICODE,
)


def _truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector] if norm else vector


def _hash_embedding(text: str, dimension: int = HASH_EMBEDDING_DIMENSION) -> list[float]:
    vector = [0.0] * dimension
    tokens = [token.casefold() for token in TOKEN_PATTERN.findall(text or "")]
    features = tokens + [f"{left}_{right}" for left, right in zip(tokens, tokens[1:])]
    for feature in features:
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "big") % dimension
        sign = 1.0 if digest[4] & 1 else -1.0
        vector[index] += sign
    return _normalize(vector)


@lru_cache(maxsize=2)
def _sentence_transformer(model_name: str):
    from sentence_transformers import SentenceTransformer

    allow_download = _truthy(os.getenv("FINSIM_ALLOW_MODEL_DOWNLOAD"))
    return SentenceTransformer(model_name, local_files_only=not allow_download)


def metinleri_embeddinge_cevir(
    texts: list[str],
    preferred_backend: str | None = None,
) -> tuple[list[list[float]], str]:
    if not texts:
        return [], "hash_embedding"

    configured_backend = (
        preferred_backend
        or os.getenv("FINSIM_EMBEDDING_BACKEND")
        or "sentence_transformers"
    )
    model_name = os.getenv("FINSIM_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
    if configured_backend != "hash_embedding":
        try:
            model = _sentence_transformer(model_name)
            batch_size = max(
                1,
                min(32, int(os.getenv("FINSIM_EMBEDDING_BATCH_SIZE", "8"))),
            )
            group_size = max(
                1,
                min(16, int(os.getenv("FINSIM_EMBEDDING_GROUP_SIZE", "1"))),
            )
            vectors = []
            for start in range(0, len(texts), group_size):
                batch_vectors = model.encode(
                    texts[start : start + group_size],
                    batch_size=batch_size,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                )
                vectors.extend(vector.tolist() for vector in batch_vectors)
            return vectors, f"sentence_transformers:{model_name}"
        except Exception:
            pass

    return [_hash_embedding(text) for text in texts], "hash_embedding"


def kosinus_benzerligi(left: list[float], right: list[float]) -> float:
    if not left or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


embedding_uret = metinleri_embeddinge_cevir
