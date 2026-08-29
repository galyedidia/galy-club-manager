import { createContext, useEffect, useReducer } from "react";
import { projectAuth, projectFirestore } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Log from "../components/LogUtil";


// The reducer updates the state of the context in a centrelize manner
// Gets a type and an action and update the state accordingly
export const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_IS_READY':
      return {...state, authIsReady: true, user: action.payload}
    case 'LOGIN':
      return {...state, user: action.payload}
      case 'LOGOUT':
        return {...state, user: null}
      default: 
    return state
  }
}

///////////////////////////////////////
// Creating the Context provider
///////////////////////////////////////
// This is the Context object that its provider will wrap tha application
export const AuthContext =  createContext()

// This is the Provider to be instance around the 
//   components which needs the Context
export const AuthContextProvider = ({children}) => {

  //Through the reducer it gets a handle on the state of the context
  //  and also a function to update the state
  //  - authReducer is the function that will be invoked when calling dispath
  //  - The object is the initial value of the state
  const [state, dispatch] = useReducer(authReducer,{
    user: null,
    authIsReady: false
  })

  // Listen to auth state changes throughout the application lifecycle
  useEffect(() => {
    const unsub = onAuthStateChanged(projectAuth, async (user)=>{
      let myUser = user
      if (user != null) {
        // Get the userDoc from the users collection and add to the user
        const docRef = doc(projectFirestore, 'users', user.uid)
        const docSnap = await getDoc(docRef);
        myUser = {...user, ...docSnap.data()}
      }
      dispatch({type: 'AUTH_IS_READY', payload: myUser})
    })
    return () => unsub()
  },[])

  Log("AuthContext","State",state)
  
  return (
    <AuthContext.Provider value={{...state, dispatch}}>
      { children }
    </AuthContext.Provider>
  )
}