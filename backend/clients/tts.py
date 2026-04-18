"""TTS client — covers en-US and ar-EG.

Two backends, picked automatically:
  - Azure Neural TTS — if AZURE_SPEECH_KEY is set. Highest quality, paid.
  - edge-tts          — Microsoft Edge's free TTS endpoint. Same neural voices,
                        no key, no quota limit advertised. Default.

Both expose identical voices (`en-US-JennyNeural`, `ar-EG-SalmaNeural`) and both
return MP3. The frontend doesn't care which backend produced the audio.

Used by:
  - the live POST /tts endpoint in main.py (caches per text+lang on disk)
  - scripts/build_cache.py at build time
"""

import asyncio
import os
from pathlib import Path

VOICES = {
    # en-US-AndrewNeural: friendly, patient male voice. Supports the "chat"
    # style which reads like a teacher walking a student through a topic.
    "en": "en-US-AndrewNeural",
    # ar-EG-ShakirNeural: the only male Egyptian-Arabic neural voice in
    # Azure. No styles, but prosody adjustments give a warm teacher feel.
    "ar": "ar-EG-ShakirNeural",
}


class TTSUnavailable(RuntimeError):
    """Raised when the TTS backend cannot satisfy a request."""


def _has_azure() -> bool:
    return bool(os.environ.get("AZURE_SPEECH_KEY"))


def synthesize(text: str, lang: str, out_path: Path) -> Path:
    if lang not in VOICES:
        raise TTSUnavailable(f"unsupported language: {lang}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if _has_azure():
        return _synthesize_azure(text, lang, out_path)
    return _synthesize_edge(text, lang, out_path)


def backend_name() -> str:
    return "azure" if _has_azure() else "edge-tts"


# ---- edge-tts (default, no key) ---------------------------------------------

def _synthesize_edge(text: str, lang: str, out_path: Path) -> Path:
    import edge_tts  # type: ignore

    voice = VOICES[lang]

    async def _run():
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out_path))

    try:
        asyncio.run(_run())
    except Exception as e:  # noqa: BLE001
        raise TTSUnavailable(f"edge-tts failed: {e}") from e
    if not out_path.exists() or out_path.stat().st_size == 0:
        raise TTSUnavailable("edge-tts produced no audio")
    return out_path


# ---- Azure (optional, paid) -------------------------------------------------

def _xml_escape(text: str) -> str:
    """Escape characters that would break SSML."""
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;")
    )


def _build_ssml(text: str, lang: str) -> str:
    """Wrap text in SSML so Azure produces a friendly-male-teacher narration.

    English: en-US-AndrewNeural with the "chat" style — Andrew reads like a
    patient tutor walking the student through the visual. Slight slowdown
    gives math phrases room to land; styledegree=1.0 keeps it natural.

    Egyptian Arabic: ar-EG-ShakirNeural (the only male Egyptian voice
    Azure offers). No styles available, but prosody (rate -8%, pitch +1%)
    pushes the voice from newsreader-flat into a warm tutor feel.
    """
    voice = VOICES[lang]
    safe = _xml_escape(text)
    if lang == "en":
        body = (
            f'<voice name="{voice}">'
            f'<mstts:express-as style="chat" styledegree="1.0">'
            f'<prosody rate="-6%">{safe}</prosody>'
            f'</mstts:express-as>'
            f'</voice>'
        )
        xml_lang = "en-US"
    else:  # ar
        body = (
            f'<voice name="{voice}">'
            f'<prosody rate="-8%" pitch="+1%">{safe}</prosody>'
            f'</voice>'
        )
        xml_lang = "ar-EG"
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="{xml_lang}">'
        f'{body}'
        f'</speak>'
    )


def _synthesize_azure(text: str, lang: str, out_path: Path) -> Path:
    key = os.environ["AZURE_SPEECH_KEY"]
    region = os.environ.get("AZURE_SPEECH_REGION", "eastus")

    import azure.cognitiveservices.speech as speechsdk  # type: ignore

    speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3
    )

    audio_config = speechsdk.audio.AudioOutputConfig(filename=str(out_path))
    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=audio_config
    )
    ssml = _build_ssml(text, lang)
    result = synthesizer.speak_ssml_async(ssml).get()
    if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        raise TTSUnavailable(f"Azure TTS failed: {result.reason} {result.error_details}")
    return out_path
