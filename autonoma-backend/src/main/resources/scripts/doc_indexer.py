# Organization: Nutech
# Owner: Nutech
# Created At: 2026-09-02
# Description: Embedded Python document processor and local persistent FTS5 search indexer
# type: ignore
# pyright: reportGeneralTypeIssues=false, reportOptionalMemberAccess=false, reportOptionalCall=false, reportMissingImports=false, reportUnusedImport=false, reportUndefinedVariable=false
# pylint: disable=all

import sys
import os
import io
import json
import sqlite3
import argparse
import hashlib
import re
import base64
import asyncio
import importlib

# Dynamic module resolver for optional document processing packages
def _resolve_module(module_name):
    try:
        return importlib.import_module(module_name)
    except Exception:
        return None

pymupdf = _resolve_module("pymupdf") or _resolve_module("fitz")
pypdf = _resolve_module("pypdf")
docx = _resolve_module("docx")
openpyxl = _resolve_module("openpyxl")
pytesseract = _resolve_module("pytesseract")
winocr = _resolve_module("winocr")
Image = _resolve_module("PIL.Image")
ImageDraw = _resolve_module("PIL.ImageDraw")

# Ensure stdout uses utf-8 encoding on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def compute_sha256(filepath):
    """Compute SHA-256 hash of physical file."""
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def get_db_connection(db_path):
    """Initialize SQLite FTS5 database."""
    parent_dir = os.path.dirname(os.path.abspath(db_path))
    if parent_dir:
        os.makedirs(parent_dir, exist_ok=True)
    con = sqlite3.connect(db_path, timeout=30.0)
    con.execute("PRAGMA journal_mode = WAL;")
    con.execute("PRAGMA synchronous = NORMAL;")
    
    con.execute("""
    CREATE TABLE IF NOT EXISTS indexed_files (
        file_hash TEXT PRIMARY KEY,
        file_name TEXT,
        file_type TEXT,
        page_count INTEGER,
        row_count INTEGER,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    con.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS doc_search_index USING fts5(
        file_hash UNINDEXED,
        page_no UNINDEXED,
        line_no UNINDEXED,
        sheet_name UNINDEXED,
        cell_ref UNINDEXED,
        content_text,
        x UNINDEXED,
        y UNINDEXED,
        w UNINDEXED,
        h UNINDEXED,
        tokenize='unicode61 remove_diacritics 2'
    );
    """)
    con.commit()
    return con

