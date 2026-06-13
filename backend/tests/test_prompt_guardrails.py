from agents.prompt_guardrails import (
    BASE_GUARDRAILS,
    JUDGE_GUARDRAILS,
    YC_GUARDRAILS,
    compose_prompt,
)
from agents.agent_config import YC_SYSTEM_PROMPT, AGENTS


def test_base_guardrails_present_in_all_agents():
    for agent in AGENTS:
        assert "Guardrails (NON-NEGOTIABLE" in agent.system_prompt
        assert "Input classification" in agent.system_prompt
        assert "prompt injection" in agent.system_prompt.lower() or "embedded" in agent.system_prompt.lower()


def test_yc_has_yc_specific_guardrails():
    assert "YC evaluator-specific" in YC_SYSTEM_PROMPT
    assert "cannot accept, reject" in YC_SYSTEM_PROMPT


def test_compose_prompt_appends_blocks():
    core = "Core instructions here."
    result = compose_prompt(core, YC_GUARDRAILS)
    assert core in result
    assert BASE_GUARDRAILS.strip() in result
    assert YC_GUARDRAILS.strip() in result


def test_judge_guardrails_block():
    from agents.synthesis import SYNTHESIS_SYSTEM_PROMPT

    assert "The Judge-specific" in SYNTHESIS_SYSTEM_PROMPT
    assert "do not invent agent scores" in SYNTHESIS_SYSTEM_PROMPT
