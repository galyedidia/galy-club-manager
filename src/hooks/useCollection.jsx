import { useEffect, useRef, useState } from "react"
import { projectFirestore } from "../firebase/config"

export const useCollection = (collection, _query1, _query2, _orderBy) => {

  const [documents, setDocuments] = useState(null)
  const [error, setError] = useState(null)

  // Use ref since the query being passed is an array which changes on every render
  const query1 = useRef(_query1).current
  const query2 = useRef(_query2).current
  const orderBy = useRef(_orderBy).current

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