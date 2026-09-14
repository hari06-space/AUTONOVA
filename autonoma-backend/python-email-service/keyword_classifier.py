import re
from typing import Dict, Any

# Define keyword patterns
KEYWORDS = {
    "quotation_request": [
        r"\bquote\b", r"\bquotation\b", r"price\s*list", r"\bpricing\b", r"\bcost\b", r"\brfq\b", 
        r"request\s*for\s*quote", r"\bestimate\b", r"how\s*much\s*for", r"price\s*of",
        r"need\s*price", r"quote\s*request",
        r"\binvoice\b", r"\breceipt\b", r"payment\s*received", r"\bbill\b", r"\bbilling\b", 
        r"\bproforma\b", r"tax\s*invoice", r"\brfx\b", r"\benquiry\b", r"\binquiry\b"
    ],
    "ledger": [
        r"\bledger\b", r"statement\s*of\s*account", r"account\s*statement", 
        r"excel\s*template", r"customer\s*master", r"\boutstanding\b"
    ],
    "general_inquiry": [
        r"\bquestion\b", r"\binfo\b", r"\binformation\b",
        r"\bcomplain\b", r"\bcomplaint\b"
    ],
    "spam": [
        r"buy\s*now", r"discount\s*code", r"\bunsubscribed\b", r"\badvertisement\b", 
        r"\bpromotion\b", r"\boffer\b", r"free\s*trial", r"\bloan\b", r"credit\s*card", r"\blottery\b"
    ]
}

def classify_email_text(text: str) -> Dict[str, Any]:
    if not text:
        return {
            "intent": "general_inquiry",
            "confidence": 1.0,
            "reasoning": "Empty email text"
        }
        
    cleaned_text = text.lower().strip()
    
    # Check each intent sequentially
    for intent, patterns in KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, cleaned_text):
                return {
                    "intent": intent,
                    "confidence": 1.0,
                    "reasoning": f"Matched keyword/phrase pattern: '{pattern}'"
                }
                
    # Fallback if no keywords matched
    return {
        "intent": "general_inquiry",
        "confidence": 1.0,
        "reasoning": "No specific keywords matched for quotation, ledger, or spam. Defaulting to general inquiry."
    }
