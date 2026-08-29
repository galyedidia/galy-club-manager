import { useEffect, useRef, useState } from "react"
import { projectFirestore } from "../firebase/config"

export const useCollection = (collection, _query1, _query2, _orderBy) => {

  const [documents, setDocuments] = useState(null)
  const [error, setError] = useState(null)

  // Use ref with deep comparison so literal arrays don't cause infinite re-renders,
  // while still allowing dynamic query parameter updates
  const query1Ref = useRef(_query1)
  const query2Ref = useRef(_query2)
  const orderByRef = useRef(_orderBy)

  if (JSON.stringify(query1Ref.current) !== JSON.stringify(_query1)) {
    query1Ref.current = _query1
  }
  if (JSON.stringify(query2Ref.current) !== JSON.stringify(_query2)) {
    query2Ref.current = _query2
  }
  if (JSON.stringify(orderByRef.current) !== JSON.stringify(_orderBy)) {
    orderByRef.current = _orderBy
  }

  const query1 = query1Ref.current
  const query2 = query2Ref.current
  const orderBy = orderByRef.current

  useEffect(()=>{
    // Reference to the collection which contains the documents
    let ref = projectFirestore.collection(collection)

    // If there is a query - we query the ref
    if (query1) {
      ref = ref.where(...query1)
    }
    if (query2) {
      ref = ref.where(...query2)
    }
    if (orderBy) {
      ref = ref.orderBy(...orderBy)
    }
    // subscribe to a change that happens on this collection in the data base
    //   if a document is added, update or delete, the function will fire
    //   it also runs when it is declared for the first time
    const unsub = ref.onSnapshot((snap)=>{
      let results = []
      // docs is a collection of the documents
      // each document in forestore has an id
      // create an object by spreading what we got from fierstore and add the id
      snap.docs.forEach(doc => {
        results.push({...doc.data(),id:doc.id})
      })

      // Update the state with the new results
      setDocuments(results)
      setError(null)
    }, (error)=>{
      console.log(error)
      setError('could not fetch the collection')
    }) // onSnapshot

    // Cleanup function
    return ()=> {unsub()}

  },[collection, query1,query2, orderBy])

  return { documents, error }
}