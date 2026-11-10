import { createSlice } from '@reduxjs/toolkit'

interface Track {
    playbackRate: number
    tempo: number
    isPlaying: boolean
    bars: number[]
}

export interface TrackStateType {
    leftTrack: Track
    rightTrack: Track
}

const initialState: TrackStateType = {
    leftTrack: {
        playbackRate: 1.0,
        tempo: 0,
        isPlaying: false,
        bars: [],
    },
    rightTrack: {
        playbackRate: 1.0,
        tempo: 0,
        isPlaying: false,
        bars: [],
    },
}

const trackSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setPlaybackRate(state, action: { payload: { track: keyof TrackStateType; rate: number } }) {
            console.log('setPlaybackRate', action)
            const newState = { ...state }
            const newTrack = { ...newState[action.payload.track] }
            newTrack.playbackRate = action.payload.rate
            newState[action.payload.track] = newTrack
            return newState
        },
        setTempo(state, action: { payload: { track: keyof TrackStateType; tempo: number } }) {
            console.log('setTempo', action)
            const newState = { ...state }
            const newTrack = { ...newState[action.payload.track] }
            newTrack.tempo = action.payload.tempo
            newState[action.payload.track] = newTrack
            return newState
        },
        setPlaying(state, action: { payload: { track: keyof TrackStateType; playing: boolean } }) {
            console.log('setPlaying', action)
            const newState = { ...state }
            const newTrack = { ...newState[action.payload.track] }
            newTrack.isPlaying = action.payload.playing
            newState[action.payload.track] = newTrack
            return newState
        },
        setBars(state, action: { payload: { track: keyof TrackStateType; bars: number[] } }) {
            console.log('setBars', action)
            const newState = { ...state }
            const newTrack = { ...newState[action.payload.track] }
            newTrack.bars = action.payload.bars
            newState[action.payload.track] = newTrack
            return newState
        },
    },
})

export const { setPlaybackRate, setTempo, setPlaying, setBars } = trackSlice.actions

export default trackSlice.reducer
