"""
gemini_live_client.py
Production-grade bidirectional WebSocket bridge to Gemini 2.0 Multimodal Live API
for real-time streaming conversational voice recovery with sub-300ms latency.
"""
import asyncio
import base64
import json
import logging
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional
import websockets

try:
    from backend.config import settings
    from backend.tools.telephony_codec import resample_pcm16
except ImportError:
    from config import settings
    from tools.telephony_codec import resample_pcm16

logger = logging.getLogger(__name__)

GEMINI_LIVE_WS_ENDPOINT = (
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
)


def get_gemini_live_model() -> str:
    """
    Returns the configured Gemini Multimodal Live model from settings / .env.
    Normalizes prefix to 'models/<model_name>' for the Google Live WebSocket service.
    """
    raw_model = (getattr(settings, "GEMINI_LIVE_MODEL", "") or "models/gemini-3.1-flash-live-preview").strip()
    if not raw_model:
        return "models/gemini-3.1-flash-live"
    if not raw_model.startswith("models/"):
        return f"models/{raw_model}"
    return raw_model


class GeminiLiveSession:
    """
    Manages a live bidirectional WebSocket session with Gemini Multimodal Live API (v1beta).
    Streams input audio from customer, receives real-time agent audio & transcript tokens,
    and executes function tools live during the phone conversation.
    """

    def __init__(
        self,
        session_id: str,
        customer_name: str,
        customer_phone: str,
        order_amount: float,
        failure_reason: str,
        discount_percent: float = 0.0,
        customer_email: str = "customer@example.com",
        model_name: Optional[str] = None,
        on_tool_call: Optional[Callable[[str, Dict[str, Any]], Any]] = None,
        on_transcript: Optional[Callable[[str, str], Any]] = None,
    ) -> None:
        self.session_id = session_id
        self.customer_name = customer_name
        self.customer_phone = customer_phone
        self.customer_email = customer_email
        self.order_amount = order_amount
        self.failure_reason = failure_reason
        self.discount_percent = discount_percent
        self.model_name = model_name
        self.on_tool_call = on_tool_call
        self.on_transcript = on_transcript

        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._is_active: bool = False
        self._mock_mode: bool = not bool((settings.GEMINI_API_KEY or "").strip())
        self.connection_status: str = "initialized"
        self.connection_error: Optional[str] = None
        self._lock = asyncio.Lock()

    def _build_system_instruction(self) -> str:
        first_name = self.customer_name.split()[0] if self.customer_name else "Customer"
        discount_rule = (
            f"DISCOUNT POLICY: A special {self.discount_percent:.0f}% discount has been pre-approved as an incentive for this cart."
            if self.discount_percent > 0
            else "DISCOUNT POLICY: 0% discount. STRICT: DO NOT mention the word 'discount', 'offer', 'rebate', or '0%'. Emphasize that their cart items are securely reserved on high priority."
        )

        return f"""
You are Priya, an empathetic, courteous Indian female Voice Recovery Specialist from Shark Recovery for Razorpay merchants in India.
You are currently on a continuous live phone call with customer {self.customer_name} (Phone: {self.customer_phone}, Email: {self.customer_email}).

CONTEXT:
- Order Amount: INR {self.order_amount:,.2f}
- Checkout Failure Root Cause: {self.failure_reason}
- {discount_rule}

STRICT LINGUISTIC RULES:
1. Speak natural, respectful conversational Hinglish with polite Indian phone cadence ("Namaste {first_name} ji", "Aapka cart reserve rakha hai", "Bilkul samajh sakti hoon").
2. FEMININE FIRST-PERSON GRAMMAR: You are female. Always use feminine verbs: "bol rahi hoon" (never "bol raha hoon"), "kar sakti hoon", "samajh sakti hoon", "bhej rahi hoon", "dekh sakti hoon".
3. Keep responses crisp and conversational (1-2 short sentences per turn, suitable for phone speech).

STRICT 4-STAGE CONVERSATIONAL LIFECYCLE:
STAGE 1 - GREET & INQUIRE (DO NOT CALL TOOLS YET):
- Greet {first_name} ji warmly, inform them that their cart of Rs {self.order_amount:,.0f} was interrupted, and ask if they would like assistance retrying payment.
- DO NOT execute any dispatch tools in Stage 1. Listen to customer's reply first.

STAGE 2 - CHANNEL CONFIRMATION (DO NOT GUESS PLATFORM):
- When the customer agrees or explains their issue (e.g. OTP delay, bank lag, payment declined), reassure them.
- If applicable, mention the {self.discount_percent:.0f}% incentive (or cart priority reservation if 0%).
- MANDATORY: Ask the customer on which channel they would prefer to receive the retry link:
  "Aapko payment retry link WhatsApp pe bhej doon, direct SMS pe ya Email pe?"
- WAIT for the customer's response. DO NOT dispatch until the customer explicitly specifies or confirms their platform!

STAGE 3 - PRECISE TOOL DISPATCH:
- Once the customer specifies their channel, call the corresponding tool:
  * Customer wants WhatsApp -> call `dispatch_whatsapp`
  * Customer wants SMS / Text -> call `dispatch_sms`
  * Customer wants Email / Invoice -> call `dispatch_email`
  * Customer wants all/both/any -> call `dispatch_recovery_link` with channel="all"
  * Customer wants to pay at a future time -> call `record_promise_to_pay`

STAGE 4 - CONFIRM RECEIPT, ASSIST, AND AUTO-END CALL UPON SATISFACTION:
- After calling a dispatch tool, verbally confirm:
  "Ji {first_name} ji, maine payment retry link aapke [WhatsApp/SMS/Email] pe send kar diya hai."
- Ask if they have received it and if they need any assistance with payment methods or discounts.
- CRITICAL - SATISFACTION CONFIRMATION & COURTEOUS FAREWELL:
  When the customer confirms satisfaction, agreement to pay, link receipt, or concludes the conversation:
  (e.g., "haan mil gaya", "got the link", "theek hai main pay kar deta hoon", "thank you", "shukriya", "bye", "okay done", "all set", "thanks", "done", "theek hai")
  YOU MUST:
  1. Speak your complete, warm, polite farewell in conversational Hinglish:
     "Bahut-bahut shukriya {first_name} ji! Aapka din shubh ho, namaste!"
  2. Finish speaking your full sentence clearly, and ONLY THEN invoke the `end_call` tool with reason="Customer confirmed receipt/satisfaction and call is concluded", satisfaction_status="satisfied".
  Do NOT cut off mid-sentence or rush the farewell.
""".strip()

    def _build_tools_declaration(self) -> List[Dict[str, Any]]:
        return [
            {
                "functionDeclarations": [
                    {
                        "name": "dispatch_whatsapp",
                        "description": "Dispatches an instant 1-click Razorpay payment retry link and greeting directly to customer's WhatsApp.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "discount_percent": {
                                    "type": "NUMBER",
                                    "description": "Discount percentage applied (0-15)",
                                },
                                "message_text": {
                                    "type": "STRING",
                                    "description": "Optional polite custom message in Hinglish",
                                },
                            },
                        },
                    },
                    {
                        "name": "dispatch_sms",
                        "description": "Dispatches an instant 1-click Razorpay payment retry link directly to customer via SMS.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "discount_percent": {
                                    "type": "NUMBER",
                                    "description": "Discount percentage applied (0-15)",
                                },
                                "sms_text": {
                                    "type": "STRING",
                                    "description": "Optional custom SMS text",
                                },
                            },
                        },
                    },
                    {
                        "name": "dispatch_email",
                        "description": "Dispatches official recovery email with payment retry button, invoice breakdown, and dynamic discount to customer's email address.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "discount_percent": {
                                    "type": "NUMBER",
                                    "description": "Discount percentage applied (0-15)",
                                },
                                "subject": {
                                    "type": "STRING",
                                    "description": "Optional email subject line",
                                },
                            },
                        },
                    },
                    {
                        "name": "dispatch_recovery_link",
                        "description": "Omnichannel dispatch: sends Razorpay payment retry link via preferred channels ('whatsapp', 'sms', 'email', or 'all') to customer.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "discount_percent": {
                                    "type": "NUMBER",
                                    "description": "Discount percentage applied (0-15)",
                                },
                                "channel": {
                                    "type": "STRING",
                                    "description": "Outreach channel: 'whatsapp', 'sms', 'email', or 'all'",
                                },
                            },
                            "required": ["discount_percent"],
                        },
                    },
                    {
                        "name": "record_promise_to_pay",
                        "description": "Records the customer's verbal commitment date/time to pay.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "promise_date": {
                                    "type": "STRING",
                                    "description": "Committed date/time or timeframe (e.g. today 6 PM, in 30 mins)",
                                },
                                "note": {
                                    "type": "STRING",
                                    "description": "Brief note on customer sentiment or reason",
                                },
                            },
                            "required": ["promise_date"],
                        },
                    },
                    {
                        "name": "end_call",
                        "description": "Automatically terminates and ends the recovery phone call once the customer confirms satisfaction, payment retry link has been sent or promise to pay recorded, customer has no further questions, or parties say goodbye / thank you.",
                        "parameters": {
                            "type": "OBJECT",
                            "properties": {
                                "reason": {
                                    "type": "STRING",
                                    "description": "Description of why call is ending, e.g. 'Customer confirmed receipt of WhatsApp link and agreed to pay', 'Customer satisfied', 'Promise to pay noted'",
                                },
                                "satisfaction_status": {
                                    "type": "STRING",
                                    "description": "Satisfaction outcome: 'satisfied', 'payment_pending', 'callback_scheduled', or 'declined'",
                                },
                            },
                            "required": ["reason"],
                        },
                    },
                ]
            }
        ]

    async def connect(self) -> bool:
        """Connects to Gemini Multimodal Live v1beta WebSocket and performs setup handshake with graceful fallback."""
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key:
            logger.info(f"GeminiLiveSession[{self.session_id}]: No GEMINI_API_KEY configured. Running in Kokoro Neural Voice mode.")
            self._mock_mode = True
            self._is_active = True
            self.connection_status = "kokoro_neural_fallback"
            return True

        url = f"{GEMINI_LIVE_WS_ENDPOINT}?key={api_key}"
        requested_model = (self.model_name or get_gemini_live_model()).strip()
        if not requested_model.startswith("models/"):
            requested_model = f"models/{requested_model}"

        # Candidate models hierarchy: requested model -> preferred Gemini Live models
        preferred_models = [
            "models/gemini-3.1-flash-live",
            "models/gemini-3.1-flash-live-preview",
            "models/gemini-2.0-flash-exp",
            "models/gemini-2.0-flash",
        ]
        candidate_models = [requested_model]
        for m in preferred_models:
            if m not in candidate_models:
                candidate_models.append(m)

        last_err = None
        for model_to_try in candidate_models:
            try:
                self._ws = await websockets.connect(url, ping_interval=20, ping_timeout=20)
                
                # Setup handshake packet for v1beta BidiGenerateContent
                setup_payload = {
                    "setup": {
                        "model": model_to_try,
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {
                                        "voiceName": "Aoede"
                                    }
                                }
                            },
                        },
                        "systemInstruction": {
                            "parts": [{"text": self._build_system_instruction()}]
                        },
                        "tools": self._build_tools_declaration(),
                        "outputAudioTranscription": {},
                        "inputAudioTranscription": {},
                    }
                }
                await self._ws.send(json.dumps(setup_payload))
                
                # Await setup confirmation
                raw_resp = await self._ws.recv()
                logger.info(f"GeminiLiveSession[{self.session_id}] Handshake successful with model {model_to_try} on v1beta: {str(raw_resp)[:120]}...")
                self._is_active = True
                self.model_name = model_to_try
                self.connection_status = f"live_connected ({model_to_try})"
                return True
            except Exception as e:
                last_err = str(e)
                logger.warning(f"Gemini Live (v1beta) handshake with model '{model_to_try}' failed ({last_err}).")
                if self._ws:
                    try:
                        await self._ws.close()
                    except Exception:
                        pass
                    self._ws = None

        logger.error(f"GeminiLiveSession[{self.session_id}] All candidate Live API models failed: {last_err}. Falling back to Kokoro Neural Voice.", exc_info=True)
        self._mock_mode = True
        self._is_active = True
        self.connection_status = "gemini_error_fallback"
        self.connection_error = f"Gemini Live (v1beta) Note: {last_err}"
        return True

    async def trigger_first_turn(self) -> None:
        """
        Triggers Gemini Live to speak FIRST upon call connection without waiting for user input.
        """
        if self._mock_mode or not self._ws:
            return

        first_name = self.customer_name.split()[0] if self.customer_name else "Customer"
        discount_desc = (
            f"mention that a special {self.discount_percent:.0f}% incentive discount has been applied, "
            if self.discount_percent > 0
            else "mention that their cart is reserved on priority (DO NOT mention the word discount), "
        )
        prompt_text = (
            f"You are Priya from Shark Recovery for Razorpay merchants. The live call with customer {self.customer_name} "
            f"(Phone: {self.customer_phone}, Email: {self.customer_email}) is now connected. "
            f"CRITICAL GROUND TRUTH CONTEXT: "
            f"- Customer Name: {self.customer_name} (Greet as '{first_name} ji') "
            f"- Order Amount: precisely INR {self.order_amount:,.2f} "
            f"- Failure Cause: '{self.failure_reason}' "
            f"- Incentive Policy: {self.discount_percent:.0f}% discount approved. "
            f"DO NOT guess, invent, or hallucinate any other amount, name, or reason. "
            f"Start speaking immediately right now: Greet {first_name} ji warmly in polite conversational Hinglish ('Namaste {first_name} ji! Main Shark Recovery se Priya bol rahi hoon...'), "
            f"inform them that their order of INR {self.order_amount:,.0f} was interrupted due to {self.failure_reason}, {discount_desc}"
            f"and ask if they would like the 1-click retry link sent on WhatsApp, SMS, or Email. Do NOT call any tools yet."
        )

        client_turn = {
            "clientContent": {
                "turns": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt_text}],
                    }
                ],
                "turnComplete": True,
            }
        }
        try:
            async with self._lock:
                if self._ws:
                    await self._ws.send(json.dumps(client_turn))
                    logger.info(f"GeminiLiveSession[{self.session_id}] Sent first-speaker greeting trigger with context (Name={self.customer_name}, Amount=INR {self.order_amount}, Cause={self.failure_reason}).")
        except Exception as e:
            logger.warning(f"Error sending first turn trigger to Gemini Live: {e}")

    async def send_audio_chunk(self, pcm_bytes_16k: bytes) -> None:
        """
        Sends a chunk of raw 16kHz PCM audio from customer microphone / telephony stream to Gemini.
        """
        if not self._is_active or not pcm_bytes_16k:
            return

        if self._mock_mode:
            return

        try:
            b64_data = base64.b64encode(pcm_bytes_16k).decode("utf-8")
            media_packet = {
                "realtimeInput": {
                    "audio": {
                        "mimeType": "audio/pcm;rate=16000",
                        "data": b64_data,
                    }
                }
            }
            async with self._lock:
                if self._ws:
                    await self._ws.send(json.dumps(media_packet))
        except Exception as e:
            logger.warning(f"Error sending audio to Gemini Live: {e}")

    async def send_tool_response(self, call_id: str, fn_name: str, output: Dict[str, Any]) -> None:
        """Sends function tool execution result back to Gemini Live."""
        if not self._ws or self._mock_mode:
            return

        payload = {
            "toolResponse": {
                "functionResponses": [
                    {
                        "id": call_id,
                        "name": fn_name,
                        "response": {
                            "output": output,
                        },
                    }
                ]
            }
        }
        try:
            async with self._lock:
                if self._ws:
                    await self._ws.send(json.dumps(payload))
                    logger.info(f"GeminiLive[{self.session_id}] Delivered tool response for {fn_name} (call_id: {call_id})")
        except Exception as e:
            logger.warning(f"Error sending tool response to Gemini: {e}")

    async def receive_stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields streaming audio chunks (24kHz PCM) and transcript events from Gemini Live.
        Ensures agent speaks FIRST on initial connection.
        """
        if self._mock_mode:
            # First turn: AI Agent Speaks FIRST immediately!
            first_name = self.customer_name.split()[0] if self.customer_name else "Customer"
            disc_text = f" Aur humne aapke liye ek special {self.discount_percent:.0f}% discount reserve kiya hai." if self.discount_percent > 0 else ""
            greeting = f"Namaste {first_name} ji! Main Priya bol rahi hoon Shark Recovery se Razorpay merchant ke liye. Aapka Rs {self.order_amount:,.0f} ka order pending tha.{disc_text} Kya main direct 1-click retry link WhatsApp pe bhej doon, ya SMS pe?"
            
            if self.on_transcript:
                self.on_transcript("AI_Agent", greeting)
                
            yield {
                "type": "transcript",
                "speaker": "AI_Agent",
                "text": greeting,
            }
            
            # Synthesize real Kokoro TTS audio so user hears voice audio immediately!
            try:
                try:
                    from backend.tools.tts_engine import synthesize_kokoro_audio
                except ImportError:
                    from tools.tts_engine import synthesize_kokoro_audio

                tts_result = await synthesize_kokoro_audio(greeting, voice="shark_agent_alpha")
                if tts_result.get("success") and tts_result.get("audio_base64"):
                    import io
                    import wave
                    wav_bytes = base64.b64decode(tts_result["audio_base64"])
                    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
                        pcm_raw = wf.readframes(wf.getnframes())
                        rate = wf.getframerate()
                        if rate != 24000:
                            pcm_24k = resample_pcm16(pcm_raw, rate, 24000)
                        else:
                            pcm_24k = pcm_raw
                        yield {"type": "audio", "pcm_24k": pcm_24k}
            except Exception as e:
                logger.warning(f"Failed to synthesize fallback Kokoro TTS: {e}")

            yield {"type": "turn_complete"}

            while self._is_active:
                await asyncio.sleep(0.5)
            return

        while self._is_active and self._ws:
            try:
                raw_msg = await self._ws.recv()
                data = json.loads(raw_msg)

                server_content = data.get("serverContent")
                if server_content:
                    # 1. Output audio transcription (Agent speech text from Gemini)
                    output_trans = server_content.get("outputTranscription") or server_content.get("output_audio_transcription")
                    if output_trans:
                        out_text = output_trans.get("text") if isinstance(output_trans, dict) else str(output_trans)
                        if out_text:
                            if self.on_transcript:
                                self.on_transcript("AI_Agent", out_text)
                            yield {"type": "transcript", "speaker": "AI_Agent", "text": out_text}

                    # 2. Input audio transcription (Customer speech transcribed by Gemini)
                    input_trans = server_content.get("inputTranscription") or server_content.get("input_audio_transcription")
                    if input_trans:
                        in_text = input_trans.get("text") if isinstance(input_trans, dict) else str(input_trans)
                        if in_text:
                            if self.on_transcript:
                                self.on_transcript("Customer", in_text)
                            yield {"type": "transcript", "speaker": "Customer", "text": in_text}

                    model_turn = server_content.get("modelTurn")
                    if model_turn:
                        for part in model_turn.get("parts", []):
                            # Text / transcript part
                            if "text" in part:
                                text_val = part["text"]
                                if self.on_transcript:
                                    self.on_transcript("AI_Agent", text_val)
                                yield {"type": "transcript", "speaker": "AI_Agent", "text": text_val}
                            
                            # Audio chunk (PCM 24kHz)
                            if "inlineData" in part:
                                b64_audio = part["inlineData"].get("data")
                                if b64_audio:
                                    pcm_24k = base64.b64decode(b64_audio)
                                    yield {"type": "audio", "pcm_24k": pcm_24k}

                    if server_content.get("turnComplete"):
                        yield {"type": "turn_complete"}
                    if server_content.get("interrupted"):
                        yield {"type": "interrupted"}

                # Handle tool calls
                tool_call = data.get("toolCall")
                if tool_call:
                    for fcall in tool_call.get("functionCalls", []):
                        fn_name = fcall.get("name")
                        fn_args = fcall.get("args", {})
                        call_id = fcall.get("id")
                        logger.info(f"GeminiLive[{self.session_id}] Executing Live Tool: {fn_name}({fn_args})")
                        
                        tool_result = {"status": "success", "executed": True}
                        if self.on_tool_call:
                            try:
                                res = self.on_tool_call(fn_name, fn_args)
                                if asyncio.iscoroutine(res):
                                    tool_result = await res
                                elif res is not None:
                                    tool_result = res
                            except Exception as e_tool:
                                logger.warning(f"Error executing live tool {fn_name}: {e_tool}")
                                tool_result = {"status": "error", "error": str(e_tool)}

                        await self.send_tool_response(call_id, fn_name, tool_result)
                        yield {
                            "type": "tool_executed",
                            "tool_name": fn_name,
                            "arguments": fn_args,
                            "result": tool_result,
                        }

            except websockets.ConnectionClosed:
                logger.info(f"GeminiLiveSession[{self.session_id}] WebSocket closed.")
                break
            except Exception as e:
                logger.warning(f"GeminiLiveSession[{self.session_id}] Stream error: {e}")
                break

    async def close(self) -> None:
        """Closes the live session."""
        self._is_active = False
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
            self._ws = None
