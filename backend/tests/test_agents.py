import json
import unittest
from pathlib import Path

from backend.agents import (
    generate_coach_comment,
    generate_final_report,
    generate_profile,
)
from backend.agents.bias_coach_agent import BIAS_LIBRARY, normalize_bias_label


class ProfileAgentTests(unittest.TestCase):
    def test_high_risk_answers_can_produce_bold_profile(self):
        result = generate_profile(
            {
                "answers": [{"selected_text": "Hepsini harcadim"} for _ in range(10)],
                "nakit": 150000,
                "sabir": 50,
                "mutluluk": 55,
                "yillik_gelir": 216000,
            }
        )

        self.assertEqual(result["profile_type"], "Cesur Firsatci")
        self.assertEqual(result["risk_level"], "yuksek")
        self.assertTrue(result["intro_story"])
        self.assertEqual(result["story_source"], "rule_based_fallback")
        self.assertIn("yatırım tavsiyesi değildir", result["disclaimer"])

    def test_empty_answers_return_stable_default_profile(self):
        result = generate_profile({})

        self.assertEqual(result["profile_type"], "Dengeli Stratejist")
        self.assertEqual(result["risk_level"], "orta")

    def test_turkish_characters_risk_inference(self):
        result = generate_profile(
            {
                "answers": [
                    {"selected_text": "Bir şeyler aldım, harcadım"}, # High Risk (score 2)
                    {"selected_text": "Anı yaşarım, birikim ikinci planda"}, # High Risk (score 2)
                    {"selected_text": "Gitmedim, erken çalıştım"}, # High Risk (score 2)
                    {"selected_text": "Evet, aldım ve işe yaradı"}, # High Risk (score 2)
                    {"selected_text": "Evet, aldım ama olmadı"}, # High Risk (score 2)
                    {"selected_text": "Her ay birikim yaparım"}, # Low Risk (score 0)
                    {"selected_text": "Hayır, temkinli davrandım"}, # Low Risk (score 0)
                ],
                "nakit": 150000,
                "sabir": 50,
                "mutluluk": 55,
                "yillik_gelir": 216000,
            }
        )
        # 5 high risk (score 10) + 2 low risk (score 0) = 10 total risk score
        self.assertEqual(result["risk_score"], 10)
        self.assertEqual(result["risk_level"], "orta")

    def test_intro_story_turns_answers_into_life_scenes(self):
        result = generate_profile(
            {
                "answers": [
                    {"question_id": 1, "selected_text": "Orta halli, idare ettik"},
                    {"question_id": 2, "selected_text": "Dengeli bir öğrenciydim"},
                    {"question_id": 3, "selected_text": "Biriktirdim"},
                    {"question_id": 4, "selected_text": "Gittim, burslu"},
                    {"question_id": 5, "selected_text": "Normal yaptım"},
                    {"question_id": 6, "selected_text": "Alanımda iyi bir iş buldum"},
                    {"question_id": 7, "selected_text": "Kira + birikim planı yaptım"},
                    {"question_id": 8, "selected_text": "Sadece manevi destek vardı"},
                    {"question_id": 9, "selected_text": "Hayır, temkinli davrandım"},
                    {"question_id": 10, "selected_text": "Her ay birikim yaparım"},
                ]
            }
        )

        story = result["intro_story"]
        self.assertIn("Çocukluğun", story)
        self.assertIn("İlk iş kapısı", story)
        self.assertIn("Bu seçimlerin sonunda 25 yaşına", story)
        self.assertEqual(story.count("\n\n"), 1)
        self.assertLess(len(story), 1000)
        self.assertNotIn('"Orta halli, idare ettik"', story)

    def test_all_profile_types_are_reachable_with_distinct_states(self):
        scenarios = {
            "Koruyucu Yatirimci": (355000, 80, 80, [1, 1, 0, 0, 1, 0, 0, 0, 2, 0]),
            "Guvenli Planlayici": (215000, 80, 70, [1, 1, 0, 0, 1, 0, 0, 0, 2, 0]),
            "Dengeli Stratejist": (255000, 70, 80, [1, 1, 0, 0, 1, 0, 0, 1, 2, 2]),
            "Sabirli Biriktirici": (115000, 70, 80, [1, 1, 0, 0, 1, 0, 0, 1, 2, 2]),
            "Konfor Odakli": (190000, 70, 80, [1, 1, 0, 2, 1, 1, 2, 2, 1, 0]),
            "Cesur Firsatci": (20000, 70, 80, [1, 1, 2, 2, 1, 1, 2, 2, 1, 0]),
        }

        for expected_profile, (cash, patience, happiness, risks) in scenarios.items():
            with self.subTest(expected_profile=expected_profile):
                result = generate_profile(
                    {
                        "answers": [
                            {"effects": {"risk": risk}}
                            for risk in risks
                        ],
                        "nakit": cash,
                        "sabir": patience,
                        "mutluluk": happiness,
                    }
                )
                self.assertEqual(result["profile_type"], expected_profile)
                self.assertEqual(result["classification_model"], "weighted_prototypes_v1")