def extract_pdf(filepath):
    """Extract text lines with precise normalized coordinates from PDF using pymupdf or pypdf."""
    results = []
    page_count = 1
    
    if pymupdf:
        try:
            doc = pymupdf.open(filepath)
            page_count = len(doc)
            for page_idx, page in enumerate(doc):
                page_no = page_idx + 1
                page_w = page.rect.width
                page_h = page.rect.height
                
                blocks = page.get_text("blocks")
                line_no = 1
                for b in blocks:
                    # b: (x0, y0, x1, y1, text, block_no, block_type)
                    if len(b) >= 5 and b[4].strip():
                        b_text = b[4].strip()
                        x0, y0, x1, y1 = b[0], b[1], b[2], b[3]
                        norm_x = round(x0 / page_w, 4) if page_w > 0 else 0
                        norm_y = round(y0 / page_h, 4) if page_h > 0 else 0
                        norm_w = round((x1 - x0) / page_w, 4) if page_w > 0 else 0.1
                        norm_h = round((y1 - y0) / page_h, 4) if page_h > 0 else 0.03
                        
                        for line in b_text.splitlines():
                            line_clean = line.strip()
                            if line_clean:
                                results.append({
                                    "page_no": page_no,
                                    "line_no": line_no,
                                    "sheet": None,
                                    "cell": None,
                                    "text": line_clean,
                                    "x": norm_x,
                                    "y": norm_y,
                                    "w": norm_w,
                                    "h": norm_h
                                })
                                line_no += 1
                                
                # If page text was sparse, try OCR on page images
                page_chars = sum(len(r["text"]) for r in results if r["page_no"] == page_no)
                if page_chars < 30 and pytesseract and Image:
                    for img_info in page.get_images(full=True):
                        try:
                            base_image = doc.extract_image(img_info[0])
                            img = Image.open(io.BytesIO(base_image["image"]))
                            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                            img_w, img_h = img.size
                            n_boxes = len(data['text'])
                            current_line = []
                            last_line_num = -1
                            for i in range(n_boxes):
                                word = data['text'][i].strip()
                                if not word:
                                    continue
                                ln = data['line_num'][i]
                                if ln != last_line_num and current_line:
                                    ltext = " ".join(w['text'] for w in current_line)
                                    results.append({
                                        "page_no": page_no,
                                        "line_no": line_no,
                                        "sheet": None,
                                        "cell": None,
                                        "text": ltext,
                                        "x": round(min(w['x'] for w in current_line) / img_w, 4),
                                        "y": round(min(w['y'] for w in current_line) / img_h, 4),
                                        "w": round((max(w['x'] + w['w'] for w in current_line) - min(w['x'] for w in current_line)) / img_w, 4),
                                        "h": round((max(w['y'] + w['h'] for w in current_line) - min(w['y'] for w in current_line)) / img_h, 4)
                                    })
                                    line_no += 1
                                    current_line = []
                                last_line_num = ln
                                current_line.append({"text": word, "x": data['left'][i], "y": data['top'][i], "w": data['width'][i], "h": data['height'][i]})
                        except Exception:
                            pass
            doc.close()
            return results, page_count
        except Exception:
            pass

    if not pypdf:
        raise ImportError("Neither pymupdf nor pypdf is installed.")
        
    reader = pypdf.PdfReader(filepath)
    page_count = len(reader.pages)
    
    for page_idx, page in enumerate(reader.pages):
        page_no = page_idx + 1
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        if len("".join(lines)) < 30:
            ocr_lines = try_ocr_pdf_page(page)
            if ocr_lines:
                for line_idx, item in enumerate(ocr_lines):
                    results.append({
                        "page_no": page_no,
                        "line_no": line_idx + 1,
                        "sheet": None,
                        "cell": None,
                        "text": item["text"],
                        "x": item.get("x"),
                        "y": item.get("y"),
                        "w": item.get("w"),
                        "h": item.get("h")
                    })
                continue
        
        for line_idx, line in enumerate(lines):
            results.append({
                "page_no": page_no,
                "line_no": line_idx + 1,
                "sheet": None,
                "cell": None,
                "text": line,
                "x": None,
                "y": None,
                "w": None,
                "h": None
            })
            
    return results, page_count

def try_ocr_pdf_page(page):
    """OCR images extracted from a PDF page if pytesseract is present."""
    if not pytesseract or not Image:
        return []
    try:
        lines = []
        for img_obj in getattr(page, "images", []):
            img = Image.open(io.BytesIO(img_obj.data))
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            img_w, img_h = img.size
            
            n_boxes = len(data['text'])
            current_line = []
            last_line_num = -1
            
            for i in range(n_boxes):
                word = data['text'][i].strip()
                if not word:
                    continue
                line_num = data['line_num'][i]
                if line_num != last_line_num and current_line:
                    line_text = " ".join(w['text'] for w in current_line)
                    min_x = min(w['x'] for w in current_line) / img_w
                    min_y = min(w['y'] for w in current_line) / img_h
                    max_x = max(w['x'] + w['w'] for w in current_line) / img_w
                    max_y = max(w['y'] + w['h'] for w in current_line) / img_h
                    lines.append({
                        "text": line_text,
                        "x": round(min_x, 4),
                        "y": round(min_y, 4),
                        "w": round(max_x - min_x, 4),
                        "h": round(max_y - min_y, 4)
                    })
                    current_line = []
                last_line_num = line_num
                current_line.append({
                    "text": word,
                    "x": data['left'][i],
                    "y": data['top'][i],
                    "w": data['width'][i],
                    "h": data['height'][i]
                })
            if current_line:
                line_text = " ".join(w['text'] for w in current_line)
                min_x = min(w['x'] for w in current_line) / img_w
                min_y = min(w['y'] for w in current_line) / img_h
                max_x = max(w['x'] + w['w'] for w in current_line) / img_w
                max_y = max(w['y'] + w['h'] for w in current_line) / img_h
                lines.append({
                    "text": line_text,
                    "x": round(min_x, 4),
                    "y": round(min_y, 4),
                    "w": round(max_x - min_x, 4),
                    "h": round(max_y - min_y, 4)
                })
        return lines
    except Exception:
        return []

