"""Agent 5: REPORTER — fpdf2 PDF 견적서 생성"""
import base64
import os
from datetime import datetime

try:
    from fpdf import FPDF
    _FPDF_OK = True
except ImportError:
    _FPDF_OK = False

# Windows 한글 폰트 경로 후보
_FONT_CANDIDATES = [
    "C:/Windows/Fonts/malgun.ttf",    # Malgun Gothic (Windows 기본)
    "C:/Windows/Fonts/malgunbd.ttf",  # Malgun Gothic Bold
    "C:/Windows/Fonts/NanumGothic.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",  # Linux fallback
]


def _find_font() -> str | None:
    for path in _FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


def run_reporter(estimate_data: dict) -> str | None:
    """PDF 견적서 생성 후 base64 반환, 실패 시 None"""
    if not _FPDF_OK:
        return None

    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_margins(15, 15, 15)

        font_path = _find_font()
        if font_path:
            pdf.add_font("KR", "", font_path)
            pdf.add_font("KR", "B", font_path)
            font_name = "KR"
        else:
            font_name = "Helvetica"

        # ── 헤더 ──────────────────────────────────────
        pdf.set_font(font_name, "B", 20)
        pdf.cell(0, 14, "JH EstimateAI  견적서", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.set_font(font_name, "", 9)
        pdf.set_text_color(140, 140, 140)
        pdf.cell(0, 6, f"작성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  JH EstimateAI powered by Claude",
                 new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(6)

        # ── 공사 개요 ─────────────────────────────────
        pdf.set_font(font_name, "B", 12)
        pdf.cell(0, 8, "■ 공사 개요", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(font_name, "", 10)

        type_ = estimate_data.get("type", "")
        area = estimate_data.get("area", 0)
        min_cost = estimate_data.get("min_cost", 0)
        max_cost = estimate_data.get("max_cost", 0)
        unit_price = estimate_data.get("unit_price", 0)

        info_rows = [
            ("공사 유형", type_),
            ("전체 면적", f"{area} m²"),
            ("m² 당 기준 단가", f"{unit_price:,} 원"),
            ("최소 견적", f"{min_cost:,} 원"),
            ("최대 견적", f"{max_cost:,} 원"),
        ]
        for label, value in info_rows:
            pdf.set_font(font_name, "B", 10)
            pdf.cell(50, 7, label, border="B")
            pdf.set_font(font_name, "", 10)
            pdf.cell(0, 7, value, border="B", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        # ── 공종별 내역 테이블 ─────────────────────────
        pdf.set_font(font_name, "B", 12)
        pdf.cell(0, 8, "■ 공종별 견적 내역", new_x="LMARGIN", new_y="NEXT")

        breakdown = estimate_data.get("breakdown", {})
        total = sum(breakdown.values())

        # 테이블 헤더
        pdf.set_fill_color(45, 45, 60)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font(font_name, "B", 10)
        pdf.cell(80, 8, "공종", border=1, fill=True)
        pdf.cell(55, 8, "금액", border=1, fill=True, align="R")
        pdf.cell(35, 8, "비중", border=1, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)

        # 테이블 행
        fill = False
        pdf.set_font(font_name, "", 10)
        for category, amount in breakdown.items():
            ratio = f"{amount / total * 100:.1f}%" if total > 0 else "0%"
            pdf.set_fill_color(245, 245, 250) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.cell(80, 7, category, border=1, fill=True)
            pdf.cell(55, 7, f"{amount:,} 원", border=1, fill=True, align="R")
            pdf.cell(35, 7, ratio, border=1, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
            fill = not fill

        # 합계 행
        pdf.set_fill_color(220, 230, 255)
        pdf.set_font(font_name, "B", 11)
        pdf.cell(80, 9, "합 계 (기준가)", border=1, fill=True)
        pdf.cell(55, 9, f"{total:,} 원", border=1, fill=True, align="R")
        pdf.cell(35, 9, "100%", border=1, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        # ── 전문가 검증 결과 ──────────────────────────
        flags = estimate_data.get("validator_flags", [])
        expert_comment = estimate_data.get("expert_comment", "")

        if flags:
            pdf.set_font(font_name, "B", 12)
            pdf.cell(0, 8, "■ 전문가 검증 결과", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 9)
            for flag in flags:
                severity = flag.get("severity", "warning")
                color = (220, 50, 50) if severity == "error" else (200, 140, 0)
                pdf.set_text_color(*color)
                label = "[오류]" if severity == "error" else "[주의]"
                pdf.cell(20, 6, label)
                pdf.set_text_color(0, 0, 0)
                pdf.multi_cell(0, 6, f"{flag.get('category', '')} — {flag.get('message', '')}")
                pdf.set_font(font_name, "", 8)
                pdf.set_text_color(100, 100, 100)
                pdf.cell(20, 5, "")
                pdf.multi_cell(0, 5, f"→ {flag.get('suggestion', '')}")
                pdf.set_text_color(0, 0, 0)
                pdf.set_font(font_name, "", 9)
            pdf.ln(3)

        if expert_comment:
            pdf.set_font(font_name, "B", 12)
            pdf.cell(0, 8, "■ 전문가 총평", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 10)
            pdf.multi_cell(0, 6, expert_comment)
            pdf.ln(4)

        # ── AI 요약 ────────────────────────────────────
        summary = estimate_data.get("summary", "")
        if summary:
            pdf.set_font(font_name, "B", 12)
            pdf.cell(0, 8, "■ AI 견적 요약", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 10)
            pdf.multi_cell(0, 6, summary)
            pdf.ln(4)

        # ── 주의사항 ──────────────────────────────────
        pdf.set_font(font_name, "", 8)
        pdf.set_text_color(160, 160, 160)
        pdf.multi_cell(0, 5,
            "※ 본 견적서는 AI 자동 산출 결과입니다. 현장 실측 및 자재 선정 후 최종 금액이 달라질 수 있습니다.\n"
            "※ JH EstimateAI는 18년 현장 경험 기반 데이터를 활용하나, 최종 계약 전 전문가 검토를 권장합니다."
        )

        # PDF → bytes → base64
        pdf_bytes = pdf.output()
        return base64.b64encode(pdf_bytes).decode("utf-8")

    except Exception:
        return None
