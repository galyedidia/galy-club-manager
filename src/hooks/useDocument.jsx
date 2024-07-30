import { useEffect, useState } from "react"
import { projectFirestore } from "../firebase/config"


// A hook to get a single docuemnt according to the id and collection
export const useDocument = (collection, id) => {

  //States
  const [document, setDocument] = useState(null)
  const [useDocumentError, setUseDocumentError] = useState(null)

  //Project firestore
  useEffect(()=> {

    // Get a ref to the doc
    const ref = projectFirestore.collection(collection).doc(id)
    // Setup a listner that will fire once when declaring
    // and when ever the file changes in the DB 
    const unsub = ref.onSnapshot((snap)=>{
      if (snap.data()){
        setDocument({...snap.data(), id:snap.id})
        setUseDocumentError(null)  
      } else {
        setUseDocumentError("Document doesn't exists")
      }
    }, (err)=> {
      console.log(err.message)
      setUseDocumentError("failed to get document")
    })

    return () => unsub()

  },[collection,id])

  return { document, useDocumentError }

}