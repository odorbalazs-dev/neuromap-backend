#!/usr/bin/env python3
"""Generate the Hungarian security evidence register as a standalone DOCX.

The generator intentionally uses only the Python standard library. This keeps
the evidence artifact reproducible on the repository host without Microsoft
Word, LibreOffice, pandoc, or third-party Python packages.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "SECURITY_REMEDIATION_EVIDENCE_REGISTER_HU.md"
OUTPUT = ROOT / "docs" / "SECURITY_REMEDIATION_EVIDENCE_REGISTER_HU.docx"
MANIFEST = ROOT / "docs" / "SECURITY_REMEDIATION_EVIDENCE_REGISTER_HU.integrity.json"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
XML = "http://www.w3.org/XML/1998/namespace"

DOCUMENT_ID = "NMK-SEC-REG-001"
ACCENT = "098DCC"
ACCENT_DARK = "075985"
INK = "14213D"
MUTED = "5D6B82"
LIGHT = "EAF4FA"
PALE = "F5F8FB"
LINE = "C9DCE8"
WARNING = "FFF4E6"
WARNING_LINE = "F59E0B"
SUCCESS = "EAF7EF"
SUCCESS_LINE = "22A06B"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def current_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        return "ismeretlen"


def clean_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    return "".join(ch for ch in value if ch in "\t\n\r" or ord(ch) >= 32)


def run(text: str, *, bold: bool = False, italic: bool = False, code: bool = False,
        color: str | None = None, size: int | None = None) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if code:
        props.append('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>')
        props.append('<w:shd w:val="clear" w:color="auto" w:fill="E9EEF3"/>')
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    if size:
        props.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    safe = escape(clean_text(text))
    return f'<w:r>{rpr}<w:t xml:space="preserve">{safe}</w:t></w:r>'


INLINE_RE = re.compile(r"(\*\*.+?\*\*|`[^`]+`)")


def inline_runs(text: str) -> str:
    parts = INLINE_RE.split(clean_text(text))
    output = []
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            output.append(run(part[2:-2], bold=True))
        elif part.startswith("`") and part.endswith("`"):
            output.append(run(part[1:-1], code=True, size=18))
        else:
            output.append(run(part))
    return "".join(output)


def paragraph(text: str = "", *, style: str = "BodyText", before: int = 0,
              after: int = 110, keep_next: bool = False, keep_lines: bool = False,
              page_break_before: bool = False, shade: str | None = None,
              border_color: str | None = None, left_indent: int | None = None,
              hanging: int | None = None, numbering: bool = False,
              raw_runs: str | None = None) -> str:
    ppr = [f'<w:pStyle w:val="{style}"/>']
    if before or after:
        ppr.append(f'<w:spacing w:before="{before}" w:after="{after}"/>')
    if keep_next:
        ppr.append("<w:keepNext/>")
    if keep_lines:
        ppr.append("<w:keepLines/>")
    if page_break_before:
        ppr.append("<w:pageBreakBefore/>")
    if left_indent is not None or hanging is not None:
        attrs = []
        if left_indent is not None:
            attrs.append(f'w:left="{left_indent}"')
        if hanging is not None:
            attrs.append(f'w:hanging="{hanging}"')
        ppr.append(f"<w:ind {' '.join(attrs)}/>")
    if numbering:
        ppr.append('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    if shade:
        ppr.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>')
    if border_color:
        ppr.append(
            '<w:pBdr>'
            f'<w:left w:val="single" w:sz="18" w:space="8" w:color="{border_color}"/>'
            '</w:pBdr>'
        )
    content = raw_runs if raw_runs is not None else inline_runs(text)
    return f"<w:p><w:pPr>{''.join(ppr)}</w:pPr>{content}</w:p>"


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def table(rows: list[list[str]], *, header: bool = True,
          widths: list[int] | None = None, compact: bool = False) -> str:
    if not rows:
        return ""
    column_count = max(len(row) for row in rows)
    normalized = [row + [""] * (column_count - len(row)) for row in rows]
    total_width = 10180
    if not widths or len(widths) != column_count:
        widths = [total_width // column_count] * column_count
        widths[-1] += total_width - sum(widths)
    else:
        scale = total_width / sum(widths)
        widths = [int(value * scale) for value in widths]
        widths[-1] += total_width - sum(widths)

    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    body = []
    for row_index, row in enumerate(normalized):
        is_header = header and row_index == 0
        tr_props = '<w:cantSplit/>' + ('<w:tblHeader/>' if is_header else "")
        cells = []
        for col_index, cell in enumerate(row):
            fill = ACCENT_DARK if is_header else ("F7FAFC" if row_index % 2 == 0 else "FFFFFF")
            text_color = "FFFFFF" if is_header else INK
            cell_runs = inline_runs(cell)
            if is_header:
                cell_runs = run(re.sub(r"\*\*|`", "", cell), bold=True, color=text_color, size=17)
            elif compact:
                cell_runs = "".join(
                    part.replace("</w:rPr>", '<w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>')
                    if "<w:rPr>" in part else part
                    for part in re.findall(r"<w:r>.*?</w:r>", cell_runs)
                ) or run(cell, size=17)
            cells.append(
                '<w:tc>'
                '<w:tcPr>'
                f'<w:tcW w:w="{widths[col_index]}" w:type="dxa"/>'
                f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
                '<w:vAlign w:val="center"/>'
                '</w:tcPr>'
                '<w:p><w:pPr><w:spacing w:before="45" w:after="45"/></w:pPr>'
                f'{cell_runs}</w:p>'
                '</w:tc>'
            )
        body.append(f"<w:tr><w:trPr>{tr_props}</w:trPr>{''.join(cells)}</w:tr>")
    return (
        '<w:tbl>'
        '<w:tblPr>'
        f'<w:tblW w:w="{total_width}" w:type="dxa"/>'
        '<w:tblLayout w:type="fixed"/>'
        '<w:tblBorders>'
        f'<w:top w:val="single" w:sz="4" w:color="{LINE}"/>'
        f'<w:left w:val="single" w:sz="4" w:color="{LINE}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:color="{LINE}"/>'
        f'<w:right w:val="single" w:sz="4" w:color="{LINE}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:color="{LINE}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:color="{LINE}"/>'
        '</w:tblBorders>'
        '<w:tblCellMar>'
        '<w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/>'
        '<w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/>'
        '</w:tblCellMar>'
        '</w:tblPr>'
        f'<w:tblGrid>{grid}</w:tblGrid>'
        f'{"".join(body)}'
        '</w:tbl>'
        '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>'
    )


def parse_table(lines: list[str]) -> list[list[str]]:
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            continue
        rows.append(cells)
    return rows


def metadata_rows(lines: list[str]) -> list[list[str]]:
    rows = []
    for line in lines:
        match = re.match(r"\*\*(.+?):\*\*\s*(.*?)(?:\s{2})?$", line.strip())
        if match:
            rows.append([match.group(1), match.group(2)])
    return rows


def render_markdown(markdown: str) -> tuple[str, dict[str, int]]:
    lines = markdown.splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("A forrásdokumentum címe hiányzik.")

    body = []
    counts = {"headings": 0, "paragraphs": 0, "tables": 0, "bullets": 0, "code_blocks": 0}

    title = lines[0][2:].strip()
    separator = next((index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---"), None)
    if separator is None:
        raise ValueError("A dokumentumkontroll blokk lezárása hiányzik.")
    metadata = metadata_rows(lines[1:separator])

    body.append(paragraph("NEUROMAP KIDS", style="Subtitle", after=160, raw_runs=run("NEUROMAP KIDS", bold=True, color=ACCENT, size=22)))
    body.append(paragraph(title, style="Title", after=180, keep_next=True))
    body.append(paragraph(
        "Belső biztonsági kontroll- és bizonyítéknyilvántartás",
        style="Subtitle", after=260, raw_runs=run(
            "Belső biztonsági kontroll- és bizonyítéknyilvántartás",
            color=MUTED, size=24
        )
    ))
    body.append(table(metadata, header=False, widths=[2800, 7380]))
    body.append(paragraph(
        "BELSŐ MŰSZAKI IGAZOLÁS - NEM FÜGGETLEN TANÚSÍTVÁNY",
        style="Callout", before=120, after=100, shade=WARNING,
        border_color=WARNING_LINE,
        raw_runs=run(
            "BELSŐ MŰSZAKI IGAZOLÁS - NEM FÜGGETLEN TANÚSÍTVÁNY",
            bold=True, color="9A4D00", size=19
        )
    ))
    body.append(paragraph(
        "A dokumentum a megjelölt forrásállapot belső bizonyítékait rögzíti. "
        "Külső audit, jogi szakvélemény vagy tanúsítás hiányában ilyen állításra nem használható.",
        style="Callout", after=180, shade=WARNING, border_color=WARNING_LINE
    ))
    body.append(page_break())

    index = separator + 1
    paragraph_buffer: list[str] = []

    def flush_paragraph() -> None:
        if paragraph_buffer:
            text = " ".join(item.strip() for item in paragraph_buffer).strip()
            if text:
                shade = None
                border = None
                style = "BodyText"
                if text.startswith("Ez a dokumentum **nem"):
                    shade, border, style = WARNING, WARNING_LINE, "Callout"
                elif text.startswith("**Értelmezés:"):
                    shade, border, style = LIGHT, ACCENT, "Callout"
                body.append(paragraph(
                    text,
                    style=style,
                    shade=shade,
                    border_color=border,
                ))
                counts["paragraphs"] += 1
            paragraph_buffer.clear()

    while index < len(lines):
        raw = lines[index]
        stripped = raw.strip()

        if not stripped:
            flush_paragraph()
            index += 1
            continue
        if stripped == "---":
            flush_paragraph()
            index += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph()
            code_lines = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index].rstrip())
                index += 1
            index += 1
            code_text = "\n".join(code_lines)
            code_runs = []
            for line_index, code_line in enumerate(code_text.splitlines() or [""]):
                if line_index:
                    code_runs.append('<w:r><w:br/></w:r>')
                code_runs.append(run(code_line, code=True, size=16))
            body.append(paragraph(
                style="Code", after=160, shade="101827", border_color=ACCENT,
                raw_runs="".join(code_runs)
            ))
            counts["code_blocks"] += 1
            continue
        if stripped.startswith("|"):
            flush_paragraph()
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            rows = parse_table(table_lines)
            if rows:
                widths = None
                if len(rows[0]) == 2:
                    widths = [3000, 7180]
                elif len(rows[0]) == 4:
                    widths = (
                        [2300, 1500, 1400, 4980]
                        if rows[0][0].strip() == "Szerepkör"
                        else [1800, 1700, 1500, 5180]
                    )
                elif len(rows[0]) == 5:
                    widths = [1250, 1850, 2100, 1350, 3630]
                body.append(table(rows, widths=widths, compact=len(rows[0]) >= 4))
                counts["tables"] += 1
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            heading = stripped[4:].strip()
            body.append(paragraph(
                heading,
                style="Heading3",
                before=210,
                after=100,
                keep_next=True,
                page_break_before=heading.startswith("SEC-003 "),
            ))
            counts["headings"] += 1
            index += 1
            continue
        if stripped.startswith("## "):
            flush_paragraph()
            heading = stripped[3:].strip()
            section_match = re.match(r"(\d+)\.", heading)
            force_page = bool(section_match and section_match.group(1) in {"6", "7", "10"})
            body.append(paragraph(
                heading, style="Heading1", before=260, after=150,
                keep_next=True, page_break_before=force_page
            ))
            counts["headings"] += 1
            index += 1
            continue
        if stripped.startswith("# "):
            flush_paragraph()
            body.append(paragraph(stripped[2:].strip(), style="Title", after=160, keep_next=True))
            counts["headings"] += 1
            index += 1
            continue
        if stripped.startswith(("- ", "* ")):
            flush_paragraph()
            body.append(paragraph(
                stripped[2:].strip(), style="ListParagraph", after=55,
                left_indent=480, hanging=240, numbering=True, keep_lines=True
            ))
            counts["bullets"] += 1
            index += 1
            continue

        paragraph_buffer.append(stripped)
        index += 1

    flush_paragraph()
    return "".join(body), counts


def styles_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{W}">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri"/><w:color w:val="{INK}"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="hu-HU"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="110" w:line="270" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:widowControl/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="BodyText"><w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:widowControl/><w:spacing w:after="110" w:line="276" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="{INK}"/><w:sz w:val="42"/><w:szCs w:val="42"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="280" w:after="140"/><w:outlineLvl w:val="0"/><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="6" w:color="{ACCENT}"/></w:pBdr></w:pPr><w:rPr><w:b/><w:color w:val="{ACCENT_DARK}"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="{ACCENT_DARK}"/><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="210" w:after="100"/><w:outlineLvl w:val="2"/><w:shd w:val="clear" w:color="auto" w:fill="{LIGHT}"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="7" w:color="{ACCENT}"/></w:pBdr><w:ind w:left="120"/></w:pPr><w:rPr><w:b/><w:color w:val="{INK}"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="BodyText"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="BodyText"/><w:qFormat/><w:pPr><w:keepLines/><w:ind w:left="180" w:right="160"/><w:spacing w:before="70" w:after="90"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepLines/><w:ind w:left="180" w:right="180"/><w:spacing w:before="90" w:after="140" w:line="230" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="FFFFFF"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
  <w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:qFormat/></w:style>
</w:styles>'''


def numbering_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="{W}">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="singleLevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="480"/></w:tabs><w:ind w:left="480" w:hanging="240"/></w:pPr><w:rPr><w:color w:val="{ACCENT}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''


def header_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="{W}" xmlns:r="{R}">
  <w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="10180"/></w:tabs><w:pBdr><w:bottom w:val="single" w:sz="5" w:space="5" w:color="{LINE}"/></w:pBdr><w:spacing w:after="80"/></w:pPr>
    {run("NEUROMAP KIDS", bold=True, color=ACCENT, size=17)}
    <w:r><w:tab/></w:r>{run(DOCUMENT_ID + " · BELSŐ", bold=True, color=MUTED, size=16)}
  </w:p>
</w:hdr>'''


def field(name: str, placeholder: str) -> str:
    return (
        '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
        f'<w:r><w:instrText xml:space="preserve"> {name} </w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        f'{run(placeholder, color=MUTED, size=16)}'
        '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
    )


def footer_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="{W}" xmlns:r="{R}">
  <w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="10180"/></w:tabs><w:pBdr><w:top w:val="single" w:sz="5" w:space="5" w:color="{LINE}"/></w:pBdr><w:spacing w:before="80"/></w:pPr>
    {run("Biztonsági javítások és bizonyítékok nyilvántartása", color=MUTED, size=16)}
    <w:r><w:tab/></w:r>{run("Oldal ", color=MUTED, size=16)}{field("PAGE", "1")}{run(" / ", color=MUTED, size=16)}{field("NUMPAGES", "1")}
  </w:p>
</w:ftr>'''


def document_xml(body: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{W}" xmlns:r="{R}">
  <w:body>
    {body}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId4"/>
      <w:footerReference w:type="default" r:id="rId5"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1000" w:right="850" w:bottom="900" w:left="850" w:header="420" w:footer="420" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>'''


CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

ROOT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

DOCUMENT_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>'''


def settings_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="{W}">
  <w:zoom w:percent="90"/>
  <w:defaultTabStop w:val="720"/>
  <w:updateFields w:val="true"/>
  <w:doNotTrackMoves/><w:doNotTrackFormatting/>
  <w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>
</w:settings>'''


def core_xml(commit: str, timestamp: str) -> str:
    title = escape("Biztonsági javítások és bizonyítékok nyilvántartása")
    description = escape(f"Belső biztonsági bizonyítéknyilvántartás; vizsgált commit: {commit}")
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{title}</dc:title><dc:subject>{DOCUMENT_ID}</dc:subject><dc:creator>NeuroMap Kids</dc:creator><cp:lastModifiedBy>Codex belső dokumentumgenerátor</cp:lastModifiedBy><dc:description>{description}</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:modified>
</cp:coreProperties>'''


APP_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>NeuroMap Kids evidence register generator</Application><AppVersion>1.0</AppVersion><Company>NeuroMap Kids</Company></Properties>'''


def validate_docx(path: Path) -> dict[str, int]:
    required = {
        "[Content_Types].xml", "_rels/.rels", "word/document.xml",
        "word/_rels/document.xml.rels", "word/styles.xml", "word/numbering.xml",
        "word/settings.xml", "word/header1.xml", "word/footer1.xml",
        "docProps/core.xml", "docProps/app.xml",
    }
    with zipfile.ZipFile(path, "r") as archive:
        names = set(archive.namelist())
        missing = required - names
        if missing:
            raise ValueError(f"Hiányzó DOCX-elemek: {sorted(missing)}")
        for name in sorted(names):
            if name.endswith((".xml", ".rels")):
                ElementTree.fromstring(archive.read(name))
        document = ElementTree.fromstring(archive.read("word/document.xml"))
    return {
        "paragraphs": len(document.findall(f".//{{{W}}}p")),
        "tables": len(document.findall(f".//{{{W}}}tbl")),
        "headings": sum(
            1 for node in document.findall(f".//{{{W}}}pStyle")
            if node.attrib.get(f"{{{W}}}val", "").startswith("Heading")
        ),
    }


def main() -> int:
    if not SOURCE.exists():
        print(f"Hiányzó forrás: {SOURCE}", file=sys.stderr)
        return 1

    markdown = SOURCE.read_text(encoding="utf-8")
    body, parsed_counts = render_markdown(markdown)
    commit = current_commit()
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    package = {
        "[Content_Types].xml": CONTENT_TYPES,
        "_rels/.rels": ROOT_RELS,
        "word/document.xml": document_xml(body),
        "word/_rels/document.xml.rels": DOCUMENT_RELS,
        "word/styles.xml": styles_xml(),
        "word/numbering.xml": numbering_xml(),
        "word/settings.xml": settings_xml(),
        "word/header1.xml": header_xml(),
        "word/footer1.xml": footer_xml(),
        "docProps/core.xml": core_xml(commit, timestamp),
        "docProps/app.xml": APP_XML,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in package.items():
            archive.writestr(name, content.encode("utf-8"))

    structural_counts = validate_docx(OUTPUT)
    manifest = {
        "document_id": DOCUMENT_ID,
        "generated_at_utc": timestamp,
        "source": SOURCE.relative_to(ROOT).as_posix(),
        "output": OUTPUT.relative_to(ROOT).as_posix(),
        "git_commit": commit,
        "source_sha256": sha256(SOURCE),
        "docx_sha256": sha256(OUTPUT),
        "source_bytes": SOURCE.stat().st_size,
        "docx_bytes": OUTPUT.stat().st_size,
        "parsed_counts": parsed_counts,
        "structural_counts": structural_counts,
        "validation": "DOCX ZIP package and every XML relationship part parsed successfully",
        "limitation": "Internal evidence artifact; not an independent security or legal certification",
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"DOCX: {OUTPUT}")
    print(f"Manifest: {MANIFEST}")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
