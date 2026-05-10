
export const floatTo16BitPCM = (input: Float32Array): Int16Array => {
  const pcmData = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    pcmData[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
  }
  return pcmData;
};

export const pcmToFloat32 = (pcmData: Int16Array): Float32Array => {
  const float32Data = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    float32Data[i] = pcmData[i] / 0x7FFF;
  }
  return float32Data;
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
