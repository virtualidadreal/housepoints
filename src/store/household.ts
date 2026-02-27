import { create } from 'zustand'
import type { Household, Profile, TaskLog, Task, WeekResult } from '../lib/types'

interface WeekData {
  weekId: string
  taskLogs: TaskLog[]
  user1Points: number
  user2Points: number
}

interface HouseholdState {
  // Data
  household: Household | null
  profile: Profile | null
  partner: Profile | null
  tasks: Task[]
  weekData: WeekData | null
  weekResults: WeekResult[]

  // Actions
  setHousehold: (household: Household | null) => void
  setProfile: (profile: Profile | null) => void
  setPartner: (partner: Profile | null) => void
  setTasks: (tasks: Task[]) => void
  setWeekData: (data: WeekData | null) => void
  setWeekResults: (results: WeekResult[]) => void
  addTaskLog: (log: TaskLog) => void
  updateScore: (userId: string, points: number) => void
  reset: () => void
}

const initialState = {
  household: null,
  profile: null,
  partner: null,
  tasks: [],
  weekData: null,
  weekResults: [],
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  ...initialState,

  setHousehold: (household) => set({ household }),
  setProfile: (profile) => set({ profile }),
  setPartner: (partner) => set({ partner }),
  setTasks: (tasks) => set({ tasks }),
  setWeekData: (data) => set({ weekData: data }),
  setWeekResults: (results) => set({ weekResults: results }),

  addTaskLog: (log) =>
    set((state) => {
      if (!state.weekData) return state
      const taskLogs = [...state.weekData.taskLogs, log]
      const isUser1 = log.user_id === state.household?.user1_id
      return {
        weekData: {
          ...state.weekData,
          taskLogs,
          user1Points: state.weekData.user1Points + (isUser1 ? log.points : 0),
          user2Points: state.weekData.user2Points + (isUser1 ? 0 : log.points),
        },
      }
    }),

  updateScore: (userId, points) =>
    set((state) => {
      if (!state.weekData || !state.household) return state
      const isUser1 = userId === state.household.user1_id
      return {
        weekData: {
          ...state.weekData,
          user1Points: isUser1 ? points : state.weekData.user1Points,
          user2Points: isUser1 ? state.weekData.user2Points : points,
        },
      }
    }),

  reset: () => set(initialState),
}))
