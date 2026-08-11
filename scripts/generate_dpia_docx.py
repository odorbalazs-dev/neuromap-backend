#!/usr/bin/env python3
"""Generate the Hungarian and English DPIA Word documents from Markdown.

This wrapper reuses the repository's standard-library OOXML renderer while
giving the DPIA its own cover, document identifiers and integrity manifests.
The Markdown files remain the authoritative, reviewable source documents.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import generate_security_evidence_register_docx as renderer


ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_RENDER_MARKDOWN = renderer.render_markdown


DOCUMENTS = {
    "hu": {
        "source": ROOT / "docs" / "DPIA_WORKING_DRAFT_HU.md",
        "output": ROOT / "docs" / "DPIA_WORKING_DRAFT_HU.docx",
        "manifest": ROOT / "docs" / "DPIA_WORKING_DRAFT_HU.integrity.json",
        "document_id": "NMK-DPIA-HU-001",
        "subtitle": "Adatvédelmi hatásvizsgálati munkapéldány",
        "notice_title": "MUNKAPÉLDÁNY - NEM JOGI SZAKVÉLEMÉNY VAGY TANÚSÍTVÁNY",
        "notice_body": (
            "A dokumentum mérnöki támogatással készült adatkezelői munkapéldány. "
            "Képzett uniós adatvédelmi jogász vagy DPO, az adatkezelő és a kijelölt "
            "felelősök jóváhagyása nélkül nem használható GDPR-megfelelőség igazolására."
        ),
        "footer": "NeuroMap Kids adatvédelmi hatásvizsgálat",
        "page_label": "Oldal ",
        "classification": "MUNKAPÉLDÁNY",
        "title": "NeuroMap Kids adatvédelmi hatásvizsgálat",
        "description": "Adatkezelői DPIA-munkapéldány",
        "commit_label": "vizsgált commit",
        "limitation": (
            "Adatkezelői munkapéldány; nem jogi szakvélemény, tanúsítás, "
            "hatósági jóváhagyás vagy önálló GDPR-megfelelőségi bizonyíték"
        ),
    },
    "en": {
        "source": ROOT / "docs" / "DPIA_WORKING_DRAFT.md",
        "output": ROOT / "docs" / "DPIA_WORKING_DRAFT.docx",
        "manifest": ROOT / "docs" / "DPIA_WORKING_DRAFT.integrity.json",
        "document_id": "NMK-DPIA-EN-001",
        "subtitle": "Data protection impact assessment working draft",
        "notice_title": "WORKING DRAFT - NOT LEGAL ADVICE OR CERTIFICATION",
        "notice_body": (
            "This engineering-supported controller draft must not be used as proof of GDPR "
            "compliance until it has been approved by qualified EU privacy counsel or a DPO, "
            "the controller and the named accountable owners."
        ),
        "footer": "NeuroMap Kids data protection impact assessment",
        "page_label": "Page ",
        "classification": "WORKING DRAFT",
        "title": "NeuroMap Kids Data Protection Impact Assessment",
        "description": "Controller DPIA working draft",
        "commit_label": "reviewed commit",
        "limitation": (
            "Controller working draft; not legal advice, certification, supervisory-authority "
            "approval or standalone evidence of GDPR compliance"
        ),
    },
}


def normalise_cover(markdown: str) -> str:
    """Convert the DPIA blockquote header into the renderer's metadata block."""
    lines = markdown.splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("The DPIA source is missing its level-one title.")

    first_section = next(
        (index for index, line in enumerate(lines[1:], start=1) if line.startswith("## ")),
        None,
    )
    if first_section is None:
        raise ValueError("The DPIA source has no numbered sections.")

    quote_lines = []
    for line in lines[1:first_section]:
        stripped = line.strip()
        if not stripped.startswith(">"):
            continue
        value = stripped[1:].strip()
        if not value:
            continue
        value = re.sub(r"^\*\*(.*?)\*\*$", r"\1", value)
        quote_lines.append(value)

    status = quote_lines[0] if quote_lines else "Working draft"
    version = next(
        (line.split(":", 1)[1].strip() for line in quote_lines if line.lower().startswith(("version:", "verzió:"))),
        "unversioned",
    )
    approvers = next(
        (
            line.split(":", 1)[1].strip()
            for line in quote_lines
            if line.lower().startswith(("required approvers:", "szükséges jóváhagyók:"))
        ),
        "Not recorded",
    )

    metadata = [
        lines[0],
        "",
        f"**Status / Állapot:** {status}  ",
        f"**Version / Verzió:** {version}  ",
        f"**Required approvers / Szükséges jóváhagyók:** {approvers}",
        "",
        "---",
        "",
    ]
    return "\n".join([*metadata, *lines[first_section:]])


def configure(config: dict[str, object]) -> None:
    renderer.SOURCE = config["source"]
    renderer.OUTPUT = config["output"]
    renderer.MANIFEST = config["manifest"]
    renderer.DOCUMENT_ID = str(config["document_id"])
    renderer.COVER_SUBTITLE = str(config["subtitle"])
    renderer.COVER_NOTICE_TITLE = str(config["notice_title"])
    renderer.COVER_NOTICE_BODY = str(config["notice_body"])
    renderer.FOOTER_LABEL = str(config["footer"])
    renderer.FOOTER_PAGE_LABEL = str(config["page_label"])
    renderer.HEADER_CLASSIFICATION = str(config["classification"])
    renderer.CORE_TITLE = str(config["title"])
    renderer.CORE_DESCRIPTION_PREFIX = str(config["description"])
    renderer.CORE_COMMIT_LABEL = str(config["commit_label"])
    renderer.ARTIFACT_LIMITATION = str(config["limitation"])

    def dpi_render(markdown: str):
        return ORIGINAL_RENDER_MARKDOWN(normalise_cover(markdown))

    renderer.render_markdown = dpi_render


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("languages", nargs="*", choices=sorted(DOCUMENTS), default=["hu", "en"])
    args = parser.parse_args()

    languages = args.languages or ["hu", "en"]
    for language in languages:
        configure(DOCUMENTS[language])
        result = renderer.main()
        if result:
            return result
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
