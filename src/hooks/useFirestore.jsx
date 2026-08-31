import { useEffect, useReducer, useState } from "react"
import { projectFirestore, timestamp } from "../firebase/config"
import { collection as firestoreCollection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import Log from "../components/LogUtil"

// Initital value of the State Object
let initialState = {
  document: null,
  isPending: false,
  error: null,
  success: null
}

// Reducer function which will handle all actions
const firestoreReducer = (state, action) => {
  Log('useFirestore','state',state)
  Log('useFirestore','action',action)
  switch (action.type) {
    case 'IS_PENDING':
      return {isPending:true, document:null, success:null,error:null}
    case 'ADDED_DOC':
      return {isPending:false, document:action.payload, success:true, error:null}
    case 'DELETED_DOC':
      return {isPending:false, document:null, success:true, error:null}
    case 'UPDATED_DOC':
      return {isPending:false, document:action.payload, success:true, error:null}
    case 'ERROR':
      return {isPending:false, document:null, success:false, error:action.payload}
    default: return state
  }
}

// The hook of useFirestore
// Getting the collection as an arg make it reusable
// Main functionality is to 
//  -- Add document
//  -- Delete document
export const useFirestore = (collectionName) => {
  
  // Using reducer
  const [response, dispatch] = useReducer(firestoreReducer, initialState)
  const [isCancelled, setIsCancelled] = useState(false)

  const dispatchIfNotCancelled = (action) => {
    if (!isCancelled) {
      dispatch(action)
    }
  }

  // Function for adding a document to a collection
  const addDocument = async (docData) => {
    dispatch({type:'IS_PENDING'})
    try {
      const createdAt = timestamp.fromDate(new Date())
      const colRef = firestoreCollection(projectFirestore, collectionName)
      const addedDoc = await addDoc(colRef, { ...docData, createdAt })
      dispatchIfNotCancelled ({
        type: 'ADDED_DOC', payload: addedDoc
      })
      return addedDoc
    } catch (err) {
      dispatchIfNotCancelled({type:'ERROR', payload:err.message})
      return null
    }
  }

  // Function for updating a document
  const updateDocument = async (id, updates) => {
    dispatch({type:'IS_PENDING'})
    try {
      const docRef = doc(projectFirestore, collectionName, id)
      await updateDoc(docRef, updates)
      dispatchIfNotCancelled ({
        type: 'UPDATED_DOC', payload: updates
      })
      return updateDocument
    } catch (err) {
      dispatchIfNotCancelled({type:'ERROR', payload:err.message})
      return null
    }
  }

  // Function for deleting a document from a collection
  const deleteDocument = async (id) => {
    dispatch({type:'IS_PENDING'})
    try {
      const docRef = doc(projectFirestore, collectionName, id)
      await deleteDoc(docRef)
      dispatchIfNotCancelled({type:'DELETED_DOC'})
      return { success: true }
    } catch (err) {
      console.error('deleteDocument error:', err)
      dispatchIfNotCancelled({type:'ERROR', payload:err.message})
      return { success: false, error: err.message }
    }
  }

  // Clean up function
  useEffect(()=>{
    return ()=> setIsCancelled(true)
  },[])

  return { addDocument, deleteDocument, updateDocument, response}

}