import re
from typing import Dict, List, Optional

# Comprehensive FinTech & Conversational Hinglish Lexicon -> Devanagari Phonetics
HINGLISH_LEXICON: Dict[str, str] = {
    # Greetings, honorifics & polite closings
    "namaste": "नमस्ते",
    "namastey": "नमस्ते",
    "namaskar": "नमस्कार",
    "pranam": "प्रणाम",
    "ji": "जी",
    "jee": "जी",
    "dhanyawad": "धन्यवाद",
    "dhanyawaad": "धन्यवाद",
    "shukriya": "शुक्रिया",
    "alvida": "अलविदा",
    "bhai": "भाई",
    "sir": "सर",
    "ma'am": "मैम",
    "madam": "मैडम",

    # Pronouns & Postpositions
    "main": "मैं",
    "hum": "हम",
    "humne": "हमने",
    "maine": "मैंने",
    "aap": "आप",
    "aapka": "आपका",
    "aapki": "आपकी",
    "aapke": "आपके",
    "tum": "तुम",
    "tumhara": "तुम्हारा",
    "tumhari": "तुम्हारी",
    "tumhare": "तुम्हारे",
    "yeh": "यह",
    "ye": "ये",
    "woh": "वह",
    "wo": "वो",
    "ka": "का",
    "ki": "की",
    "ke": "के",
    "ko": "को",
    "se": "से",
    "me": "में",
    "mein": "में",
    "pe": "पे",
    "par": "पर",
    "ne": "ने",
    "bhi": "भी",
    "hi": "ही",
    "toh": "तो",
    "to": "तो",
    "tak": "तक",
    "wala": "वाला",
    "wali": "वाली",
    "wale": "वाले",

    # Verbs & Auxiliary
    "hai": "है",
    "hain": "हैं",
    "hoon": "हूँ",
    "hun": "हूँ",
    "ho": "हो",
    "tha": "था",
    "thi": "थी",
    "the": "थे",
    "hoga": "होगा",
    "hogi": "होगी",
    "honge": "होंगे",
    "kar": "कर",
    "karna": "करना",
    "karta": "करता",
    "karti": "करती",
    "karte": "करते",
    "karein": "करें",
    "karen": "करें",
    "kijiye": "कीजिए",
    "bol": "बोल",
    "bolna": "बोलना",
    "raha": "रहा",
    "rahi": "रही",
    "rahe": "रहे",
    "dekh": "देख",
    "dekha": "देखा",
    "dekhi": "देखी",
    "dekhe": "देखे",
    "samajh": "समझ",
    "samajhta": "समझता",
    "samajhti": "समझती",
    "diya": "दिया",
    "diye": "दिए",
    "di": "दी",
    "dena": "देना",
    "dijiye": "दीजिए",
    "dunga": "दूँगा",
    "dungi": "दूँगी",
    "doon": "दूँ",
    "dun": "दूँ",
    "bhej": "भेज",
    "bheja": "भेजा",
    "bheji": "भेजी",
    "bheje": "भेजे",
    "rakha": "रखा",
    "liya": "लिया",
    "liye": "लिए",
    "lena": "लेना",
    "lijiye": "लीजिए",
    "hua": "हुआ",
    "hui": "हुई",
    "hue": "हुए",
    "aana": "आना",
    "aata": "आता",
    "aati": "आती",
    "aate": "आते",
    "aaya": "आया",
    "aayi": "आयी",
    "aaye": "आए",
    "aa": "आ",
    "jana": "जाना",
    "jata": "जाता",
    "jati": "जाती",
    "jate": "जाते",
    "gaya": "गया",
    "gayi": "गयी",
    "gaye": "गए",
    "sakta": "सकता",
    "sakti": "सकती",
    "sakte": "सकते",
    "sakoon": "सकूँ",
    "paye": "पाए",
    "paya": "पाया",
    "band": "बंद",

    # Interrogatives & Negation
    "kya": "क्या",
    "kyun": "क्यों",
    "kaise": "कैसे",
    "kaisi": "कैसी",
    "kaisa": "कैसा",
    "kab": "कब",
    "kahan": "कहाँ",
    "kaun": "कौन",
    "kitna": "कितना",
    "kitni": "कितनी",
    "kitne": "कितने",
    "nahi": "नहीं",
    "nahin": "नहीं",
    "mat": "मत",
    "koi": "कोई",
    "kuch": "कुछ",

    # Adverbs, Adjectives & Conjunctions
    "haan": "हाँ",
    "bilkul": "बिल्कुल",
    "bahut": "बहुत",
    "bohot": "बहुत",
    "badhiya": "बढ़िया",
    "shandar": "शानदार",
    "turant": "तुरंत",
    "jaldi": "जल्दी",
    "agle": "अगले",
    "agla": "अगला",
    "agli": "अगली",
    "aadhe": "आधे",
    "aadha": "आधा",
    "pura": "पूरा",
    "puri": "पूरी",
    "pure": "पूरे",
    "thoda": "थोड़ा",
    "thodi": "थोड़ी",
    "thode": "थोड़े",
    "khud": "खुद",
    "sirf": "सिर्फ",
    "siraf": "सिर्फ",
    "zaroor": "ज़रूर",
    "zarur": "ज़रूर",
    "achha": "अच्छा",
    "achhi": "अच्छी",
    "achhe": "अच्छे",
    "sahi": "सही",
    "galat": "गलत",
    "aur": "और",
    "ya": "या",
    "lekin": "लेकिन",
    "magar": "मगर",
    "parantu": "परंतु",
    "wajah": "वजह",
    "karan": "कारण",
    "baat": "बात",
    "time": "टाइम",
    "ghante": "घंटे",
    "ghanta": "घंटा",
    "minute": "मिनट",
    "second": "सेकंड",
    "din": "दिन",
    "saal": "साल",
    "mahina": "महीना",
    "aaj": "आज",
    "kal": "कल",
    "ab": "अब",
    "abhi": "अभी",
    "tab": "तब",
    "ek": "एक",
    "do": "दो",
    "teen": "तीन",
    "chaar": "चार",
    "paanch": "पाँच",

    # FinTech & E-commerce Loanwords (Phonetically rendered in Devanagari)
    "shark": "शार्क",
    "payment": "पेमेंट",
    "care": "केयर",
    "team": "टीम",
    "checkout": "चेकआउट",
    "order": "ऑर्डर",
    "cart": "कार्ट",
    "discount": "डिस्काउंट",
    "offer": "ऑफ़र",
    "link": "लिंक",
    "instant": "इंस्टेंट",
    "direct": "डायरेक्ट",
    "special": "स्पेशल",
    "hold": "होल्ड",
    "apply": "अप्लाई",
    "interrupt": "इंटररप्ट",
    "interrupted": "इंटररप्ट",
    "fail": "फ़ेल",
    "failed": "फ़ेल्ड",
    "failure": "फ़ेलियर",
    "success": "सक्सेस",
    "successful": "सक्सेसफुल",
    "complete": "कम्प्लीट",
    "completed": "कम्प्लीट",
    "drop": "ड्रॉप",
    "dropout": "ड्रॉपआउट",
    "bank": "बैंक",
    "server": "सर्वर",
    "lag": "लैग",
    "down": "डाउन",
    "issue": "इशू",
    "problem": "प्रॉब्लम",
    "error": "एरर",
    "card": "कार्ड",
    "debit": "डेबिट",
    "credit": "क्रेडिट",
    "netbanking": "नेटबैंकिंग",
    "account": "अकाउंट",
    "balance": "बैलेंस",
    "app": "ऐप",
    "phone": "फ़ोन",
    "mobile": "मोबाइल",
    "call": "कॉल",
    "message": "मैसेज",
    "sms": "एस एम एस",
    "otp": "ओ टी पी",
    "upi": "यू पी आई",
    "ivr": "आई वी आर",
    "whatsapp": "व्हाट्सएप",
    "please": "प्लीज़",
    "help": "हेल्प",
    "madad": "मदद",
    "support": "सपोर्ट",
    "customer": "कस्टमर",
    "service": "सर्विस",
    "transaction": "ट्रांजेक्शन",
    "rupees": "रुपये",
    "percent": "परसेंट",
    "percentage": "परसेंट",
    "refund": "रिफंड",
    "retry": "रीट्राई",
    "mandate": "मैनडेट",
    "invoice": "इनवॉइस",
    "installment": "इंस्टॉलमेंट",
    "promise": "प्रॉमिस",
    "pay": "पे",
    "ptp": "प्रॉमिस टू पे",
    "1-click": "वन क्लिक",
    "one-click": "वन क्लिक",
    "3ds": "थ्री डी सिक्योर",
    "3d secure": "थ्री डी सिक्योर",
    "wonderful": "वंडरफुल",
    "day": "डे",
    "have": "हैव",
    "a": "अ",
    "cancel": "कैंसल",
    "cancelled": "कैंसल",
    "canceling": "कैंसल",
    "cancelling": "कैंसल",
    "delay": "डिले",
    "delays": "डिले",
    "priority": "प्रायोरिटी",
    "reserve": "रिज़र्व",
    "reserved": "रिज़र्व",
    "reserving": "रिज़र्व",
    "gesture": "जेस्चर",
    "latency": "लेटेंसी",
    "retrying": "रीट्राई",
    "smooth": "स्मूथ",
    "option": "ऑप्शन",
    "options": "ऑप्शंस",
    "rail": "रेल",
    "rails": "रेल्स",
    "dispatched": "डिस्पैच्ड",
    "dispatch": "डिस्पैच",
    "recorded": "रिकॉर्डेड",
    "record": "रिकॉर्ड",
    "detail": "डिटेल",
    "details": "डिटेल्स",
    "technical": "टेक्निकल",
    "objection": "ऑब्जेक्शन",
    "browser": "ब्राउज़र",
    "network": "नेटवर्क",
    "gateway": "गेटवे",
    "timeout": "टाइमआउट",
    "session": "सेशन",
    "declined": "डिक्लाइंड",
    "decline": "डिक्लाइन",
    "insufficient": "इनसफिशिएंट",
    "fund": "फंड",
    "funds": "फंड्स",
    "limit": "लिमिट",
    "limits": "लिमिट्स",
    "exceeded": "एक्सीडेड",
    "exceed": "एक्सीड",
    "authorized": "ऑथराइज्ड",
    "authorization": "ऑथराइजेशन",
    "authentication": "ऑथेंटिकेशन",
    "authenticate": "ऑथेंटिकेट",
    "security": "सिक्योरिटी",
    "secure": "सिक्योर",
    "securely": "सिक्योरली",
    "verification": "वेरिफिकेशन",
    "verify": "वेरीफाई",
    "verified": "वेरीफाइड",
    "convenient": "कन्वीनिएंट",
    "reassurance": "रीएश्योरेंस",
    "experience": "एक्सपीरियंस",
    "recovery": "रिकवरी",
    "recover": "रिकवर",
    "recovered": "रिकवर्ड",
    "agent": "एजेंट",
    "alpha": "अल्फा",
    "beta": "बीटा",
    "omega": "ओमेगा",
    "great": "ग्रेट",
    "good": "गुड",
    "morning": "मॉर्निंग",
    "evening": "इवनिंग",
    "afternoon": "आफ्टरनून",
    "night": "नाइट",
    "click": "क्लिक",
    "clicked": "क्लिक",
    "seamless": "सीमलेस",
    "assistant": "असिस्टेंट",
    "resolution": "रिजॉल्यूशन",
    "resolve": "रिजॉल्व",
    "resolved": "रिजॉल्व्ड",
    "settlement": "सेटलमेंट",
    "settle": "सेटल",
    "settled": "सेटल्ड",
    "autopay": "ऑटोपे",
    "wallet": "वॉलेट",
    "recurring": "रिकरिंग",
    "subscription": "सब्सक्रिप्शन",
    "receipt": "रिसीट",
    "status": "स्टेटस",
    "update": "अपडेट",
    "updated": "अपडेट",
    "confirm": "कन्फर्म",
    "confirmed": "कन्फर्म",
    "confirmation": "कन्फर्मेशन",

    # Indian Customer Names
    "aman": "अमन",
    "priya": "प्रिया",
    "rahul": "राहुल",
    "deepak": "दीपक",
    "sneha": "स्नेहा",
    "ananya": "अनन्या",
    "rohan": "रोहन",
    "pooja": "पूजा",
    "sharma": "शर्मा",
    "verma": "वर्मा",
    "gupta": "गुप्ता",
    "reddy": "रेड्डी",
    "sen": "सेन",
    "hegde": "हेगड़े",
    "singh": "सिंह",
    "kumar": "कुमार",
    "patel": "पटेल",
    "mehta": "मेहता",

    # Indian Banks
    "hdfc": "एच डी एफ सी",
    "sbi": "एस बी आई",
    "icici": "आई सी आई सी आई",
    "kotak": "कोटक",
    "axis": "एक्सिस",
    "pnb": "पी एन बी",
    "bob": "बी ओ बी",
    "razorpay": "रेज़रपे",
}

