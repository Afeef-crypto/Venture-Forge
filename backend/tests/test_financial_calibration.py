from utils.financial_calibration import calibrate_biz_financials, _needs_calibration, _detect_segment


def test_edtech_unrealistic_cac_gets_calibrated():
    idea = "PREPHELP V1 — AI study companion for university engineering students on campus."
    parsed = {
        "summary": "Test summary.",
        "revenue_model": "subscription",
        "estimated_cac": "$500–$1,500 per student via subscription; payback 12–18 mo; LTV:CAC 2:1",
        "ltv_potential": "$1,000–$3,000 lifetime gross profit at $50–100 ARPU",
        "monthly_burn": "$30,000–$50,000/mo for 10–15 people",
        "initial_investment": "$200,000–$500,000",
        "break_even": "18 months",
    }
    out = calibrate_biz_financials(idea, parsed)
    assert "$500" not in out["estimated_cac"]
    assert "$20" in out["estimated_cac"] or "$25" in out["estimated_cac"]
    assert "10–15" not in out["monthly_burn"]
    assert "Calibrated" in out["summary"]


def test_realistic_edtech_passes_through():
    idea = "Campus study app for students."
    parsed = {
        "summary": "OK economics.",
        "revenue_model": "Freemium at $9/mo for students with campus ambassador GTM.",
        "estimated_cac": "$35–$70 per paying student via ambassadors and TikTok",
        "ltv_potential": "$80–$130 lifetime gross profit over 3 semesters at $9/mo",
        "monthly_burn": "$18,000/mo — 3 FTE, $2k infra, $3k marketing",
        "initial_investment": "$120,000",
        "break_even": "900 paying students",
    }
    out = calibrate_biz_financials(idea, dict(parsed))
    assert out["estimated_cac"] == parsed["estimated_cac"]


def test_detect_edtech_segment():
    seg = _detect_segment("AI copilot helping college students with exam prep")
    assert seg.id == "edtech"
