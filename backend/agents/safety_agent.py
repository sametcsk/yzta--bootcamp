import re


RISKY_PATTERNS = {
    "kesin_yatirim_tavsiyesi": re.compile(
        r"\b(?:"
        r"(?:bunu|şunu|hisseyi|varlığı|yatırımı)\s+(?:almalısın|satmalısın)|"
        r"kesinlikle\s+(?:al|sat)|"
        r"(?:portföyüne|portfoyune)\s+(?:ekle|kat)|"
        r"yatırım\s+yap(?:malısın)?"
        r")\b",
        re.IGNORECASE,
    ),
    "garanti_getiri": re.compile(
        r"\b(?:garanti\s+(?:getiri|kazanç)|getirisi\s+garantili|risksiz\s+kazanç|"
        r"kesin\s+kazandırır|zarar\s+etmezsin|güvenli\s+getiri\s+sağlar)\b",
        re.IGNORECASE,
    ),
    "klinik_teshis": re.compile(r"\b(klinik teşhis|psikolojik tanı|ruhsal bozukluk)\b", re.IGNORECASE),
    "kucumseyici_dil": re.compile(r"\b(aptal|beceriksiz|cahil|akılsız|kötü yatırımcı)\b", re.IGNORECASE),
}


def guvenlik_kontrolu(text: str | None) -> dict:
    content = (text or "").strip()
    violations = [name for name, pattern in RISKY_PATTERNS.items() if pattern.search(content)]
    if content and (len(content) < 30 or not re.search(r"[.!?][\"')\]]?$", content)):
        violations.append("eksik_veya_yarim_metin")
    return {"approved": bool(content) and not violations, "violations": violations}


def guvenli_metin_veya_fallback(generated_text: str | None, fallback_text: str) -> tuple[str, bool]:
    result = guvenlik_kontrolu(generated_text)
    if result["approved"]:
        return generated_text.strip(), True
    return fallback_text, False


guvenlik_kontrolu_yap = guvenlik_kontrolu
