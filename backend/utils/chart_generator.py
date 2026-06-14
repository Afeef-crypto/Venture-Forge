"""
backend/utils/chart_generator.py

Matplotlib chart generators for the PDF export.

Both functions return a BytesIO PNG buffer that is passed directly to
ReportLab's Image() flowable — no temp files on disk.

Matplotlib is set to the non-interactive 'Agg' backend at module load
time so it works safely inside an async FastAPI process.
"""

from __future__ import annotations

import io
import math

import matplotlib
matplotlib.use("Agg")           # must be set before any pyplot import
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ---------------------------------------------------------------------------
# Venture Forge brand palette
# ---------------------------------------------------------------------------
VF_ORANGE  = "#E85D26"
VF_DARK    = "#1A1A1A"
VF_LIGHT   = "#F5F0EB"
VF_GREY    = "#8C8C8C"
VF_GRID    = "#E8E8E8"

INDUSTRY_COLOR = "#3B82F6"    # blue for the bar chart bars
RADAR_FILL     = "#E85D26"    # orange fill for radar
RADAR_EDGE     = "#C44A1A"    # darker orange outline


# ---------------------------------------------------------------------------
# Chart 1 — Industry Comparison Bar Chart
# ---------------------------------------------------------------------------

def generate_industry_bar_chart(
    startup_score: int,
    industry: str = "Technology",
) -> io.BytesIO:
    """
    Horizontal bar chart comparing the startup's overall score to the
    average score in 5 industry benchmarks.

    The benchmark values are illustrative market medians that provide
    useful context without needing a live database.

    Returns a PNG BytesIO buffer ready for ReportLab Image().
    """
    industries = ["Technology", "Fintech", "Healthcare", "Marketplace", "EdTech"]
    # Illustrative median evaluation scores per industry
    benchmarks = [62, 58, 55, 60, 53]

    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    fig.patch.set_facecolor(VF_LIGHT)
    ax.set_facecolor(VF_LIGHT)

    y_pos = np.arange(len(industries))
    bar_colors = [
        VF_ORANGE if ind == industry else INDUSTRY_COLOR
        for ind in industries
    ]

    bars = ax.barh(
        y_pos,
        benchmarks,
        color=bar_colors,
        height=0.55,
        zorder=3,
    )

    # Overlay the startup's score as a dashed vertical line
    ax.axvline(
        startup_score,
        color=VF_DARK,
        linewidth=1.8,
        linestyle="--",
        zorder=4,
        label=f"Your startup: {startup_score}/100",
    )

    # Value labels inside bars
    for bar, val in zip(bars, benchmarks):
        ax.text(
            val + 0.8,
            bar.get_y() + bar.get_height() / 2,
            f"{val}",
            va="center",
            ha="left",
            fontsize=9,
            color=VF_DARK,
            fontweight="bold",
        )

    ax.set_yticks(y_pos)
    ax.set_yticklabels(industries, fontsize=10, color=VF_DARK)
    ax.set_xlabel("Average Evaluation Score / 100", fontsize=9, color=VF_GREY, labelpad=6)
    ax.set_xlim(0, 110)
    ax.set_title(
        "Industry Benchmark Comparison",
        fontsize=13,
        fontweight="bold",
        color=VF_DARK,
        pad=12,
    )

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(VF_GRID)
    ax.spines["bottom"].set_color(VF_GRID)
    ax.tick_params(colors=VF_GREY, length=0)
    ax.xaxis.grid(True, color=VF_GRID, zorder=0)
    ax.set_axisbelow(True)

    legend_patch = mpatches.Patch(color=VF_ORANGE, label=f"Selected industry ({industry})")
    other_patch  = mpatches.Patch(color=INDUSTRY_COLOR, label="Other industries")
    line_handle  = plt.Line2D([0], [0], color=VF_DARK, linestyle="--", linewidth=1.8,
                               label=f"Your score: {startup_score}/100")
    ax.legend(
        handles=[legend_patch, other_patch, line_handle],
        loc="lower right",
        fontsize=8,
        framealpha=0.9,
    )

    plt.tight_layout(pad=1.5)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=VF_LIGHT)
    plt.close(fig)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Chart 2 — Multi-Agent Radar Chart
# ---------------------------------------------------------------------------

def generate_radar_chart(agent_scores: dict[str, int]) -> io.BytesIO:
    """
    Radar / spider chart showing each specialist agent's score.

    ``agent_scores`` maps a display label to a 0-100 integer.

    Returns a PNG BytesIO buffer ready for ReportLab Image().
    """
    if not agent_scores:
        agent_scores = {
            "YC Partner": 0,
            "Tech Auditor": 0,
            "Business CFO": 0,
            "Marketing Expert": 0,
            "Demand Intel": 0,
            "The Judge": 0,
        }

    labels = list(agent_scores.keys())
    values = [agent_scores[k] for k in labels]
    N = len(labels)

    # Angles — one per agent, closing the polygon
    angles = [n / float(N) * 2 * math.pi for n in range(N)]
    angles += angles[:1]
    values_plot = values + values[:1]

    fig, ax = plt.subplots(figsize=(5.5, 5.5), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor(VF_LIGHT)
    ax.set_facecolor(VF_LIGHT)

    # Gridlines
    ax.set_rlabel_position(30)
    plt.yticks(
        [20, 40, 60, 80, 100],
        ["20", "40", "60", "80", "100"],
        color=VF_GREY,
        size=7,
    )
    plt.ylim(0, 100)

    # Draw the radar polygon
    ax.plot(angles, values_plot, color=RADAR_EDGE, linewidth=2, linestyle="solid")
    ax.fill(angles, values_plot, color=RADAR_FILL, alpha=0.25)

    # Score dots
    ax.scatter(angles[:-1], values, color=RADAR_EDGE, s=55, zorder=5)

    # Labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, size=9.5, color=VF_DARK, fontweight="bold")

    # Score annotations
    for angle, score in zip(angles[:-1], values):
        ax.annotate(
            str(score),
            xy=(angle, score),
            xytext=(angle, score + 7),
            fontsize=8,
            ha="center",
            va="center",
            color=VF_DARK,
            fontweight="bold",
        )

    ax.grid(color=VF_GRID, linewidth=0.8)
    ax.spines["polar"].set_color(VF_GRID)

    ax.set_title(
        "Multi-Agent Analysis Scores",
        size=13,
        fontweight="bold",
        color=VF_DARK,
        pad=20,
    )

    plt.tight_layout(pad=1.5)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=VF_LIGHT)
    plt.close(fig)
    buf.seek(0)
    return buf