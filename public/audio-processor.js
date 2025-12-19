/**
 * AudioWorkletProcessor for capturing microphone audio and converting to PCM16
 * This replaces the deprecated ScriptProcessorNode
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const inputData = input[0]; // First channel

            // Convert Float32 to Int16 (PCM16)
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Send to main thread
            this.port.postMessage({
                type: 'audio',
                data: int16.buffer
            }, [int16.buffer]);
        }

        return true; // Keep processor alive
    }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