# Sub-word transliteration rules for unknown Romanized Hindi tokens
_CONSONANT_MAP = {
    "bh": "भ", "ch": "च", "chh": "छ", "dh": "ध", "gh": "घ", "jh": "झ",
    "kh": "ख", "ph": "फ", "sh": "श", "th": "थ", "zh": "ज़",
    "b": "ब", "c": "क", "d": "द", "f": "फ़", "g": "ग", "h": "ह",
    "j": "ज", "k": "क", "l": "ल", "m": "म", "n": "न", "p": "प",
    "q": "क", "r": "र", "s": "स", "t": "त", "v": "व", "w": "व",
    "x": "क्स", "y": "य", "z": "ज़"
}

_VOWEL_MAP = {
    "aa": "ा", "ee": "ी", "oo": "ू", "ai": "ै", "au": "ौ",
    "a": "ा", "e": "े", "i": "ि", "o": "ो", "u": "ु"
}


def normalize_hinglish_to_devanagari(text: str) -> str:
    """
    Transforms Romanized Hinglish sentences into phonetically optimized Devanagari text
    for native Kokoro-82M Hindi acoustic synthesis.
    """
    cleaned = text

    # 1. Clean fin-tech symbols & numbers
    # ₹14,999 or INR 14999 -> 14 हज़ार 999 रुपये
    cleaned = re.sub(
        r"₹\s*(\d+),?(\d+)?",
        lambda m: f"{m.group(1)} हज़ार {m.group(2) or ''} रुपये " if len(m.group(1)) <= 3 and m.group(2) else f"{m.group(1)} रुपये ",
        cleaned,
    )
    cleaned = re.sub(
        r"INR\s*(\d+),?(\d+)?",
        lambda m: f"{m.group(1)} हज़ार {m.group(2) or ''} रुपये ",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"Rs\.?\s*(\d+),?(\d+)?",
        lambda m: f"{m.group(1)} हज़ार {m.group(2) or ''} रुपये ",
        cleaned,
        flags=re.IGNORECASE,
    )

    # 2. Percentage notation: 10% -> 10 परसेंट
    cleaned = re.sub(r"(\d+)%", r"\1 परसेंट", cleaned)

    # 3. Handle 3DS, 1-click, etc.
    cleaned = re.sub(r"\b3DS\b", "थ्री डी सिक्योर", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b3D\s*Secure\b", "थ्री डी सिक्योर", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b1-click\b", "वन क्लिक", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bone-click\b", "वन क्लिक", cleaned, flags=re.IGNORECASE)

    # 4. Tokenize and map words using the comprehensive lexicon
    # Preserve punctuation (. , ! ? :)
    tokens = re.findall(r"[\w'-]+|[^\w\s]|\s+", cleaned)
    output_tokens: List[str] = []

    for token in tokens:
        if not token.strip():
            output_tokens.append(token)
            continue

        # If it's punctuation, keep it
        if re.match(r"^[^\w\s]+$", token):
            output_tokens.append(token)
            continue

        # If it's pure numbers, keep digits (Kokoro handles Devanagari/Hindi digits naturally)
        if token.isdigit():
            output_tokens.append(token)
            continue

        lower_token = token.lower()

        # Check lexicon match
        if lower_token in HINGLISH_LEXICON:
            output_tokens.append(HINGLISH_LEXICON[lower_token])
            continue

        # Check if already Devanagari
        if re.search(r"[\u0900-\u097F]", token):
            output_tokens.append(token)
            continue

        # Fallback word-level transliteration
        output_tokens.append(_transliterate_word_fallback(lower_token))

    result = "".join(output_tokens)
    # Ensure natural honorific spacing (e.g., 'अमन जी,' has a subtle comma pause)
    result = re.sub(r"\bजी\b(?!\s*[,.!])", "जी,", result)
    return re.sub(r"\s+", " ", result).strip()


def _transliterate_word_fallback(word: str) -> str:
    """Heuristic phonetic transliteration for unmatched Romanized tokens."""
    if not word:
        return ""

    # Common prefixes / suffixes
    w = word.lower()
    res: List[str] = []
    i = 0
    n = len(w)

    while i < n:
        # Check 3-char consonants (chh)
        if i + 3 <= n and w[i:i+3] in _CONSONANT_MAP:
            res.append(_CONSONANT_MAP[w[i:i+3]])
            i += 3
            continue
        # Check 2-char consonants (bh, ch, dh, gh, jh, kh, ph, sh, th, zh)
        if i + 2 <= n and w[i:i+2] in _CONSONANT_MAP:
            res.append(_CONSONANT_MAP[w[i:i+2]])
            i += 2
            continue
        # Check 2-char vowels (aa, ee, oo, ai, au)
        if i + 2 <= n and w[i:i+2] in _VOWEL_MAP:
            res.append(_VOWEL_MAP[w[i:i+2]])
            i += 2
            continue
        # Check 1-char consonants
        if w[i] in _CONSONANT_MAP:
            res.append(_CONSONANT_MAP[w[i]])
            i += 1
            continue
        # Check 1-char vowels
        if w[i] in _VOWEL_MAP:
            res.append(_VOWEL_MAP[w[i]])
            i += 1
            continue

        res.append(w[i])
        i += 1

    return "".join(res)