def extract_docx(filepath):
    """Extract paragraphs and tables from Word DOCX."""
    if not docx:
        raise ImportError("python-docx package is not installed.")
    doc = docx.Document(filepath)
    results = []
    line_no = 1
    
    current_section = "General"
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue
        if p.style.name.startswith("Heading"):
            current_section = txt
        results.append({
            "page_no": 1,
            "line_no": line_no,
            "sheet": current_section,
            "cell": None,
            "text": txt,
            "x": None,
            "y": None,
            "w": None,
            "h": None
        })
        line_no += 1
        
    for table in doc.tables:
        for row in table.rows:
            row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_texts:
                results.append({
                    "page_no": 1,
                    "line_no": line_no,
                    "sheet": "Table",
                    "cell": None,
                    "text": " | ".join(row_texts),
                    "x": None,
                    "y": None,
                    "w": None,
                    "h": None
                })
                line_no += 1
                
    return results, 1

def extract_xlsx(filepath):
    """Extract cell values and coordinates from Excel XLSX."""
    if not openpyxl:
        raise ImportError("openpyxl package is not installed.")
    wb = openpyxl.load_workbook(filepath, data_only=True, read_only=True)
    results = []
    
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        for row_idx, row in enumerate(sheet.iter_rows(values_only=False)):
            for cell in row:
                if cell.value is not None:
                    val_str = str(cell.value).strip()
                    if val_str:
                        results.append({
                            "page_no": 1,
                            "line_no": row_idx + 1,
                            "sheet": sheet_name,
                            "cell": cell.coordinate,
                            "text": val_str,
                            "x": None,
                            "y": None,
                            "w": None,
                            "h": None
                        })
    wb.close()
    return results, 1

