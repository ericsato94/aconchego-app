import { createContext, useContext } from 'react'

export type ToastTone = 'info' | 'success' | 'error'

export const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {})

export const useToast = () => useContext(ToastContext)
