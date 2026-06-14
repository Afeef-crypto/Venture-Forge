"""
backend/utils/pdf_generator.py

Generates a multi-page professional PDF export of a Venture Forge
evaluation report using ReportLab's Platypus layout engine.

Public entry point
------------------
    generate_evaluation_pdf(data: PDFExportRequest) -> bytes

Returns raw PDF bytes, which the FastAPI route wraps in a FileResponse.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from models.pdf_schemas import (
    AgentSection,
    ImplementationPlan,
    ImplementationTask,
    OverviewSection,
    PDFExportRequest,
    RoadmapSection,
)
from utils.chart_generator import generate_industry_bar_chart, generate_radar_chart

# ---------------------------------------------------------------------------
# Layout constants
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4
MARGIN_L = 18 * mm
MARGIN_R = 18 * mm
MARGIN_T = 20 * mm
MARGIN_B = 20 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# Brand palette
VF_ORANGE  = colors.HexColor("#E85D26")
VF_DARK    = colors.HexColor("#1A1A1A")
VF_LIGHT   = colors.HexColor("#F5F0EB")
VF_WHITE   = colors.white
VF_GREY    = colors.HexColor("#8C8C8C")
VF_DIVIDER = colors.HexColor("#E0D8CF")
VF_GREEN   = colors.HexColor("#16A34A")
VF_RED     = colors.HexColor("#DC2626")
VF_AMBER   = colors.HexColor("#D97706")


# ---------------------------------------------------------------------------
# Style sheet
# ---------------------------------------------------------------------------

def _build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()

    def s(name: str, **kwargs) -> ParagraphStyle:
        return ParagraphStyle(name=name, **kwargs)

    return {
        "cover_brand": s(
            "cover_brand",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=VF_ORANGE,
            leading=14,
        ),
        "cover_title": s(
            "cover_title",
            fontName="Helvetica-Bold",
            fontSize=38,
            textColor=VF_DARK,
            leading=44,
            spaceAfter=6,
        ),
        "cover_startup": s(
            "cover_startup",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=VF_ORANGE,
            leading=28,
            spaceAfter=4,
        ),
        "cover_meta": s(
            "cover_meta",
            fontName="Helvetica",
            fontSize=10,
            textColor=VF_GREY,
            leading=14,
        ),
        "cover_score_label": s(
            "cover_score_label",
            fontName="Helvetica",
            fontSize=11,
            textColor=VF_GREY,
            leading=14,
            alignment=TA_CENTER,
        ),
        "cover_score_value": s(
            "cover_score_value",
            fontName="Helvetica-Bold",
            fontSize=52,
            textColor=VF_ORANGE,
            leading=58,
            alignment=TA_CENTER,
        ),
        "section_heading": s(
            "section_heading",
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=VF_DARK,
            leading=24,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "section_sub": s(
            "section_sub",
            fontName="Helvetica",
            fontSize=10,
            textColor=VF_GREY,
            leading=14,
            spaceAfter=10,
        ),
        "score_pill_text": s(
            "score_pill_text",
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=VF_WHITE,
            alignment=TA_CENTER,
        ),
        "subsection_label": s(
            "subsection_label",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=VF_ORANGE,
            leading=12,
            spaceBefore=10,
            spaceAfter=3,
            tracking=1.5,  # letter-spacing emulation
        ),
        "body_text": s(
            "body_text",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=VF_DARK,
            leading=15,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
        ),
        "bullet_item": s(
            "bullet_item",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=VF_DARK,
            leading=14,
            leftIndent=14,
            spaceAfter=3,
            bulletIndent=4,
        ),
        "roadmap_week_title": s(
            "roadmap_week_title",
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=VF_DARK,
            leading=13,
            spaceBefore=8,
            spaceAfter=3,
        ),
        "impl_task_title": s(
            "impl_task_title",
            fontName="Helvetica-Bold",
            fontSize=9.5,
            textColor=VF_DARK,
            leading=13,
        ),
        "impl_task_meta": s(
            "impl_task_meta",
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            textColor=VF_GREY,
            leading=12,
        ),
        "footer_text": s(
            "footer_text",
            fontName="Helvetica",
            fontSize=7.5,
            textColor=VF_GREY,
            alignment=TA_CENTER,
        ),
        "toc_entry": s(
            "toc_entry",
            fontName="Helvetica",
            fontSize=10,
            textColor=VF_DARK,
            leading=18,
        ),
        "toc_heading": s(
            "toc_heading",
            fontName="Helvetica-Bold",
            fontSize=14,
            textColor=VF_DARK,
            leading=18,
            spaceAfter=10,
        ),
    }


ST = _build_styles()


# ---------------------------------------------------------------------------
# Page template callback (header + footer on every non-cover page)
# ---------------------------------------------------------------------------

def _page_decoration(canvas, doc):
    """Called by SimpleDocTemplate after each page is drawn."""
    canvas.saveState()

    page_num = doc.page

    # Skip decoration on the cover page
    if page_num == 1:
        canvas.restoreState()
        return

    # Header stripe
    canvas.setFillColor(VF_LIGHT)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(VF_ORANGE)
    canvas.rect(MARGIN_L, PAGE_H - 9 * mm, 28 * mm, 0.8 * mm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(VF_DARK)
    canvas.drawString(MARGIN_L, PAGE_H - 7 * mm, "VENTURE FORGE")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(VF_GREY)
    canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 7 * mm, "Evaluation Report")

    # Footer stripe
    canvas.setFillColor(VF_LIGHT)
    canvas.rect(0, 0, PAGE_W, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(VF_DIVIDER)
    canvas.rect(0, 12 * mm, PAGE_W, 0.3 * mm, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(VF_GREY)
    canvas.drawCentredString(
        PAGE_W / 2, 4.5 * mm, f"Page {page_num}  ·  Venture Forge Confidential"
    )

    canvas.restoreState()


# ---------------------------------------------------------------------------
# Helper flowable builders
# ---------------------------------------------------------------------------

def _divider(top: float = 6, bottom: float = 10) -> list:
    return [
        Spacer(1, top * mm),
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=VF_DIVIDER,
            spaceAfter=bottom * mm,
        ),
    ]


def _score_color(score: int) -> colors.HexColor:
    if score >= 70:
        return VF_GREEN
    if score >= 50:
        return VF_AMBER
    return VF_RED


def _score_badge_table(score: int, label: str = "Score") -> Table:
    """Returns a small coloured score badge as a Table (right-aligned)."""
    col = _score_color(score)
    badge_style = ParagraphStyle(
        "badge",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=VF_WHITE,
        alignment=TA_CENTER,
        leading=18,
    )
    lbl_style = ParagraphStyle(
        "badge_lbl",
        fontName="Helvetica",
        fontSize=8,
        textColor=VF_GREY,
        alignment=TA_RIGHT,
        leading=10,
    )
    data = [
        [Paragraph(label, lbl_style), ""],
        [Paragraph(f"{score}/100", badge_style), ""],
    ]
    t = Table(data, colWidths=[40 * mm, 0])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 1), (0, 1), col),
                ("TEXTCOLOR", (0, 1), (0, 1), VF_WHITE),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 1), (0, 1), 4),
                ("BOTTOMPADDING", (0, 1), (0, 1), 4),
                ("LEFTPADDING", (0, 1), (0, 1), 8),
                ("RIGHTPADDING", (0, 1), (0, 1), 8),
                ("ROUNDEDCORNERS", (0, 1), (0, 1), [4]),
            ]
        )
    )
    return t


def _section_header(title: str, subtitle: str, score: int | None = None) -> list:
    """Title + optional score laid out in a 2-column table."""
    left = [
        Paragraph(title, ST["section_heading"]),
        Paragraph(subtitle, ST["section_sub"]),
    ]
    if score is not None:
        col = _score_color(score)
        score_style = ParagraphStyle(
            "score_inline",
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=col,
            leading=30,
            alignment=TA_RIGHT,
        )
        lbl_style = ParagraphStyle(
            "score_lbl_inline",
            fontName="Helvetica",
            fontSize=8,
            textColor=VF_GREY,
            alignment=TA_RIGHT,
            leading=11,
        )
        right = [
            Paragraph("Score", lbl_style),
            Paragraph(f"{score}/100", score_style),
        ]
        from io import BytesIO  # local to avoid polluting module scope

        data = [[left[0], right[0]], [left[1], right[1]]]
        t = Table(data, colWidths=[CONTENT_W * 0.72, CONTENT_W * 0.28])
        t.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        return [t, Spacer(1, 2 * mm)]
    else:
        return left + [Spacer(1, 2 * mm)]


def _subsection(label: str, content: Any) -> list:
    """Renders a labelled subsection: ORANGE LABEL followed by body text."""
    items: list = [Paragraph(label.upper(), ST["subsection_label"])]
    if isinstance(content, list):
        for item in content:
            items.append(
                Paragraph(f"• {_safe(item)}", ST["bullet_item"])
            )
    elif isinstance(content, str) and content.strip():
        items.append(Paragraph(_safe(content), ST["body_text"]))
    return items


def _safe(text: Any) -> str:
    """Escape ReportLab XML special characters in a plain string."""
    s = str(text) if text is not None else ""
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s


def _bullet_list(items: list[str], style_key: str = "bullet_item") -> list:
    result = []
    for item in items:
        result.append(Paragraph(f"• {_safe(item)}", ST[style_key]))
    return result


# ---------------------------------------------------------------------------
# Page builders
# ---------------------------------------------------------------------------

def _cover_page(data: PDFExportRequest, story: list) -> None:
    """Full-bleed cover page with brand, startup name and overall score."""
    overall = data.overview.overall_score
    date_str = data.evaluation_date.strftime("%B %d, %Y")

    # Vertical centering via spacers
    story.append(Spacer(1, 38 * mm))

    # Brand mark
    story.append(Paragraph("VENTURE FORGE", ST["cover_brand"]))
    story.append(Spacer(1, 6 * mm))

    # Rule
    story.append(
        HRFlowable(width="100%", thickness=1.5, color=VF_ORANGE, spaceAfter=8 * mm)
    )

    story.append(Paragraph("Evaluation Report", ST["cover_title"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(_safe(data.startup_name), ST["cover_startup"]))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(f"Prepared by Venture Forge  ·  {date_str}", ST["cover_meta"]))
    story.append(Paragraph(f"Industry: {_safe(data.industry)}", ST["cover_meta"]))

    story.append(Spacer(1, 18 * mm))

    # Overall score block
    col = _score_color(overall)
    score_style = ParagraphStyle(
        "cov_score",
        fontName="Helvetica-Bold",
        fontSize=56,
        textColor=col,
        leading=62,
        alignment=TA_CENTER,
    )
    lbl_style = ParagraphStyle(
        "cov_lbl",
        fontName="Helvetica",
        fontSize=11,
        textColor=VF_GREY,
        leading=15,
        alignment=TA_CENTER,
    )
    score_data = [
        [Paragraph("Overall Score", lbl_style)],
        [Paragraph(f"{overall}/100", score_style)],
    ]
    score_t = Table(
        score_data,
        colWidths=[CONTENT_W * 0.5],
        hAlign="LEFT",
    )
    score_t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), VF_LIGHT),
                ("BOX", (0, 0), (-1, -1), 1, VF_DIVIDER),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )
    story.append(score_t)

    if data.overview.verdict:
        story.append(Spacer(1, 8 * mm))
        verdict_style = ParagraphStyle(
            "verdict",
            fontName="Helvetica-Oblique",
            fontSize=11,
            textColor=VF_DARK,
            leading=16,
        )
        story.append(Paragraph(f'"{_safe(data.overview.verdict)}"', verdict_style))

    story.append(PageBreak())


def _toc_page(data: PDFExportRequest, story: list) -> None:
    """Table of contents."""
    story.append(Paragraph("Table of Contents", ST["toc_heading"]))
    story.append(
        HRFlowable(width="100%", thickness=0.5, color=VF_DIVIDER, spaceAfter=6 * mm)
    )

    sections = [
        ("1", "Overview & Executive Summary"),
        ("2", "YC Partner Analysis"),
        ("3", "Tech Auditor Analysis"),
        ("4", "Business CFO Analysis"),
        ("5", "Marketing Expert Analysis"),
        ("6", "Demand Intel Analysis"),
        ("7", "The Judge — Final Verdict"),
        ("8", "Roadmap"),
        ("9", "Implementation Plan"),
    ]

    for num, title in sections:
        row_data = [
            [
                Paragraph(num, ST["toc_entry"]),
                Paragraph(title, ST["toc_entry"]),
            ]
        ]
        t = Table(row_data, colWidths=[12 * mm, CONTENT_W - 12 * mm])
        t.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("TEXTCOLOR", (0, 0), (0, 0), VF_ORANGE),
                    ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                ]
            )
        )
        story.append(t)

    story.append(PageBreak())


def _overview_page(data: PDFExportRequest, story: list) -> None:
    """Overview — executive summary, investor hook, strength/risk + both charts."""
    ov = data.overview

    story += _section_header("Overview", "Evaluation Summary")
    story += _divider(2, 4)

    if ov.executive_summary:
        story += _subsection("Executive Summary", ov.executive_summary)

    if ov.investor_hook:
        story += _subsection("Investor Hook", ov.investor_hook)

    if ov.biggest_strength:
        story += _subsection("Biggest Strength", ov.biggest_strength)

    if ov.critical_risk:
        story += _subsection("Critical Risk", ov.critical_risk)

    # Score summary table
    if ov.agent_scores:
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("AGENT SCORES", ST["subsection_label"]))
        score_rows = [
            [Paragraph("Agent", ST["subsection_label"]), Paragraph("Score", ST["subsection_label"])]
        ]
        for agent_name, score in ov.agent_scores.items():
            col = _score_color(score)
            score_p = ParagraphStyle(
                "score_cell",
                fontName="Helvetica-Bold",
                fontSize=10,
                textColor=col,
            )
            score_rows.append(
                [Paragraph(_safe(agent_name), ST["body_text"]),
                 Paragraph(f"{score}/100", score_p)]
            )
        score_t = Table(
            score_rows,
            colWidths=[CONTENT_W * 0.75, CONTENT_W * 0.25],
        )
        score_t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), VF_LIGHT),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [VF_WHITE, VF_LIGHT]),
                    ("BOX", (0, 0), (-1, -1), 0.5, VF_DIVIDER),
                    ("INNERGRID", (0, 0), (-1, -1), 0.3, VF_DIVIDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ]
            )
        )
        story.append(score_t)

    story.append(PageBreak())

    # --- Charts page ---
    story.append(Paragraph("Analysis Charts", ST["section_heading"]))
    story += _divider(2, 6)

    # Radar chart
    radar_scores = ov.agent_scores or {}
    radar_buf = generate_radar_chart(radar_scores)
    radar_img = Image(radar_buf, width=CONTENT_W * 0.65, height=CONTENT_W * 0.65)
    radar_img.hAlign = "CENTER"
    story.append(radar_img)

    story.append(Spacer(1, 10 * mm))

    # Industry bar chart
    bar_buf = generate_industry_bar_chart(ov.overall_score, data.industry)
    bar_img = Image(bar_buf, width=CONTENT_W, height=CONTENT_W * 0.45)
    bar_img.hAlign = "CENTER"
    story.append(bar_img)

    story.append(PageBreak())


def _agent_page(section: AgentSection, story: list) -> None:
    """One specialist agent's full analysis page."""
    story += _section_header(section.agent_name, "Detailed Specialist Analysis", section.score)
    story += _divider(2, 4)

    if section.executive_summary:
        story += _subsection("Executive Summary", section.executive_summary)

    # Render each structured subsection
    for label, content in section.subsections.items():
        story += _subsection(label, content)

    if section.strengths:
        story += _subsection("Strengths", section.strengths)

    if section.weaknesses:
        story += _subsection("Weaknesses", section.weaknesses)

    if section.recommendations:
        story += _subsection("Recommendations", section.recommendations)

    # Raw analysis fallback (if no structured subsections provided)
    if not section.subsections and section.raw_analysis:
        story += _subsection("Full Analysis", section.raw_analysis)

    story.append(PageBreak())


