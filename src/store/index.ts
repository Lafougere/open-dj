import { configureStore } from '@reduxjs/toolkit'

import appReducer from './appSlice'
import trackReducer from './trackSlice'

const store = configureStore({
    reducer: {
        app: appReducer,
        track: trackReducer,
    },
})

export default store
