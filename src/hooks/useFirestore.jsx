import { useEffect, useReducer, useState } from "react"
import { projectFirestore, timestamp } from "../firebase/config"
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
export const useFirestore = (collection) => {
  
  // Using reducer
  const [response, dispatch] = useReducer(firestoreReducer, initialState)
  const [isCancelled, setIsCanclled] = useState(false)

  // Reference to the collection
  const ref = projectFirestore.collection(collection)

  const dispatchIfNotCancelled = (action) => {
    if (!isCancelled) {
      dispatch(action)
    }
  }

  // Function for adding a document to a collection
  //  will be exported as part of the hook
  const addDocument = async (doc) => {
    dispatch({type:'IS_PENDING'})
    try {
      const createdAt = timestamp.fromDate(new Date())
      const addedDoc = await ref.add({ ...doc, createdAt })
      dispatchIfNotCancelled ({
        type: 'ADDED_DOC', payload: addedDoc
      })
    } catch (err) {
      dispatchIfNotCancelled({type:'ERROR', payload:err.message})
    }
  }

  // Function for updating a document
  const updateDocument = async (id, updates) => {
    dispatch({type:'IS_PENDING'})
    try {
      const updatedDoc = await ref.doc(id).update(updates)
      dispatchIfNotCancelled ({
        type: 'UPDATED_DOC', payload: updatedDoc
      })
      return updateDocument
    } catch (err) {
      dispatchIfNotCancelled({type:'ERROR', payload:err.message})
      return null
    }
  }

  // Function for deleting a document from a collection
  //  will be exported as part of the hook
  const deleteDocument = async (id) => {
    dispatch({type:'IS_PENDING'})
    try {
      // Get a reference to the doc we want to delete
      await ref.doc(id).delete()
      dispatchIfNotCancelled({type:'DELETED_DOC'})
    } catch (err) {

    }
  }

  // Clean up function
  useEffect(()=>{
    return ()=> setIsCanclled(true)
  },[])

  return { addDocument, deleteDocument, updateDocument, response}

}