def _roadmap_page(roadmap: RoadmapSection, story: list) -> None:
    """3-week MVP roadmap."""
    story += _section_header("Roadmap", "3-Week MVP Sprint Plan")
    story += _divider(2, 4)

    if roadmap.summary:
        story += _subsection("Summary", roadmap.summary)

    for week in roadmap.weeks:
        week_block = [
            Paragraph(
                f"Week {week.week}: {_safe(week.title)}",
                ST["roadmap_week_title"],
            )
        ] + _bullet_list(week.tasks)
        story.append(KeepTogether(week_block))
        story.append(Spacer(1, 4 * mm))

    story.append(PageBreak())


def _impl_plan_page(plan: ImplementationPlan, story: list) -> None:
    """Cursor-ready implementation tasks."""
    story += _section_header("Implementation Plan", "Cursor-Ready Task Breakdown")
    story += _divider(2, 4)

    if plan.summary:
        story += _subsection("Summary", plan.summary)

    # Group tasks by domain
    by_domain: dict[str, list[ImplementationTask]] = {}
    for task in plan.tasks:
        domain = task.domain or "General"
        by_domain.setdefault(domain, []).append(task)

    for domain, tasks in by_domain.items():
        story.append(Paragraph(domain.upper(), ST["subsection_label"]))
        for task in tasks:
            priority_colors = {
                "critical": VF_RED,
                "high": VF_AMBER,
                "medium": VF_DARK,
                "low": VF_GREY,
            }
            p_col = priority_colors.get(task.priority.lower(), VF_DARK)
            priority_style = ParagraphStyle(
                "p_inline",
                fontName="Helvetica-Bold",
                fontSize=9,
                textColor=p_col,
            )
            task_block = [
                Paragraph(_safe(task.title), ST["impl_task_title"]),
                Paragraph(
                    f"Priority: {task.priority.upper()}  "
                    + (f"| Sprint {task.sprint}" if task.sprint else ""),
                    ST["impl_task_meta"],
                ),
            ]
            if task.description:
                task_block.append(Paragraph(_safe(task.description), ST["body_text"]))
            if task.acceptance_criteria:
                task_block += _bullet_list(task.acceptance_criteria)

            story.append(KeepTogether(task_block + [Spacer(1, 3 * mm)]))
        story.append(Spacer(1, 4 * mm))

    story.append(PageBreak())


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_evaluation_pdf(data: PDFExportRequest) -> bytes:
    """
    Build and return the complete evaluation PDF as raw bytes.

    Usage in a FastAPI route::

        from fastapi import Response
        pdf_bytes = generate_evaluation_pdf(data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="report.pdf"'},
        )
    """
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T + 5 * mm,   # extra top margin for header bar
        bottomMargin=MARGIN_B + 6 * mm,  # extra bottom margin for footer
        title=f"Venture Forge — {data.startup_name}",
        author="Venture Forge",
        subject="Startup Evaluation Report",
        creator="Venture Forge PDF Engine",
    )

    story: list = []

    # 1. Cover
    _cover_page(data, story)

    # 2. TOC
    _toc_page(data, story)

    # 3. Overview + Charts
    _overview_page(data, story)

    # 4–9. Agent pages (in the order defined in the UI tab bar)
    agent_order = [
        data.yc_partner,
        data.tech_auditor,
        data.business_cfo,
        data.marketing_expert,
        data.demand_intel,
        data.judge,
    ]
    for section in agent_order:
        if section is not None:
            _agent_page(section, story)

    # 10. Roadmap
    _roadmap_page(data.roadmap, story)

    # 11. Implementation Plan
    _impl_plan_page(data.implementation_plan, story)

    doc.build(story, onFirstPage=_page_decoration, onLaterPages=_page_decoration)
    return buf.getvalue()