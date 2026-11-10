import { createSlice } from '@reduxjs/toolkit'

export interface AppStateType {
    isSynced: boolean
}

const initialState: AppStateType = {
    isSynced: false,
}

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setSynced(state, action) {
            console.log('setSynced', action)
            return {
                ...state,
                isSynced: action.payload,
            }
        },
    },
})

export const { setSynced } = appSlice.actions

export default appSlice.reducer
