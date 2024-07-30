import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

// This hook is just to get a handle on the context of Auth
export const useAuthContext = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be inside AuthContextProvider')
  }

  return context
}