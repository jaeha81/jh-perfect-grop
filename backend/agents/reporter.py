"""Agent 5: REPORTER — fpdf2 PDF 견적서 생성"""
import base64
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from fpdf import FPDF
    _FPDF_OK = True
except ImportError:
    _FPDF_OK = False

# 한글 폰트 경로 후보 (regular / bold 분리)
# 번들 폰트를 최우선으로 검색 (Render/Fly.io 등 apt 미지원 환경 대응)
_BUNDLE_FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "fonts")
_FONT_REGULAR_CANDIDATES = [
    os.path.join(_BUNDLE_FONT_DIR, "NanumGothic.ttf"),
    os.path.join(_BUNDLE_FONT_DIR, "NanumGothicBold.ttf"),
    "C:/Windows/Fonts/malgun.ttf",
    "C:/Windows/Fonts/NanumGothic.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
]

_FONT_BOLD_CANDIDATES = [
    os.path.join(_BUNDLE_FONT_DIR, "NanumGothicBold.ttf"),
    os.path.join(_BUNDLE_FONT_DIR, "NanumGothic.ttf"),
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]


def _find_font() -> str | None:
    for path in _FONT_REGULAR_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


def _find_bold_font() -> str | None:
    """bold 전용 폰트. regular와 동일 파일이면 None 반환 (충돌 방지)"""
    reg = _find_font()
    for path in _FONT_BOLD_CANDIDATES:
        if os.path.exists(path) and path != reg:
            return path
    return None


