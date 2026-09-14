// The package ships its typings under a different module name; mirror them here.
// `init` returns a Promise on Android (rejects when the microphone is busy) and
// nothing on iOS; `stop` returns nothing on both.
declare module "@fugood/react-native-audio-pcm-stream" {
  import type { EmitterSubscription } from "react-native";
  export interface Options {
    sampleRate: number;
    /** 1 or 2 */
    channels: number;
    /** 8 or 16 */
    bitsPerSample: number;
    /** Android audio source; 6 = VOICE_RECOGNITION */
    audioSource?: number;
    /** Leave empty to keep nothing on disk. */
    wavFile: string;
    bufferSize?: number;
  }
  export interface IAudioRecord {
    init: (options: Options) => void | Promise<void>;
    start: () => void;
    stop: () => void;
    on: (event: "data", callback: (data: string) => void) => EmitterSubscription;
  }
  const AudioRecord: IAudioRecord;
  export default AudioRecord;
}
