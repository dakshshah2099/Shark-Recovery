"""
telephony_codec.py
Pure-Python G.711 μ-law (PCMU) and PCM resampler for Telephony Media Streams
(Twilio Voice / Exotel WebSockets <-> Gemini Multimodal Live API).
"""
import struct
from typing import List, Union
import numpy as np

# G.711 μ-law decompression lookup table (256 entries)
# Converts 8-bit unsigned μ-law byte -> 16-bit signed PCM integer
def _build_mulaw_to_pcm_table() -> List[int]:
    table = []
    for i in range(256):
        val = ~i & 0xFF
        sign = val & 0x80
        exponent = (val >> 4) & 0x07
        mantissa = val & 0x0F
        sample = ((mantissa << 3) + 0x84) << exponent
        sample -= 0x84
        if sign:
            sample = -sample
        table.append(sample)
    return table

_MULAW_DECODE_TABLE = _build_mulaw_to_pcm_table()


def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
    """
    Decodes 8-bit G.711 μ-law audio stream to 16-bit signed Linear PCM (little-endian).
    """
    samples = [_MULAW_DECODE_TABLE[b] for b in mulaw_bytes]
    return struct.pack(f"<{len(samples)}h", *samples)


def pcm16_to_mulaw(pcm16_bytes: bytes) -> bytes:
    """
    Encodes 16-bit signed Linear PCM audio stream to 8-bit G.711 μ-law bytes.
    """
    num_samples = len(pcm16_bytes) // 2
    if num_samples == 0:
        return b""
    samples = struct.unpack(f"<{num_samples}h", pcm16_bytes)
    
    out = bytearray(num_samples)
    for i, sample in enumerate(samples):
        # Clip sample to 16-bit range
        sample = max(-32768, min(32767, sample))
        sign = 0x80 if sample < 0 else 0
        if sample < 0:
            sample = -sample
        
        sample += 0x84
        if sample > 32767:
            sample = 32767
            
        exponent = 7
        for exp in range(7, -1, -1):
            if sample & (1 << (exp + 7)):
                exponent = exp
                break
        
        mantissa = (sample >> (exponent + 3)) & 0x0F
        byte_val = ~(sign | (exponent << 4) | mantissa) & 0xFF
        out[i] = byte_val
        
    return bytes(out)


def resample_pcm16(
    pcm_bytes: bytes,
    src_rate: int,
    dst_rate: int,
) -> bytes:
    """
    Resamples Linear 16-bit mono PCM audio between sample rates
    (e.g., 8000Hz telephony <-> 16000Hz/24000Hz Gemini Multimodal Live API).
    """
    if src_rate == dst_rate or len(pcm_bytes) < 2:
        return pcm_bytes
    
    # Unpack 16-bit signed integers
    num_samples = len(pcm_bytes) // 2
    samples = np.frombuffer(pcm_bytes, dtype=np.int16)
    
    # Calculate target length
    dst_num_samples = int(round(num_samples * (dst_rate / src_rate)))
    if dst_num_samples == 0:
        return b""
        
    src_indices = np.linspace(0, num_samples - 1, dst_num_samples)
    resampled = np.interp(src_indices, np.arange(num_samples), samples).astype(np.int16)
    return resampled.tobytes()
