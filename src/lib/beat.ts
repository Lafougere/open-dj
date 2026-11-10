const pvworklet = new URL('../../../assets/worklets/phase-vocoder.js', import.meta.url).href

export const getBeatFilteredBuffer = (buffer: AudioBuffer): Promise<AudioBuffer> => {
    // Place the buffer into a new offline context for processing
    // const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

    const offlineContext = new OfflineAudioContext(2, buffer.length, buffer.sampleRate)
    const source = offlineContext.createBufferSource()
    source.buffer = buffer

    // Lowpass filter to remove most of the melody
    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    // Filter for beats/kicks around 100 to 150Hz
    lowpass.frequency.value = 70
    lowpass.Q.value = 0.3
    source.connect(lowpass)

    // Highpass filter to remove the bassline
    const highpass = offlineContext.createBiquadFilter()
    highpass.type = 'highpass'
    // Below 100Hz is usually the bassline.
    highpass.frequency.value = 50
    highpass.Q.value = 0.5
    lowpass.connect(highpass)

    highpass.connect(offlineContext.destination)

    source.start(0)

    return new Promise((resolve, reject) => {
        offlineContext.startRendering()
        offlineContext.oncomplete = ({ renderedBuffer }) => {
            resolve(renderedBuffer)
        }
    })
}

export async function resample(buffer: AudioBuffer, playbackRate: number): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(2, buffer.length * (1 / playbackRate), buffer.sampleRate)
    const source = offlineContext.createBufferSource()
    source.buffer = buffer
    source.playbackRate.setValueAtTime(playbackRate, 0)
    console.log('resampling')
    source.connect(offlineContext.destination)

    source.start(0)
    return new Promise((resolve, reject) => {
        offlineContext.startRendering()
        offlineContext.oncomplete = ({ renderedBuffer }) => {
            resolve(renderedBuffer)
        }
    })
}