def extract_image(filepath):
    """Extract text from image using winocr (native Windows Media OCR) or pytesseract."""
    if not Image:
        return [], 1
    
    results = []
    
    # 1. Primary: Windows Media OCR (winocr) - highly accurate, built into Windows 10/11
    if winocr and asyncio:
        try:
            img = Image.open(filepath)
            orig_w, orig_h = img.size

            # Upscale 2x for scanned reports, drawings, and small table text (greatly enhances glyph recognition)
            target_img = img
            scale = 1.0
            if max(orig_w, orig_h) < 4000 and min(orig_w, orig_h) < 2500:
                scale = 2.0
                target_img = img.resize((int(orig_w * scale), int(orig_h * scale)), Image.Resampling.LANCZOS)

            effective_w, effective_h = target_img.size
            ocr_res = asyncio.run(winocr.recognize_pil(target_img, 'en-US'))

            # Fallback to original image if scaled had 0 lines for some reason
            if (not ocr_res or not ocr_res.lines) and scale != 1.0:
                effective_w, effective_h = orig_w, orig_h
                ocr_res = asyncio.run(winocr.recognize_pil(img, 'en-US'))

            if ocr_res and ocr_res.lines:
                for line_idx, line in enumerate(ocr_res.lines):
                    text = line.text.strip()
                    if not text:
                        continue
                    
                    min_x, min_y, w_norm, h_norm = None, None, None, None
                    if hasattr(line, 'words') and line.words:
                        lefts = [w.bounding_rect.x for w in line.words if hasattr(w, 'bounding_rect')]
                        tops = [w.bounding_rect.y for w in line.words if hasattr(w, 'bounding_rect')]
                        rights = [w.bounding_rect.x + w.bounding_rect.width for w in line.words if hasattr(w, 'bounding_rect')]
                        bottoms = [w.bounding_rect.y + w.bounding_rect.height for w in line.words if hasattr(w, 'bounding_rect')]
                        if lefts and tops and rights and bottoms:
                            min_x = round(min(lefts) / effective_w, 4)
                            min_y = round(min(tops) / effective_h, 4)
                            w_norm = round((max(rights) - min(lefts)) / effective_w, 4)
                            h_norm = round((max(bottoms) - min(tops)) / effective_h, 4)
                    
                    results.append({
                        "page_no": 1,
                        "line_no": line_idx + 1,
                        "sheet": None,
                        "cell": None,
                        "text": text,
                        "x": min_x,
                        "y": min_y,
                        "w": w_norm,
                        "h": h_norm
                    })
                if results:
                    return results, 1
        except Exception:
            pass

    # 2. Secondary fallback: pytesseract
    if pytesseract:
        try:
            img = Image.open(filepath)
            img_w, img_h = img.size
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            
            n_boxes = len(data['text'])
            current_line = []
            last_line_num = -1
            line_count = 1
            
            for i in range(n_boxes):
                word = data['text'][i].strip()
                if not word:
                    continue
                line_num = data['line_num'][i]
                if line_num != last_line_num and current_line:
                    line_text = " ".join(w['text'] for w in current_line)
                    min_x = min(w['x'] for w in current_line) / img_w
                    min_y = min(w['y'] for w in current_line) / img_h
                    max_x = max(w['x'] + w['w'] for w in current_line) / img_w
                    max_y = max(w['y'] + w['h'] for w in current_line) / img_h
                    results.append({
                        "page_no": 1,
                        "line_no": line_count,
                        "sheet": None,
                        "cell": None,
                        "text": line_text,
                        "x": round(min_x, 4),
                        "y": round(min_y, 4),
                        "w": round(max_x - min_x, 4),
                        "h": round(max_y - min_y, 4)
                    })
                    line_count += 1
                    current_line = []
                last_line_num = line_num
                current_line.append({
                    "text": word,
                    "x": data['left'][i],
                    "y": data['top'][i],
                    "w": data['width'][i],
                    "h": data['height'][i]
                })
                
            if current_line:
                line_text = " ".join(w['text'] for w in current_line)
                min_x = min(w['x'] for w in current_line) / img_w
                min_y = min(w['y'] for w in current_line) / img_h
                max_x = max(w['x'] + w['w'] for w in current_line) / img_w
                max_y = max(w['y'] + w['h'] for w in current_line) / img_h
                results.append({
                    "page_no": 1,
                    "line_no": line_count,
                    "sheet": None,
                    "cell": None,
                    "text": line_text,
                    "x": round(min_x, 4),
                    "y": round(min_y, 4),
                    "w": round(max_x - min_x, 4),
                    "h": round(max_y - min_y, 4)
                })
        except Exception:
            pass

    return results, 1

def extract_text(filepath):
    """Extract plain text lines."""
    results = []
    encodings = ['utf-8', 'latin-1', 'cp1252']
    content = None
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
    if content is None:
        return results, 1
    
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        clean = line.strip()
        if clean:
            results.append({
                "page_no": 1,
                "line_no": idx + 1,
                "sheet": None,
                "cell": None,
                "text": clean,
                "x": None,
                "y": None,
                "w": None,
                "h": None
            })
    return results, 1

