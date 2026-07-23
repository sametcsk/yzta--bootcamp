import os
from unittest.mock import patch
from urllib.error import HTTPError

import pytest

from agents.bias_catalog import normalize_bias_label
from agents.bias_coach_agent import generate_coach_comment
from agents.final_report_agent import calculate_bias_scores, generate_final_report
from agents.llm_client import DEFAULT_GEMINI_MODEL, metin_uret
from agents.memory_agent import build_agent_memory
from agents.profile_agent import generate_profile
from agents.rag_service import ilgili_kaynaklari_getir
from agents.safety_agent import guvenlik_kontrolu
from agents.decision_analyst_agent import analyze_decision
from agents import orchestrator
from agents import llm_client


@pytest.fixture(autouse=True)
def agent_testlerini_agdan_yalit(monkeypatch):
    for name in (
        "GEMINI_API_KEY",
        "GEMINI_MODEL",
        "REQUIRE_LLM",
        "LANGCHAIN_API_KEY",
        "LANGCHAIN_TRACING_V2",
        "LANGCHAIN_TRACING",
        "LANGSMITH_API_KEY",
        "LANGSMITH_TRACING",
    ):
        monkeypatch.delenv(name, raising=False)

    def unexpected_network_call(*args, **kwargs):
        raise AssertionError("Agent testinde gerçek ağ çağrısı yapılmamalı.")

    monkeypatch.setattr(llm_client, "urlopen", unexpected_network_call)


def test_api_key_yokken_profile_fallback_calismaya_devam_eder():
    with patch.dict(os.environ, {}, clear=True):
        result = generate_profile({"cash": 0, "answers": []})
    assert result["story_source"] == "rule_based_fallback"
    assert result["starting_cash"] == 0
    assert result["intro_story"]


def test_llm_client_api_key_istemeden_fallback_doner():
    with patch.dict(os.environ, {}, clear=True):
        result = metin_uret("sistem", "kullanıcı")
    assert result["status"] == "disabled"
    assert result["text"] is None
    assert result["llm_enabled"] is False
    assert result["model"] == "gemini-2.5-flash"
    assert DEFAULT_GEMINI_MODEL == "gemini-2.5-flash"


