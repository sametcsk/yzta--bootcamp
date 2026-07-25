from typing import Callable

from .bias_coach_agent import generate_coach_comment
from .decision_analyst_agent import analyze_decision
from .final_report_agent import generate_final_report
from .learning_plan_agent import generate_learning_plan
from .memory_agent import build_agent_memory
from .profile_agent import generate_profile
from .rag_service import ilgili_kaynaklari_getir
from .safety_agent import guvenlik_kontrolu

try:
    from langchain_core.runnables import RunnableLambda

    LANGCHAIN_AVAILABLE = True
except ImportError:
    RunnableLambda = None
    LANGCHAIN_AVAILABLE = False


COACH_SAFE_FALLBACK = "Bu kararın planın ve uzun vadeli hedeflerinle ilişkisini yeniden değerlendirebilirsin."
REPORT_SAFE_FALLBACK = "Karar geçmişin davranışsal finans farkındalığı amacıyla değerlendirildi; kesin bir yargıya varmak için yeterli güvenli metin üretilemedi."
LEARNING_SAFE_TOPICS = ["Karar gerekçesini kaydetme", "Alternatif senaryoları karşılaştırma"]
LEARNING_SAFE_PRACTICES = ["Bir sonraki benzer eventte karar vermeden önce gerekçeni yaz."]


def _run_python_steps(initial_state: dict, steps: list[Callable[[dict], dict]]) -> dict:
    state = initial_state
    for step in steps:
        state = step(state)
    return state


def _run_steps(initial_state: dict, steps: list[Callable[[dict], dict]]) -> tuple[dict, str]:
    if LANGCHAIN_AVAILABLE:
        try:
            chain = RunnableLambda(steps[0])
            for step in steps[1:]:
                chain = chain | RunnableLambda(step)
            return chain.invoke(initial_state), "langchain_runnable"
        except Exception:
            return _run_python_steps(initial_state, steps), "python_fallback_after_langchain_error"

    return _run_python_steps(initial_state, steps), "python_fallback"


def _profile_step(state: dict) -> dict:
    return {**state, "result": generate_profile(state["request"])}


def _decision_step(state: dict) -> dict:
    return {
        **state,
        "agent_memory": build_agent_memory(state["request"]),
        "decision_analysis": analyze_decision(state["request"]),
    }


def _coach_rag_step(state: dict) -> dict:
    analysis = state["decision_analysis"]
    request = state["request"]
    query = " ".join(
        value
        for value in (
            request.get("event_title") or request.get("event_baslik"),
            request.get("selected_option") or request.get("secim_metin"),
            analysis.get("evidence"),
        )
        if value
    )
    sources = ilgili_kaynaklari_getir(
        analysis["detected_bias"],
        "bias_coach_agent",
        query=query,
        limit=2,
    )
    return {**state, "rag_sources": sources}


def _coach_step(state: dict) -> dict:
    request = {
        **state["request"],
        "decision_analysis": state["decision_analysis"],
        "agent_memory": state["agent_memory"],
        "rag_sources": state["rag_sources"],
    }
    return {**state, "result": generate_coach_comment(request)}


def _coach_safety_step(state: dict) -> dict:
    result = state["result"]
    safety = guvenlik_kontrolu(result.get("coach_comment"))
    if not safety["approved"]:
        result = {
            **result,
            "coach_comment": COACH_SAFE_FALLBACK,
            "generation_source": "safety_fallback",
        }
    return {**state, "result": {**result, "safety_check": safety}}


def _generate_report_with_sources_step(state: dict) -> dict:
    report = generate_final_report(state["request"])
    return {**state, "result": report, "rag_sources": report.get("sources", [])}


def _report_safety_step(state: dict) -> dict:
    report = state["result"]
    safety = guvenlik_kontrolu(report.get("summary"))
    if not safety["approved"]:
        report = {
            **report,
            "summary": REPORT_SAFE_FALLBACK,
            "generation_source": "safety_fallback",
        }
    return {**state, "result": {**report, "safety_check": safety}}


def _learning_step(state: dict) -> dict:
    report = state["result"]
    learning_plan = generate_safe_learning_plan({"report": report})
    return {**state, "result": {**report, "learning_plan": learning_plan}}


def generate_safe_learning_plan(data: dict) -> dict:
    learning_plan = generate_learning_plan(data)
    learning_text = " ".join(learning_plan.get("learning_topics", []) + learning_plan.get("game_practices", []))
    safety = guvenlik_kontrolu(learning_text)
    if not safety["approved"]:
        learning_plan = {
            **learning_plan,
            "learning_topics": LEARNING_SAFE_TOPICS,
            "game_practices": LEARNING_SAFE_PRACTICES,
            "generation_source": "safety_fallback",
        }
    return {**learning_plan, "safety_check": safety}


FLOW_STEPS = {
    "profile": [_profile_step],
    "coach": [_decision_step, _coach_rag_step, _coach_step, _coach_safety_step],
    "final_report": [_generate_report_with_sources_step, _report_safety_step, _learning_step],
}


def run_agent_flow(flow_name: str, data: dict) -> dict:
    if flow_name not in FLOW_STEPS:
        raise ValueError(f"Bilinmeyen agent akışı: {flow_name}")
    state, orchestration = _run_steps({"request": data}, FLOW_STEPS[flow_name])
    result = state["result"]
    return {
        **result,
        "orchestration": orchestration,
    }


ajan_akisini_calistir = run_agent_flow
