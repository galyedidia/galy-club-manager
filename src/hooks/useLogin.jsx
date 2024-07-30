import { useEffect, useState } from "react"
import { projectAuth, projectFirestore } from "../firebase/config"
import { useAuthContext } from "./useAuthContext"
import Log from "../components/LogUtil"

export const useLogin = () => {
  // States
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState(null)
  const [isPending, setIsPending] = useState(false)

  // Handle to update the context
  const { dispatch } = useAuthContext()

  // Function to clear the Error
  const clearError = () =>{
    setError(null)
  }

  const resetPassword = async (email) => {
    setError(null)
    setIsPending(true)
    try {
      await projectAuth.sendPasswordResetEmail(email)
      if (!isCancelled) {
        setIsPending(false)
        setError(null)
      }
    } catch (err) {
      if (!isCancelled) {
        Log('useLogin','resetPassword: err',err)
        setError(err)
        setIsPending(false)
      }
    }
  }

  // Function for login
  const login = async (email, password) => {
    setError(null)
    setIsPending(true)

    try {
      // Login User
      const res = await projectAuth.signInWithEmailAndPassword(email, password)
      
      // Check that result is not null
      if (!res) {
        throw new Error('could not complete login')
      }

      // Get the userDoc from the users collection and add it to the user
      const docRef = projectFirestore.collection('users').doc(res.user.uid)
      const docSnap = await docRef.get();
      const myUser = {...res.user, ...docSnap.data()}

      // Update the state with the new login 
      dispatch({type:'LOGIN', payload:myUser})


      if (!isCancelled) {
        console.log(res.user)
        setIsPending(false)
        setError(null)
      }
    } catch (err) {
      if (!isCancelled) {
        Log('useLogin','login: err',err)        
        setError(err)
        setIsPending(false)
      }
    }
  }

  // Create a manual Clean up function, using useEffect
  useEffect(()=>{
    return () => setIsCancelled(true)
  },[])
  
  // Returning all the needed hooks   
  return { error, isPending, login, clearError, resetPassword } 

}