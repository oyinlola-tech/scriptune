// The package ships its typings under a different module name; mirror them here.
declare module "@fugood/react-native-audio-pcm-stream" {
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
    init: (options: Options) => void;
    start: () => void;
    stop: () => Promise<string>;
    on: (event: "data", callback: (data: string) => void) => void;
  }
  const AudioRecord: IAudioRecord;
  export default AudioRecord;
}
