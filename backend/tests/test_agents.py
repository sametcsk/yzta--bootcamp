import unittest

from backend.agents import (
    generate_coach_comment,
    generate_final_report,
    generate_profile,
)


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
        self.assertIn("yatirim tavsiyesi degildir", result["disclaimer"])

    def test_empty_answers_return_stable_default_profile(self):
        result = generate_profile({})

        self.assertEqual(result["profile_type"], "Dengeli Stratejist")
        self.assertEqual(result["risk_level"], "orta")


class BiasCoachAgentTests(unittest.TestCase):
    def test_registered_biases_return_their_turkish_names(self):
        expected_names = {
            "loss_aversion": "Kayiptan Kacinma",
            "anchoring": "Referans Noktasina Takilma",
            "mental_accounting": "Zihinsel Muhasebe",
            "overconfidence": "Asiri Ozguven",
            "herd_behavior": "Suru Davranisi",
            "disposition_effect": "Kazanani Erken Satma Egilimi",
            "present_bias": "Bugune Asiri Odaklanma",
            "status_quo_bias": "Mevcut Durumu Koruma Egilimi",
        }

        for bias_label, expected_name in expected_names.items():
            with self.subTest(bias_label=bias_label):
                result = generate_coach_comment({"bias_label": bias_label})
                self.assertEqual(result["bias_name_tr"], expected_name)
                self.assertTrue(result["reflection_question"])
                self.assertIn("yatirim tavsiyesi degildir", result["disclaimer"])


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


if __name__ == "__main__":
    unittest.main()
