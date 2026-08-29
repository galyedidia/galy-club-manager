import { useEffect, useRef, useState } from "react"
import { projectFirestore } from "../firebase/config"
import { collection as firestoreCollection, query as firestoreQuery, where, orderBy as firestoreOrderBy, onSnapshot } from "firebase/firestore"

export const useCollection = (collectionName, _query1, _query2, _orderBy) => {

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
    let colRef = firestoreCollection(projectFirestore, collectionName)
    const constraints = []

    if (query1) {
      constraints.push(where(...query1))
    }
    if (query2) {
      constraints.push(where(...query2))
    }
    if (orderBy) {
      constraints.push(firestoreOrderBy(...orderBy))
    }

    const q = constraints.length > 0 ? firestoreQuery(colRef, ...constraints) : colRef

    const unsub = onSnapshot(q, (snap)=>{
      let results = []
      snap.docs.forEach(doc => {
        results.push({...doc.data(), id: doc.id})
      })

      setDocuments(results)
      setError(null)
    }, (err)=>{
      console.log(err)
      setError('could not fetch the collection')
    })

    return () => unsub()

  },[collectionName, query1, query2, orderBy])

  return { documents, error }
}