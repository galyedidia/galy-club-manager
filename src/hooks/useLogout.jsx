import { useEffect, useState } from "react"
import { projectAuth } from "../firebase/config"
import { useAuthContext } from "./useAuthContext"
import Log from "../components/LogUtil"

export const useLogout = () => {

  // States
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState(null)
  const [isPending, setIsPending] = useState(false)

  // Handle to update the context
  const { dispatch } = useAuthContext()

  // Function for logout
  const logout = async () => {
    setError(null)
    setIsPending(true)

    try {

      // Logout
      await projectAuth.signOut()
      
      // Update the state with logout 
      dispatch({type:'LOGOUT', payload:null})

      if (!isCancelled) {
        setIsPending(false)
        setError(null)
      } 
    } catch (err) {
      if (!isCancelled) {
        Log('useLogout','logout: err',err)
        setError(err.message)
        setIsPending(false)
      }
    }
  }

  // Create a manual Clean up function, using useEffect
  useEffect(()=>{
    return () => setIsCancelled(true)
  },[])

  // Returning all the needed hooks 
  return { error, isPending, logout } 

}