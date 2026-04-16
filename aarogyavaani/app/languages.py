"""Supported language catalog for the AarogyaVaani stack.

The voice layer is driven by Vapi + Deepgram. We use the Deepgram Nova-3
language matrix as the runtime source of truth for explicit language routing,
while still supporting ``auto`` and ``multi`` convenience modes in the app.
"""

from __future__ import annotations

LANGUAGE_ROWS = [
    ("auto", "Auto-detect", "Auto-detect", "Universal", True),
    (
        "multi",
        "Multilingual",
        "Multilingual",
        "Universal",
        True,
    ),
    ("en", "English", "English", "Core", True),
    ("hi", "Hindi", "हिंदी", "Core", True),
    ("kn", "Kannada", "ಕನ್ನಡ", "Core", True),
    ("ta", "Tamil", "தமிழ்", "India", True),
    ("te", "Telugu", "తెలుగు", "India", True),
    ("bn", "Bengali", "বাংলা", "India", True),
    ("mr", "Marathi", "मराठी", "India", True),
    ("ur", "Urdu", "اردو", "India", True),
    ("ar", "Arabic", "العربية", "Middle East", False),
    ("ar-AE", "Arabic (UAE)", "العربية", "Middle East", False),
    ("ar-SA", "Arabic (Saudi Arabia)", "العربية", "Middle East", False),
    ("ar-QA", "Arabic (Qatar)", "العربية", "Middle East", False),
    ("ar-KW", "Arabic (Kuwait)", "العربية", "Middle East", False),
    ("ar-SY", "Arabic (Syria)", "العربية", "Middle East", False),
    ("ar-LB", "Arabic (Lebanon)", "العربية", "Middle East", False),
    ("ar-PS", "Arabic (Palestine)", "العربية", "Middle East", False),
    ("ar-JO", "Arabic (Jordan)", "العربية", "Middle East", False),
    ("ar-EG", "Arabic (Egypt)", "العربية", "Middle East", False),
    ("ar-SD", "Arabic (Sudan)", "العربية", "Middle East", False),
    ("ar-TD", "Arabic (Chad)", "العربية", "Middle East", False),
    ("ar-MA", "Arabic (Morocco)", "العربية", "Middle East", False),
    ("ar-DZ", "Arabic (Algeria)", "العربية", "Middle East", False),
    ("ar-TN", "Arabic (Tunisia)", "العربية", "Middle East", False),
    ("ar-IQ", "Arabic (Iraq)", "العربية", "Middle East", False),
    ("ar-IR", "Arabic (Iran)", "العربية", "Middle East", False),
    ("be", "Belarusian", "Беларуская", "Europe", False),
    ("bs", "Bosnian", "Bosanski", "Europe", False),
    ("bg", "Bulgarian", "Български", "Europe", False),
    ("ca", "Catalan", "Catala", "Europe", False),
    ("zh", "Chinese (Mandarin)", "中文", "East Asia", False),
    ("zh-CN", "Chinese (Simplified)", "简体中文", "East Asia", False),
    ("zh-Hans", "Chinese (Hans)", "简体中文", "East Asia", False),
    ("zh-TW", "Chinese (Traditional)", "繁體中文", "East Asia", False),
    ("zh-Hant", "Chinese (Hant)", "繁體中文", "East Asia", False),
    ("zh-HK", "Chinese (Cantonese, HK)", "廣東話", "East Asia", False),
    ("hr", "Croatian", "Hrvatski", "Europe", False),
    ("cs", "Czech", "Cestina", "Europe", False),
    ("da", "Danish", "Dansk", "Europe", False),
    ("da-DK", "Danish (Denmark)", "Dansk", "Europe", False),
    ("nl", "Dutch", "Nederlands", "Europe", False),
    ("nl-BE", "Flemish", "Vlaams", "Europe", False),
    ("en-US", "English (US)", "English", "English Variants", False),
    ("en-AU", "English (Australia)", "English", "English Variants", False),
    ("en-GB", "English (UK)", "English", "English Variants", False),
    ("en-IN", "English (India)", "English", "English Variants", True),
    ("en-NZ", "English (New Zealand)", "English", "English Variants", False),
    ("et", "Estonian", "Eesti", "Europe", False),
    ("fi", "Finnish", "Suomi", "Europe", False),
    ("fr", "French", "Francais", "Europe", False),
    ("fr-CA", "French (Canada)", "Francais", "Europe", False),
    ("de", "German", "Deutsch", "Europe", False),
    ("de-CH", "German (Switzerland)", "Deutsch", "Europe", False),
    ("el", "Greek", "Ελληνικα", "Europe", False),
    ("he", "Hebrew", "עברית", "Middle East", False),
    ("hu", "Hungarian", "Magyar", "Europe", False),
    ("id", "Indonesian", "Bahasa Indonesia", "SEA", False),
    ("it", "Italian", "Italiano", "Europe", False),
    ("ja", "Japanese", "日本語", "East Asia", True),
    ("ko", "Korean", "한국어", "East Asia", False),
    ("ko-KR", "Korean (South Korea)", "한국어", "East Asia", False),
    ("lv", "Latvian", "Latviesu", "Europe", False),
    ("lt", "Lithuanian", "Lietuviu", "Europe", False),
    ("mk", "Macedonian", "Македонски", "Europe", False),
    ("ms", "Malay", "Bahasa Melayu", "SEA", False),
    ("no", "Norwegian", "Norsk", "Europe", False),
    ("fa", "Persian", "فارسی", "Middle East", False),
    ("pl", "Polish", "Polski", "Europe", False),
    ("pt", "Portuguese", "Portugues", "Europe", False),
    ("pt-BR", "Portuguese (Brazil)", "Portugues", "Americas", False),
    ("pt-PT", "Portuguese (Portugal)", "Portugues", "Europe", False),
    ("ro", "Romanian", "Romana", "Europe", False),
    ("ru", "Russian", "Русский", "Europe", False),
    ("sr", "Serbian", "Српски", "Europe", False),
    ("sk", "Slovak", "Slovencina", "Europe", False),
    ("sl", "Slovenian", "Slovenscina", "Europe", False),
    ("es", "Spanish", "Espanol", "Americas", False),
    ("es-419", "Spanish (Latin America)", "Espanol", "Americas", False),
    ("sv", "Swedish", "Svenska", "Europe", False),
    ("sv-SE", "Swedish (Sweden)", "Svenska", "Europe", False),
    ("tl", "Tagalog", "Tagalog", "SEA", False),
    ("th", "Thai", "ไทย", "SEA", False),
    ("th-TH", "Thai (Thailand)", "ไทย", "SEA", False),
    ("tr", "Turkish", "Turkce", "Europe", False),
    ("uk", "Ukrainian", "Українська", "Europe", False),
    ("vi", "Vietnamese", "Tieng Viet", "SEA", False),
]


LANGUAGE_CATALOG = [
    {
        "code": code,
        "label": label,
        "native_label": native_label,
        "group": group,
        "featured": featured,
        "voice_ready": code in {"auto", "multi"}
        or code.split("-", 1)[0] in {"en", "es", "de", "fr", "nl", "it", "ja"},
    }
    for code, label, native_label, group, featured in LANGUAGE_ROWS
]

SUPPORTED_LANGUAGE_CODES = {item["code"] for item in LANGUAGE_CATALOG}
LANGUAGE_LABELS = {item["code"]: item["label"] for item in LANGUAGE_CATALOG}
KNOWLEDGE_FILTER_CODES = {"hi", "en", "kn"}


def normalize_language(code: str | None) -> str:
    if not code:
        return "auto"
    value = code.strip()
    return value if value in SUPPORTED_LANGUAGE_CODES else "auto"


def get_language_label(code: str | None) -> str:
    return LANGUAGE_LABELS.get(normalize_language(code), "Auto-detect")
