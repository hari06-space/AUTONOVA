"""
HTML Parser Module using BeautifulSoup4.
Extracts clean plain text, URLs/links, and structured table data from incoming HTML email bodies.
"""

from typing import Dict, List, Any
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger("HtmlParser")

class EmailHtmlParser:
    @staticmethod
    def parse_html(html_content: str) -> Dict[str, Any]:
        """
        Parses raw HTML string using BeautifulSoup4.
        
        Returns:
            dict containing:
                - text (str): Clean plain text stripped of HTML tags
        Parses HTML email body, extracts tables, links, and returns structured text
        while preserving spacing, indentation, and structure.
        """
        if not html_content:
            return {
                "text": "",
                "tables": [],
                "links": []
            }
        
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Extract links
            links = []
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"].strip()
                if href and not href.startswith("javascript:"):
                    links.append(href)

            # Extract structured tables
            tables_data = []
            for table in soup.find_all("table"):
                rows_data = []
                for tr in table.find_all("tr"):
                    cells = tr.find_all(["td", "th"])
                    row = [cell.get_text(separator=" ", strip=True) for cell in cells]
                    if any(row):  # Only append non-empty rows
                        rows_data.append(row)
                if rows_data:
                    tables_data.append(rows_data)

            # Extract plain text preserving original spacing and layout
            lines = []
            current_line = []
            
            def flush_current():
                if current_line:
                    lines.append("".join(current_line))
                    current_line.clear()

            def traverse(node, in_pre=False):
                if node.name in ['style', 'script', 'head', 'title', 'meta', 'link']:
                    return
                    
                if isinstance(node, str):
                    val = str(node)
                    if not val.strip() and not in_pre:
                        return
                    val = val.replace('\r\n', '\n').replace('\r', '\n')
                    parts = val.split('\n')
                    for idx, part in enumerate(parts):
                        if idx > 0:
                            flush_current()
                        current_line.append(part)
                    return
                    
                is_pre = in_pre or (node.name == 'pre')
                
                if node.name == 'br':
                    flush_current()
                    # A br tag forces a newline; if the last line wasn't blank, we append a blank line
                    # to represent consecutive br tags correctly.
                    if lines and lines[-1] == "":
                        pass
                    else:
                        lines.append("")
                    return
                    
                is_block = node.name in ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'blockquote']
                
                if is_block:
                    flush_current()
                    
                if node.name == 'li':
                    current_line.append("  * ")
                    
                for child in node.children:
                    traverse(child, is_pre)
                    
                if is_block:
                    flush_current()
                    if node.name in ['p', 'blockquote']:
                        # Add a blank line if the last line isn't already a blank line
                        if lines and lines[-1] != "":
                            lines.append("")

            traverse(soup)
            flush_current()
            
            cleaned_text = "\n".join(lines)
            cleaned_text = cleaned_text.strip()

            return {
                "text": cleaned_text,
                "tables": tables_data,
                "links": links
            }
        except Exception as e:
            logger.error(f"Failed to parse HTML with BeautifulSoup: {e}", exc_info=True)
            return {
                "text": html_content,
                "tables": [],
                "links": []
            }