def handle_extract(args):
    """Extract document content and store into local FTS5 index."""
    filepath = args.file
    if not os.path.exists(filepath):
        print(json.dumps({"success": False, "error": f"File not found: {filepath}"}))
        return

    file_hash = args.hash or compute_sha256(filepath)
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()
    
    con = get_db_connection(args.db)
    
    # Check if this exact file hash is already indexed
    cur = con.execute("SELECT page_count, row_count FROM indexed_files WHERE file_hash = ?", (file_hash,))
    row = cur.fetchone()
    if row and not args.force:
        print(json.dumps({
            "success": True,
            "cached": True,
            "fileHash": file_hash,
            "fileName": filename,
            "fileType": ext.lstrip('.').upper(),
            "pageCount": row[0],
            "rowCount": row[1]
        }))
        con.close()
        return

    # Dispatch to appropriate extractor
    try:
        if ext == '.pdf':
            items, page_count = extract_pdf(filepath)
            file_type = 'PDF'
        elif ext in ['.docx', '.doc']:
            items, page_count = extract_docx(filepath)
            file_type = 'DOCX'
        elif ext in ['.xlsx', '.xls']:
            items, page_count = extract_xlsx(filepath)
            file_type = 'XLSX'
        elif ext in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
            items, page_count = extract_image(filepath)
            file_type = 'IMAGE'
        elif ext in ['.txt', '.csv', '.json', '.xml', '.log']:
            items, page_count = extract_text(filepath)
            file_type = 'TEXT'
        else:
            print(json.dumps({
                "success": False,
                "fileHash": file_hash,
                "error": f"Unsupported file type: {ext}",
                "fileType": "NOT_SUPPORTED"
            }))
            con.close()
            return
            
        # Delete prior index entries for this file_hash if re-indexing
        con.execute("DELETE FROM doc_search_index WHERE file_hash = ?", (file_hash,))
        con.execute("DELETE FROM indexed_files WHERE file_hash = ?", (file_hash,))
        
        # Batch insert into FTS5
        insert_data = [
            (
                file_hash,
                item["page_no"],
                item["line_no"],
                item["sheet"] or "",
                item["cell"] or "",
                item["text"],
                str(item["x"]) if item.get("x") is not None else "",
                str(item["y"]) if item.get("y") is not None else "",
                str(item["w"]) if item.get("w") is not None else "",
                str(item["h"]) if item.get("h") is not None else ""
            )
            for item in items
        ]
        
        con.executemany("""
        INSERT INTO doc_search_index(file_hash, page_no, line_no, sheet_name, cell_ref, content_text, x, y, w, h)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, insert_data)
        
        con.execute("""
        INSERT INTO indexed_files(file_hash, file_name, file_type, page_count, row_count)
        VALUES (?, ?, ?, ?, ?)
        """, (file_hash, filename, file_type, page_count, len(items)))
        
        con.commit()
        con.close()
        
        print(json.dumps({
            "success": True,
            "cached": False,
            "fileHash": file_hash,
            "fileName": filename,
            "fileType": file_type,
            "pageCount": page_count,
            "rowCount": len(items)
        }))
    except Exception as e:
        con.close()
        print(json.dumps({
            "success": False,
            "fileHash": file_hash,
            "error": str(e)
        }))

def handle_search(args):
    """Search local FTS5 index for matching documents, lines, and cells."""
    query = args.query.strip()
    if not query:
        print(json.dumps({"success": True, "total": 0, "matches": []}))
        return
        
    allowed_hashes = None
    if getattr(args, "hashes", None):
        allowed_hashes = [h.strip() for h in args.hashes.split(",") if h.strip()]
        if not allowed_hashes:
            print(json.dumps({"success": True, "total": 0, "matches": []}))
            return

    con = get_db_connection(args.db)
    limit = args.limit or 50
    rows = []

    # Clean query words: strip quotes, colons, wildcards that interfere with FTS5 syntax
    clean_query = query.replace('"', ' ').replace("'", ' ').replace(':', ' ').replace('*', ' ').strip()
    words = [w for w in clean_query.replace('/', ' ').replace('-', ' ').replace('_', ' ').replace('.', ' ').split() if w]

    # Attempt 1: Tokenized prefix match (e.g. 'ander' -> 'ander*', 'john ander' -> 'john* AND ander*')
    # Enables instant partial word search so typing 'ander' matches 'Anderson'
    if words:
        fts_prefix_query = " AND ".join(f'{w}*' for w in words)
        try:
            if allowed_hashes:
                placeholders = ",".join("?" for _ in allowed_hashes)
                sql = f"""
                SELECT 
                    file_hash, page_no, line_no, sheet_name, cell_ref,
                    snippet(doc_search_index, 5, '<mark>', '</mark>', '...', 12) AS matched_snippet,
                    content_text, x, y, w, h,
                    bm25(doc_search_index) AS score
                FROM doc_search_index
                WHERE file_hash IN ({placeholders}) AND content_text MATCH ?
                ORDER BY score ASC
                LIMIT ?;
                """
                params = tuple(allowed_hashes) + (fts_prefix_query, limit)
            else:
                sql = """
                SELECT 
                    file_hash, page_no, line_no, sheet_name, cell_ref,
                    snippet(doc_search_index, 5, '<mark>', '</mark>', '...', 12) AS matched_snippet,
                    content_text, x, y, w, h,
                    bm25(doc_search_index) AS score
                FROM doc_search_index
                WHERE content_text MATCH ?
                ORDER BY score ASC
                LIMIT ?;
                """
                params = (fts_prefix_query, limit)
            cur = con.execute(sql, params)
            rows = cur.fetchall()
        except Exception:
            rows = []

    # Attempt 2: If prefix match yielded 0 rows or errored, try exact quoted phrase
    if not rows and query:
        sanitized_phrase = query.replace('"', '""')
        fts_exact_query = f'"{sanitized_phrase}"'
        try:
            if allowed_hashes:
                placeholders = ",".join("?" for _ in allowed_hashes)
                sql = f"""
                SELECT 
                    file_hash, page_no, line_no, sheet_name, cell_ref,
                    snippet(doc_search_index, 5, '<mark>', '</mark>', '...', 12) AS matched_snippet,
                    content_text, x, y, w, h,
                    bm25(doc_search_index) AS score
                FROM doc_search_index
                WHERE file_hash IN ({placeholders}) AND content_text MATCH ?
                ORDER BY score ASC
                LIMIT ?;
                """
                params = tuple(allowed_hashes) + (fts_exact_query, limit)
            else:
                sql = """
                SELECT 
                    file_hash, page_no, line_no, sheet_name, cell_ref,
                    snippet(doc_search_index, 5, '<mark>', '</mark>', '...', 12) AS matched_snippet,
                    content_text, x, y, w, h,
                    bm25(doc_search_index) AS score
                FROM doc_search_index
                WHERE content_text MATCH ?
                ORDER BY score ASC
                LIMIT ?;
                """
                params = (fts_exact_query, limit)
            cur = con.execute(sql, params)
            rows = cur.fetchall()
        except Exception:
            rows = []

    # Attempt 3: Substring match (LIKE %query%) for middle-of-word or numeric sequences
    if not rows and query:
        like_pattern = f'%{query}%'
        if allowed_hashes:
            placeholders = ",".join("?" for _ in allowed_hashes)
            like_sql = f"""
            SELECT 
                file_hash, page_no, line_no, sheet_name, cell_ref,
                content_text, content_text,
                x, y, w, h,
                1.0 AS score
            FROM doc_search_index
            WHERE file_hash IN ({placeholders}) AND content_text LIKE ?
            LIMIT ?;
            """
            like_params = tuple(allowed_hashes) + (like_pattern, limit)
        else:
            like_sql = """
            SELECT 
                file_hash, page_no, line_no, sheet_name, cell_ref,
                content_text, content_text,
                x, y, w, h,
                1.0 AS score
            FROM doc_search_index
            WHERE content_text LIKE ?
            LIMIT ?;
            """
            like_params = (like_pattern, limit)
        try:
            cur = con.execute(like_sql, like_params)
            raw_like_rows = cur.fetchall()
            re_pattern = re.compile(re.escape(query), re.IGNORECASE)
            for lr in raw_like_rows:
                highlighted = re_pattern.sub(r'<mark>\g<0></mark>', lr[5])
                rows.append((lr[0], lr[1], lr[2], lr[3], lr[4], highlighted, lr[6], lr[7], lr[8], lr[9], lr[10], lr[11]))
        except Exception:
            pass
            
    matches = []
    for r in rows:
        matches.append({
            "fileHash": r[0],
            "page": int(r[1]) if r[1] else 1,
            "line": int(r[2]) if r[2] else 1,
            "sheet": r[3] if r[3] else None,
            "cell": r[4] if r[4] else None,
            "snippet": r[5] if r[5] else r[6],
            "text": r[6],
            "x": float(r[7]) if r[7] and str(r[7]).strip() else None,
            "y": float(r[8]) if r[8] and str(r[8]).strip() else None,
            "w": float(r[9]) if r[9] and str(r[9]).strip() else None,
            "h": float(r[10]) if r[10] and str(r[10]).strip() else None,
            "score": float(r[11]) if r[11] is not None else 1.0
        })
        
    con.close()
    
    print(json.dumps({
        "success": True,
        "total": len(matches),
        "matches": matches
    }))

def handle_status(args):
    """Return statistics on indexed documents and database size."""
    if not os.path.exists(args.db):
        print(json.dumps({
            "success": True,
            "indexedFiles": 0,
            "totalRows": 0,
            "dbSizeBytes": 0
        }))
        return
        
    con = get_db_connection(args.db)
    file_cnt = con.execute("SELECT COUNT(*) FROM indexed_files").fetchone()[0]
    row_cnt = con.execute("SELECT COUNT(*) FROM doc_search_index").fetchone()[0]
    db_size = os.path.getsize(args.db)
    con.close()
    print(json.dumps({
        "success": True,
        "indexedFiles": file_cnt,
        "totalRows": row_cnt,
        "dbSizeBytes": db_size
    }))

def handle_render_preview(args):
    """Render a high-resolution page preview with highlight and bounding box annotations."""
    filepath = args.file
    page_num = max(1, args.page)
    query = (args.query or "").strip()
    highlight = args.highlight
    out_path = args.out
    dpi = args.dpi if hasattr(args, 'dpi') and args.dpi else 150
    
    if not os.path.exists(filepath):
        print(json.dumps({"success": False, "error": f"File not found: {filepath}"}))
        return
        
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        if ext == ".pdf":
            if not pymupdf:
                print(json.dumps({"success": False, "error": "PyMuPDF is required for PDF page rendering."}))
                return
            doc = pymupdf.open(filepath)
            total_pages = len(doc)
            if page_num > total_pages:
                page_num = total_pages
            page = doc[page_num - 1]
            
            coords = []
            if highlight and query:
                tokens = [t.strip() for t in query.split() if len(t.strip()) > 1] or [query]
                for token in tokens:
                    rects = page.search_for(token)
                    for r in rects:
                        coords.append({
                            "x": round(r.x0 / page.rect.width, 4),
                            "y": round(r.y0 / page.rect.height, 4),
                            "w": round(r.width / page.rect.width, 4),
                            "h": round(r.height / page.rect.height, 4)
                        })
                        # Add clean yellow marker highlight
                        annot = page.add_highlight_annot(r)
                        annot.set_colors(stroke=(1.0, 0.88, 0.15))
                        annot.update()
                        
            pix = page.get_pixmap(dpi=dpi)
            if out_path:
                pix.save(out_path)
                print(json.dumps({
                    "success": True,
                    "page": page_num,
                    "totalPages": total_pages,
                    "outputPath": out_path,
                    "highlightsFound": len(coords),
                    "coordinates": coords
                }))
            else:
                img_bytes = pix.tobytes("png")
                b64 = base64.b64encode(img_bytes).decode('utf-8')
                print(json.dumps({
                    "success": True,
                    "page": page_num,
                    "totalPages": total_pages,
                    "dataUrl": f"data:image/png;base64,{b64}",
                    "highlightsFound": len(coords),
                    "coordinates": coords
                }))
            doc.close()
            
        elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp", ".tiff"]:
            if not Image:
                print(json.dumps({"success": False, "error": "PIL/Pillow is required for image preview."}))
                return
            img = Image.open(filepath).convert("RGBA")
            img_w, img_h = img.size
            draw = ImageDraw.Draw(img) if ImageDraw else None
            
            coords = []
            if highlight and query and pytesseract:
                try:
                    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                    n_boxes = len(data['text'])
                    clean_q = query.lower()
                    for i in range(n_boxes):
                        text = data['text'][i].strip().lower()
                        if text and (clean_q in text or text in clean_q):
                            x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                            coords.append({
                                "x": round(x / img_w, 4),
                                "y": round(y / img_h, 4),
                                "w": round(w / img_w, 4),
                                "h": round(h / img_h, 4)
                            })
                            if draw:
                                draw.rectangle([x, y, x + w, y + h], fill=(255, 235, 59, 130))
                except Exception:
                    pass
                    
            if out_path:
                img.convert("RGB").save(out_path, "JPEG", quality=90)
                print(json.dumps({
                    "success": True,
                    "page": 1,
                    "totalPages": 1,
                    "outputPath": out_path,
                    "highlightsFound": len(coords),
                    "coordinates": coords
                }))
            else:
                buf = io.BytesIO()
                img.convert("RGB").save(buf, format="JPEG", quality=90)
                b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                print(json.dumps({
                    "success": True,
                    "page": 1,
                    "totalPages": 1,
                    "dataUrl": f"data:image/jpeg;base64,{b64}",
                    "highlightsFound": len(coords),
                    "coordinates": coords
                }))
        else:
            print(json.dumps({"success": False, "error": f"Unsupported format for visual preview: {ext}"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

def main():
    parser = argparse.ArgumentParser(description="BOSS ERP Embedded Document Indexer")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Extract command
    ext_parser = subparsers.add_parser("extract")
    ext_parser.add_argument("--file", required=True, help="Absolute path to document")
    ext_parser.add_argument("--hash", required=False, help="Pre-computed SHA-256 hash")
    ext_parser.add_argument("--db", required=True, help="Path to SQLite FTS5 database")
    ext_parser.add_argument("--force", action="store_true", help="Force re-extraction")
    
    # Search command
    srch_parser = subparsers.add_parser("search")
    srch_parser.add_argument("--query", required=True, help="Search query string")
    srch_parser.add_argument("--db", required=True, help="Path to SQLite FTS5 database")
    srch_parser.add_argument("--limit", type=int, default=50, help="Max results limit")
    srch_parser.add_argument("--hashes", required=False, help="Comma-separated file hashes to restrict search to")
    
    # Status command
    stat_parser = subparsers.add_parser("status")
    stat_parser.add_argument("--db", required=True, help="Path to SQLite FTS5 database")
    
    # Render Preview command
    prev_parser = subparsers.add_parser("render-preview")
    prev_parser.add_argument("--file", required=True, help="Absolute path to document")
    prev_parser.add_argument("--page", type=int, default=1, help="Page number (1-indexed)")
    prev_parser.add_argument("--query", required=False, default="", help="Query to highlight")
    prev_parser.add_argument("--highlight", action="store_true", help="Apply visual highlight")
    prev_parser.add_argument("--out", required=False, help="Optional output image file path")
    prev_parser.add_argument("--dpi", type=int, default=150, help="Render DPI resolution")
    
    args = parser.parse_args()
    if args.command == "extract":
        handle_extract(args)
    elif args.command == "search":
        handle_search(args)
    elif args.command == "status":
        handle_status(args)
    elif args.command == "render-preview":
        handle_render_preview(args)

if __name__ == "__main__":
    main()