class BiasCoachAgentTests(unittest.TestCase):
    def test_registered_biases_return_their_turkish_names(self):
        expected_names = {
            "loss_aversion": "Kayıptan Kaçınma",
            "anchoring": "Referans Noktasına Takılma",
            "mental_accounting": "Zihinsel Muhasebe",
            "overconfidence": "Aşırı Özgüven",
            "herd_behavior": "Sürü Davranışı",
            "disposition_effect": "Kazananı Erken Satma Eğilimi",
            "present_bias": "Bugüne Aşırı Odaklanma",
            "status_quo_bias": "Mevcut Durumu Koruma Eğilimi",
        }

        for bias_label, expected_name in expected_names.items():
            with self.subTest(bias_label=bias_label):
                result = generate_coach_comment({"bias_label": bias_label})
                self.assertEqual(result["bias_name_tr"], expected_name)
                self.assertTrue(result["reflection_question"])
                self.assertIn("yatırım tavsiyesi değildir", result["disclaimer"])

    def test_event_aliases_return_specific_coach_comments(self):
        expected = {
            "asiri_ozguven": ("overconfidence", "Aşırı Özgüven"),
            "status_quo": ("status_quo_bias", "Mevcut Durumu Koruma Eğilimi"),
        }

        for source_label, (canonical_label, expected_name) in expected.items():
            with self.subTest(source_label=source_label):
                result = generate_coach_comment({"bias_label": source_label})
                self.assertEqual(result["bias_label"], canonical_label)
                self.assertEqual(result["bias_name_tr"], expected_name)

    def test_coach_is_silent_between_meaningful_thresholds(self):
        history = [
            {"bias_label": "loss_aversion"},
            {"bias_label": "loss_aversion"},
        ]
        result = generate_coach_comment(
            {
                "bias_label": "loss_aversion",
                "event_title": "Piyasa düştü",
                "selected_option": "Bekledim",
                "event_history": history,
            }
        )

        self.assertFalse(result["should_show"])
        self.assertEqual(result["occurrence_count"], 2)
        self.assertIn("Piyasa düştü", result["coach_comment"])

    def test_every_event_label_has_a_registered_coach_entry(self):
        project_root = Path(__file__).resolve().parents[2]
        events_path = project_root / "backend" / "events" / "events.json"
        with events_path.open(encoding="utf-8") as events_file:
            events = json.load(events_file)

        labels = {
            normalize_bias_label(event.get("bias_etiketi", "bilinmiyor"))
            for event in events
        }
        self.assertEqual(labels - set(BIAS_LIBRARY), set())


class FinalReportAgentTests(unittest.TestCase):
    def test_dominant_bias_and_zero_final_values_are_preserved(self):
        result = generate_final_report(
            {
                "profile": {"profile_name": "Dengeli Stratejist"},
                "event_history": [
                    {"bias": "loss_aversion"},
                    {"bias_label": "loss_aversion"},
                    {"bias_etiketi": "anchoring"},
                ],
                "final_state": {
                    "year": 0,
                    "age": 0,
                    "cash": 0,
                    "net_worth": 0,
                },
            }
        )

        self.assertEqual(result["decision_count"], 3)
        self.assertEqual(result["dominant_bias"], "loss_aversion")
        self.assertEqual(
            result["final_state"],
            {"year": 0, "age": 0, "cash": 0, "net_worth": 0},
        )

    def test_empty_history_returns_a_safe_report(self):
        result = generate_final_report({"event_history": []})

        self.assertEqual(result["decision_count"], 0)
        self.assertIsNone(result["dominant_bias"])
        self.assertTrue(result["strengths"])
        self.assertTrue(result["growth_areas"])

    def test_aliases_are_combined_in_final_report(self):
        result = generate_final_report(
            {
                "event_history": [
                    {"bias": "status_quo"},
                    {"bias": "status_quo_bias"},
                    {"bias": "asiri_ozguven"},
                ]
            }
        )

        self.assertEqual(result["dominant_bias"], "status_quo_bias")
        self.assertEqual(result["dominant_bias_name_tr"], "Mevcut Durumu Koruma Eğilimi")
        self.assertEqual(result["bias_breakdown"][0]["count"], 2)


if __name__ == "__main__":
    unittest.main()