class AttachmentFilter:
    @staticmethod
    def should_keep_image(
        filename: str,
        content_type: str,
        is_inline: bool,
        content_id: str,
        body_html: str,
        body_text: str,
        size_bytes: int = None
    ) -> bool:
        """
        Determines whether an image attachment is a genuine customer product/reference image (True)
        or a signature/logo/decorative/tracking image (False).
        """
        # 1. Non-image files are always kept
        if not content_type or not content_type.lower().startswith("image/"):
            return True

        filename_lower = (filename or "").lower().strip()
        content_id_clean = (content_id or "").strip("<> ")

        # 2. Tracking pixel / tiny spacer check
        if size_bytes is not None and size_bytes < 3000:
            logger.info(f"Classified '{filename}' as ignore: size {size_bytes} < 3000 bytes")
            return False

        # Common social media / logo / icon / badge keywords in filenames
        logo_keywords = [
            "facebook", "linkedin", "twitter", "instagram", "youtube", "pinterest",
            "social", "logo", "banner", "header", "footer", "sign", "signature",
            "icon", "pixel", "tracker", "spacer", "bullet", "divider", "fb-", "ln-",
            "yt-", "tw-", "insta-", "whatsapp", "telegram", "anniversary", "30th",
            "iso", "certified", "badge", "award"
        ]
        if any(kw in filename_lower for kw in logo_keywords):
            logger.info(f"Classified '{filename}' as ignore: filename matches signature/social keyword")
            return False

        # 3. First-level MIME check: Content-Disposition: attachment
        # If it's explicitly marked as attachment (not inline), check if it is referenced in the HTML.
        # If not referenced in the HTML body, keep it. If it is, perform the position check.
        if not is_inline:
            if body_html and content_id_clean and content_id_clean in body_html:
                pass  # Referenced in HTML body, perform position check
            else:
                return True

        # 4. Check for explicit customer mentions in body text
        # If the customer mentions finding or referring to the image, it is genuine
        explicit_keywords = [
            "product image", "find the image", "attached image", "reference image",
            "below image", "image below", "this is the item", "find the product",
            "quote for the", "refers to", "refer to", "screenshot", "find attached",
            "the below product", "the below item", "provide quotation for"
        ]
        body_text_lower = (body_text or "").lower()
        
        # Check explicit mentions in the text
        if any(kw in body_text_lower for kw in explicit_keywords):
            logger.info(f"Classified '{filename}' as keep: explicit body keyword matched")
            return True

        # 5. Position and signature separator analysis
        signature_separators = [
            "thanks & regards",
            "thanks and regards",
            "thanks & regard",
            "thanks and regard",
            "best regards",
            "best regards,",
            "regards",
            "regards,",
            "warm regards",
            "warm regards,",
            "kind regards",
            "kind regards,",
            "with regards",
            "with regards,",
            "yours windfully",
            "yours windfully,",
            "yours faithfully",
            "yours faithfully,",
            "yous faithfully",
            "yours sincerely",
            "yours sincerely,",
            "yours truly",
            "yours truly,",
            "best wishes",
            "cordially",
            "thank you",
            "thank you,"
        ]
        
        # Find first separator index in plain text
        sep_index = -1
        for sep in signature_separators:
            idx = body_text_lower.find(sep)
            if idx != -1:
                if sep_index == -1 or idx < sep_index:
                    sep_index = idx

        # Parse HTML to find the image tag and check its relative position or parent container
        if body_html and content_id_clean:
            try:
                soup = BeautifulSoup(body_html, "html.parser")
                # Look for img tag with src containing content_id
                img_tag = None
                for img in soup.find_all("img"):
                    src = img.get("src", "")
                    if content_id_clean in src:
                        img_tag = img
                        break
                
                if img_tag:
                    # Check parent container (table/div) for signature contact details
                    parent_container = img_tag.find_parent(["table", "div", "section", "footer"])
                    if parent_container:
                        container_text = parent_container.get_text(separator=" ").lower()
                        contact_indicators = [
                            "digitech", "wind parts", "private limited", "pvt ltd",
                            "tel:", "mob:", "phone:", "email:", "https://", "http://",
                            "chennai", "street", "anniversary", "yours windfully"
                        ]
                        matched_contacts = sum(1 for ind in contact_indicators if ind in container_text)
                        if matched_contacts >= 2:
                            logger.info(f"Classified '{filename}' as ignore: image is inside a signature contact container")
                            return False

                    img_str = str(img_tag)
                    html_str = str(soup)
                    img_pos = html_str.find(img_str)
                    if img_pos != -1:
                        pre_html = html_str[:img_pos]
                        pre_soup = BeautifulSoup(pre_html, "html.parser")
                        pre_text_lower = pre_soup.get_text(separator=" ").lower()
                        if any(sep in pre_text_lower for sep in signature_separators):
                            logger.info(f"Classified '{filename}' as ignore: image is located after signature separator in HTML")
                            return False
                        else:
                            logger.info(f"Classified '{filename}' as keep: image is located before signature separator in HTML")
                            return True
            except Exception as e:
                logger.error(f"Error parsing image position in HTML: {e}")

        # Fallback if HTML position extraction is inconclusive:
        # Check if the separator index is found in plain text.
        # If the text has a separator and no explicit mention was found,
        # we assume inline images are part of the signature/logos.
        if sep_index != -1:
            logger.info(f"Classified '{filename}' as ignore: separator found in text and no explicit mentions")
            return False

        # If no signature separator is found, and it's not a known icon name, keep it
        logger.info(f"Classified '{filename}' as keep: no signature separators or negative matches found")
        return True

