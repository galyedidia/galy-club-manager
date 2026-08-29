import { useEffect, useState } from "react"
import { projectFirestore } from "../firebase/config"
import { doc, onSnapshot } from "firebase/firestore"

// A hook to get a single document according to the id and collection
export const useDocument = (collectionName, id) => {

  //States
  const [document, setDocument] = useState(null)
  const [useDocumentError, setUseDocumentError] = useState(null)

  useEffect(()=> {
    if (!id) {
      setDocument(null)
      return
    }

    const docRef = doc(projectFirestore, collectionName, id)

    const unsub = onSnapshot(docRef, (snap)=>{
      if (snap.exists()){
        setDocument({...snap.data(), id: snap.id})
        setUseDocumentError(null)  
      } else {
        setUseDocumentError("Document doesn't exist")
      }
    }, (err)=> {
      console.log(err.message)
      setUseDocumentError("failed to get document")
    })

    return () => unsub()

  },[collectionName, id])

  return { document, useDocumentError }

}