def test_llm_client_key_verilse_bile_testte_ag_cagrisi_fail_fast_olur(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-key")
    with pytest.raises(AssertionError, match="gerçek ağ çağrısı"):
        metin_uret("sistem", "kullanıcı")


def test_api_key_varken_llm_hatasi_acikca_isaretlenir(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-key")

    def model_not_found(*args, **kwargs):
        raise HTTPError("https://example.invalid", 404, "Not Found", None, None)

    monkeypatch.setattr(llm_client, "urlopen", model_not_found)
    result = generate_profile({"answers": []})
    assert result["llm_enabled"] is True
    assert result["generation_source"] == "llm_error"
    assert result["llm_error_type"] == "model_not_found"
    assert result["intro_story"]


def test_require_llm_false_hata_bilgisiyle_fallback_doner(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-key")
    monkeypatch.setenv("REQUIRE_LLM", "false")

    def rate_limited(*args, **kwargs):
        raise HTTPError("https://example.invalid", 429, "Rate Limited", None, None)

    monkeypatch.setattr(llm_client, "urlopen", rate_limited)
    from main import _agent_response

    result = _agent_response("profile", {"answers": []})
    assert result["generation_source"] == "llm_error"
    assert result["llm_error_type"] == "rate_limit"
    assert result["intro_story"]


def test_require_llm_true_kontrollu_503_doner(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-key")
    monkeypatch.setenv("REQUIRE_LLM", "true")

    def auth_error(*args, **kwargs):
        raise HTTPError("https://example.invalid", 403, "Forbidden", None, None)

    monkeypatch.setattr(llm_client, "urlopen", auth_error)
    from fastapi import HTTPException
    from main import _agent_response

    with pytest.raises(HTTPException) as error:
        _agent_response("profile", {"answers": []})
    assert error.value.status_code == 503
    assert error.value.detail["llm_error_type"] == "auth_error"
    assert error.value.detail["fallback_response"]["intro_story"]


def test_bias_aliaslari_kanonik_etikete_donusur():
    assert normalize_bias_label("herding") == "herd_behavior"
    assert normalize_bias_label("status_quo") == "status_quo_bias"
    assert normalize_bias_label("batik_maliyet") == "sunk_cost"


def test_coach_extended_biaslari_bosa_dusurmez():
    for label, expected in (("sunk_cost", "Batık Maliyet Yanılgısı"), ("moral_hazard", "Ahlaki Tehlike")):
        result = generate_coach_comment({"bias_label": label, "event_history": [{"bias_label": label}]})
        assert result["bias_name_tr"] == expected
        assert result["should_show"] is True


def test_decision_analyst_yapilandirilmis_sonuc_doner():
    result = analyze_decision({
        "event_title": "Kalabalık alıyor",
        "selected_option": "Takip et",
        "bias_label": "herding",
        "bias_scores": {"herd_behavior": 72},
        "event_history": [{"bias_label": "herding"}],
    })
    assert result["detected_bias"] == "herd_behavior"
    assert result["decision_count"] == 1
    assert result["occurrence_count"] == 1
    assert result["evidence"]
    assert result["profile_bias_score"] == 72
    assert "72/100" in result["evidence"]


def test_agent_hafizasi_tekrarlari_ve_son_kararlari_ozetler():
    history = [
        {"year": 2026, "event_title": "Telefon", "selected_option": "Hemen al", "bias_label": "present_bias"},
        {"year": 2027, "event_title": "Tatil", "selected_option": "Şimdi harca", "bias_label": "present_bias"},
        {"year": 2028, "event_title": "Fiyat", "selected_option": "Eski fiyatı bekle", "bias_label": "anchoring"},
    ]
    memory = build_agent_memory({
        "event_history": history,
        "bias_scores": {"present_bias": 85},
        "previous_coach_insights": [{"coach_comment": "İlk yorum"}],
    })
    assert memory["decision_count"] == 3
    assert memory["bias_counts"]["present_bias"] == 2
    assert memory["repeated_biases"][0]["bias_label"] == "present_bias"
    assert len(memory["recent_decisions"]) == 3
    assert memory["profile_bias_scores"]["present_bias"] == 85
    assert memory["previous_coach_insights"][0]["coach_comment"] == "İlk yorum"


def test_profile_fallback_hikayesi_somut_intro_detaylarini_kullanir():
    answers = [
        {"question_id": 1, "selected_text": "Mütevazı destek", "bias_skor": {"zorluk": "Orta"}},
        {"question_id": 2, "selected_text": "Kesin ödülü seçtim", "bias_skor": {"loss_aversion": 100}},
        {"question_id": 3, "selected_text": "Beklenmedik parayı harcadım", "bias_skor": {"mental_accounting": 90}},
        {"question_id": 4, "selected_text": "Eski maliyete takıldım", "bias_skor": {"anchoring": 80}},
    ]
    result = generate_profile({"answers": answers})
    assert result["generation_source"] == "rule_based_fallback"
    assert len(result["story_details"]) == 3
    assert "Kesin ödülü seçtim" in result["intro_story"]
    assert "Beklenmedik parayı harcadım" in result["intro_story"]
    assert result["story_biases"] == ["loss_aversion", "mental_accounting"]


def test_coach_akisi_hafiza_ozetini_response_icinde_dondurur(monkeypatch):
    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", False)
    history = [
        {"bias_label": "present_bias"},
        {"bias_label": "present_bias"},
        {"bias_label": "present_bias"},
    ]
    result = orchestrator.run_agent_flow("coach", {
        "event_title": "Yeni telefon",
        "selected_option": "Hemen al",
        "bias_label": "present_bias",
        "event_history": history,
    })
    assert result["agent_memory"]["decision_count"] == 3
    assert result["agent_memory"]["bias_counts"]["present_bias"] == 3
    assert result["should_show"] is True


def test_coach_tekrar_arasinda_sessiz_kalir():
    history = [{"bias_label": "anchoring"}, {"bias_label": "anchoring"}]
    result = generate_coach_comment({"bias_label": "anchoring", "event_history": history})
    assert result["should_show"] is False


def test_final_report_intro_ve_oyun_verisini_30_70_birlestirir():
    analysis = calculate_bias_scores({}, {"loss_aversion": 20}, [{"bias_label": "loss_aversion"}])
    assert analysis["scores"]["loss_aversion"] == 76
    assert analysis["weights"] == {"intro": 0.3, "gameplay": 0.7}


def test_oyun_gecmisinde_daha_sik_bias_daha_yuksek_skorlanir():
    history = [
        {"bias_label": "loss_aversion"},
        {"bias_label": "loss_aversion"},
        {"bias_label": "anchoring"},
    ]
    analysis = calculate_bias_scores({}, {}, history)
    assert analysis["scores"]["loss_aversion"] > analysis["scores"]["anchoring"]


def test_final_report_veri_yokken_bias_uydurmaz():
    result = generate_final_report({"profile": {}, "event_history": [], "final_state": {}})
    assert result["dominant_bias"] is None
    assert result["dominant_bias_name_tr"] == "Yeterli veri yok"
    assert "llm_prompt_payload" not in result


def test_rag_ilgili_kaynagi_secer():
    sources = ilgili_kaynaklari_getir("mental_accounting", "bias_coach_agent")
    assert sources
    assert "mental_accounting" in sources[0]["bias_labels"]


def test_safety_riskli_dili_yakalar():
    risky_texts = (
        "Bunu almalısın.",
        "Portföyüne ekle.",
        "Bu kesin kazandırır.",
        "Zarar etmezsin.",
        "Güvenli getiri sağlar.",
        "Garanti kazanç elde edersin.",
        "Bu klinik teşhis sonucudur.",
        "Sen beceriksiz bir yatırımcısın.",
    )
    assert all(not guvenlik_kontrolu(text)["approved"] for text in risky_texts)
    assert guvenlik_kontrolu("Bu karardan ders al ve not al.")["approved"] is True
    assert guvenlik_kontrolu("Karar almadan önce gerekçeni düşün.")["approved"] is True


def test_safety_yarim_llm_cumlesini_reddeder():
    result = guvenlik_kontrolu("18 yaşındasın ve finansal yolculuğuna")
    assert result["approved"] is False
    assert "eksik_veya_yarim_metin" in result["violations"]


def test_response_contractlari_korunur():
    profile = generate_profile({"answers": []})
    coach = generate_coach_comment({"bias_label": "loss_aversion", "event_history": []})
    report = generate_final_report({"profile": profile, "event_history": [], "final_state": {}})
    assert {"profile_type", "profile_name", "risk_level", "time_horizon", "intro_story"} <= profile.keys()
    assert {"coach_title", "bias_name_tr", "coach_comment", "reflection_question", "should_show"} <= coach.keys()
    assert {"title", "profile_name", "decision_count", "dominant_bias_name_tr", "summary", "strengths", "growth_areas"} <= report.keys()


def test_langchain_olmadan_python_fallback_akisi_calismaya_devam_eder(monkeypatch):
    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", False)
    result = orchestrator.run_agent_flow("coach", {
        "event_title": "Eski fiyata dönüş",
        "selected_option": "Bekle",
        "bias_label": "anchoring",
        "event_history": [{"bias_label": "anchoring"}],
    })
    assert result["orchestration"] == "python_fallback"
    assert result["decision_analysis"]["detected_bias"] == "anchoring"
    assert result["safety_check"]["approved"] is True


def test_langchain_runtime_hatasinda_python_fallback_calismaya_devam_eder(monkeypatch):
    class BrokenRunnable:
        def __init__(self, function):
            self.function = function

        def __or__(self, other):
            return self

        def invoke(self, state):
            raise RuntimeError("LangChain runtime hatası")

    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", True)
    monkeypatch.setattr(orchestrator, "RunnableLambda", BrokenRunnable)
    result = orchestrator.run_agent_flow("profile", {"answers": []})
    assert result["orchestration"] == "python_fallback_after_langchain_error"
    assert result["intro_story"]


def test_orchestrator_unsafe_coach_metinini_fallback_ile_degistirir(monkeypatch):
    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", False)
    monkeypatch.setattr(orchestrator, "generate_coach_comment", lambda data: {
        "coach_comment": "Bunu almalısın.",
        "should_show": True,
    })
    result = orchestrator.run_agent_flow("coach", {
        "bias_label": "anchoring",
        "event_history": [{"bias_label": "anchoring"}],
    })
    assert result["safety_check"]["approved"] is False
    assert result["coach_comment"] == orchestrator.COACH_SAFE_FALLBACK
    assert result["generation_source"] == "safety_fallback"


def test_orchestrator_unsafe_final_ve_learning_metinlerini_degistirir(monkeypatch):
    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", False)
    monkeypatch.setattr(orchestrator, "generate_final_report", lambda data: {
        "summary": "Bu yatırım kesin kazandırır.",
        "dominant_bias": None,
        "sources": [],
    })
    monkeypatch.setattr(orchestrator, "generate_learning_plan", lambda data: {
        "learning_topics": ["Portföyüne ekle."],
        "game_practices": [],
    })
    result = orchestrator.run_agent_flow("final_report", {})
    assert result["safety_check"]["approved"] is False
    assert result["summary"] == orchestrator.REPORT_SAFE_FALLBACK
    assert result["learning_plan"]["safety_check"]["approved"] is False
    assert result["learning_plan"]["learning_topics"] == orchestrator.LEARNING_SAFE_TOPICS


def test_standalone_learning_plan_safety_kapisindan_gecer(monkeypatch):
    monkeypatch.setattr(orchestrator, "generate_learning_plan", lambda data: {
        "learning_topics": ["Portföyüne ekle."],
        "game_practices": [],
    })
    result = orchestrator.generate_safe_learning_plan({})
    assert result["safety_check"]["approved"] is False
    assert result["learning_topics"] == orchestrator.LEARNING_SAFE_TOPICS
    assert result["generation_source"] == "safety_fallback"


def test_final_flow_learning_plan_ekler(monkeypatch):
    monkeypatch.setattr(orchestrator, "LANGCHAIN_AVAILABLE", False)
    result = orchestrator.run_agent_flow("final_report", {
        "profile": {"bias_scores": {"loss_aversion": 50}},
        "event_history": [{"bias_label": "loss_aversion"}],
        "final_state": {},
    })
    assert result["learning_plan"]["learning_topics"]
    assert result["learning_plan"]["safety_check"]["approved"] is True


def test_agent_endpoint_aliaslari_korunur():
    from main import app

    paths = {route.path for route in app.routes}
    assert {
        "/agents/profile", "/ajanlar/profil",
        "/agents/coach", "/ajanlar/koc",
        "/agents/final-report", "/ajanlar/final-rapor",
        "/agents/learning-plan", "/ajanlar/ogrenme-plani",
    } <= paths