def run_reporter(estimate_data: dict) -> str | None:
    """PDF 견적서 생성 후 base64 반환, 실패 시 None"""
    if not _FPDF_OK:
        logger.error("fpdf2 미설치 — PDF 생성 불가. pip install fpdf2 필요.")
        return None

    font_path = _find_font()
    if not font_path:
        logger.error(
            "한글 폰트 없음 — PDF 생성 중단. Railway 환경에서는 Dockerfile에 "
            "RUN apt-get install -y fonts-nanum 추가 필요. 후보 경로: %s",
            _FONT_REGULAR_CANDIDATES,
        )
        return None

    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_margins(15, 15, 15)

        # font_path는 진입부에서 이미 확인됨 (None이면 여기 도달 안 함)
        bold_path = _find_bold_font()
        pdf.add_font("KR", "", font_path)
        if bold_path:
            pdf.add_font("KR", "B", bold_path)
        else:
            # bold 폰트 파일 없으면 regular로 대체 등록 — fpdf2 FPDFException 방지
            pdf.add_font("KR", "B", font_path)
            bold_path = font_path  # bold 등록 완료로 표시
        font_name = "KR"
        logger.info("한글 폰트 로드 성공: regular=%s bold=%s", font_path, bold_path)
        _bold_style = "B"  # bold는 항상 등록됨

        # ── 헤더 ──────────────────────────────────────
        pdf.set_font(font_name, _bold_style, 20)
        pdf.cell(0, 14, "JH EstimateAI  견적서", new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.set_font(font_name, "", 9)
        pdf.set_text_color(140, 140, 140)
        pdf.cell(0, 6, f"작성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  JH EstimateAI powered by Claude",
                 new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.set_text_color(0, 0, 0)
        pdf.ln(6)

        # ── 고객 정보 (v2 optional) ──────────────────
        customer_name = estimate_data.get("customer_name")
        address = estimate_data.get("address")
        inquiry_id = estimate_data.get("inquiry_id")
        if customer_name or address or inquiry_id:
            pdf.set_font(font_name, _bold_style, 12)
            pdf.cell(0, 8, "■ 견적 요청 정보", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 10)
            meta_rows = []
            if inquiry_id:     meta_rows.append(("요청번호", inquiry_id))
            if customer_name:  meta_rows.append(("고객명", customer_name))
            if address:        meta_rows.append(("현장 주소", address))
            for label, value in meta_rows:
                pdf.set_font(font_name, _bold_style, 10)
                pdf.cell(50, 7, label, border="B")
                pdf.set_font(font_name, "", 10)
                pdf.cell(0, 7, str(value), border="B", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)

        # ── 공사 개요 ─────────────────────────────────
        pdf.set_font(font_name, _bold_style, 12)
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
            pdf.set_font(font_name, _bold_style, 10)
            pdf.cell(50, 7, label, border="B")
            pdf.set_font(font_name, "", 10)
            pdf.cell(0, 7, value, border="B", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        # ── 공종별 내역 테이블 ─────────────────────────
        pdf.set_font(font_name, _bold_style, 12)
        pdf.cell(0, 8, "■ 공종별 견적 내역", new_x="LMARGIN", new_y="NEXT")

        breakdown = estimate_data.get("breakdown", {})
        total = sum(breakdown.values()) or 1

        # 테이블 헤더
        pdf.set_fill_color(45, 45, 60)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font(font_name, _bold_style, 10)
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
        pdf.set_font(font_name, _bold_style, 11)
        pdf.cell(80, 9, "합 계 (기준가)", border=1, fill=True)
        pdf.cell(55, 9, f"{total:,} 원", border=1, fill=True, align="R")
        pdf.cell(35, 9, "100%", border=1, fill=True, align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(6)

        # ── 전문가 검증 결과 ──────────────────────────
        flags = estimate_data.get("validator_flags", [])
        expert_comment = estimate_data.get("expert_comment", "")

        if flags:
            pdf.set_font(font_name, _bold_style, 12)
            pdf.cell(0, 8, "■ 전문가 검증 결과", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 9)
            for flag in flags:
                severity = flag.get("severity", "warning")
                color = (220, 50, 50) if severity == "error" else (200, 140, 0)
                label = "[오류]" if severity == "error" else "[주의]"
                suggestion = flag.get("suggestion", "")
                msg_line = f"{flag.get('category', '')} - {flag.get('message', '')}"
                if suggestion:
                    msg_line += f"\n    >> {suggestion}"
                pdf.set_font(font_name, _bold_style, 9)
                pdf.set_text_color(*color)
                pdf.cell(20, 6, label)
                pdf.set_text_color(0, 0, 0)
                pdf.set_font(font_name, "", 9)
                pdf.multi_cell(0, 6, msg_line, new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1)
            pdf.ln(3)

        if expert_comment:
            pdf.set_font(font_name, _bold_style, 12)
            pdf.cell(0, 8, "■ 전문가 총평", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font_name, "", 10)
            pdf.multi_cell(0, 6, expert_comment)
            pdf.ln(4)

        # ── AI 요약 ────────────────────────────────────
        summary = estimate_data.get("summary", "")
        if summary:
            pdf.set_font(font_name, _bold_style, 12)
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

    except Exception as e:
        logger.error("run_reporter 실패: %s", e, exc_info=True)
        return None


def run_reporter_excel(estimate_data: dict) -> str | None:
    """Excel 견적서 생성 후 base64 반환, 실패 시 None"""
    try:
        import openpyxl
        from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    except ImportError:
        return None

    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "견적서"

        # 열 너비
        ws.column_dimensions['A'].width = 20
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 15
        ws.column_dimensions['D'].width = 20

        # 스타일 정의
        purple = "7C6AF7"
        green = "22D3A0"
        gray = "A09EB8"
        border_thin = Border(
            left=Side(style='thin', color='444444'),
            right=Side(style='thin', color='444444'),
            top=Side(style='thin', color='444444'),
            bottom=Side(style='thin', color='444444'),
        )

        row = 1

        # 제목
        ws.merge_cells(f'A{row}:D{row}')
        ws[f'A{row}'] = 'JH EstimateAI 견적서'
        ws[f'A{row}'].font = Font(name='맑은 고딕', size=18, bold=True, color=purple)
        ws[f'A{row}'].alignment = Alignment(horizontal='center', vertical='center')
        ws.row_dimensions[row].height = 36
        row += 1

        # 부제목
        ws.merge_cells(f'A{row}:D{row}')
        ws[f'A{row}'] = '18년 현장 경험 기반 · 5 에이전트 AI 견적 시스템'
        ws[f'A{row}'].font = Font(name='맑은 고딕', size=10, color=gray)
        ws[f'A{row}'].alignment = Alignment(horizontal='center')
        row += 2

        # 기본 정보
        info = [
            ('공사 유형', estimate_data.get('type', '-')),
            ('면적', f"{estimate_data.get('area', 0)}m²"),
            ('최소 견적', f"{estimate_data.get('min_cost', 0):,}원"),
            ('최대 견적', f"{estimate_data.get('max_cost', 0):,}원"),
            ('기준 단가', f"{estimate_data.get('unit_price', 0):,}원/m²"),
            ('작성일', datetime.now().strftime('%Y-%m-%d')),
        ]
        for label, value in info:
            ws[f'A{row}'] = label
            ws[f'A{row}'].font = Font(name='맑은 고딕', bold=True, color=gray)
            ws[f'B{row}'] = value
            ws[f'B{row}'].font = Font(name='맑은 고딕', color='E8E6F0')
            row += 1
        row += 1

        # 공종별 내역 헤더
        headers = ['공종', '금액 (원)', '비율 (%)', '비고']
        for col, h in enumerate(headers, 1):
            cell = ws.cell(row=row, column=col, value=h)
            cell.font = Font(name='맑은 고딕', bold=True, color='FFFFFF')
            cell.fill = PatternFill(start_color=purple, end_color=purple, fill_type='solid')
            cell.alignment = Alignment(horizontal='center')
            cell.border = border_thin
        row += 1

        breakdown = estimate_data.get('breakdown', {})
        total = sum(breakdown.values()) or 1
        for name, amount in breakdown.items():
            pct = round(amount / total * 100, 1)
            ws.cell(row=row, column=1, value=name).border = border_thin
            amt_cell = ws.cell(row=row, column=2, value=amount)
            amt_cell.number_format = '#,##0'
            amt_cell.border = border_thin
            pct_cell = ws.cell(row=row, column=3, value=pct)
            pct_cell.number_format = '0.0"%"'
            pct_cell.border = border_thin
            ws.cell(row=row, column=4, value='').border = border_thin
            row += 1

        # 합계
        ws.cell(row=row, column=1, value='합계').font = Font(name='맑은 고딕', bold=True)
        total_cell = ws.cell(row=row, column=2, value=total)
        total_cell.font = Font(name='맑은 고딕', bold=True, color=purple)
        total_cell.number_format = '#,##0'
        row += 2

        # AI 요약
        if estimate_data.get('summary'):
            ws.merge_cells(f'A{row}:D{row}')
            ws[f'A{row}'] = 'AI 전문가 요약'
            ws[f'A{row}'].font = Font(name='맑은 고딕', bold=True, color=green)
            row += 1
            ws.merge_cells(f'A{row}:D{row}')
            ws[f'A{row}'] = estimate_data['summary']
            ws[f'A{row}'].alignment = Alignment(wrap_text=True)
            ws.row_dimensions[row].height = 45
            row += 2

        # VALIDATOR 플래그
        flags = estimate_data.get('validator_flags', [])
        if flags:
            ws.merge_cells(f'A{row}:D{row}')
            ws[f'A{row}'] = 'VALIDATOR — 18년 현장 검증 결과'
            ws[f'A{row}'].font = Font(name='맑은 고딕', bold=True, color='F87171')
            row += 1
            for flag in flags:
                sev = flag.get('severity', 'warning')
                msg = f"[{flag.get('category','')}] {flag.get('message','')} → {flag.get('suggestion','')}"
                ws.merge_cells(f'A{row}:D{row}')
                ws[f'A{row}'] = f"{'⚠ ' if sev=='warning' else '✕ '}{msg}"
                ws[f'A{row}'].font = Font(name='맑은 고딕', color='FBBF24' if sev=='warning' else 'F87171')
                ws[f'A{row}'].alignment = Alignment(wrap_text=True)
                ws.row_dimensions[row].height = 30
                row += 1

        # base64 반환
        import io
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()

    except Exception as e:
        logger.error("run_reporter_excel 실패: %s", e, exc_info=True)
        return None
