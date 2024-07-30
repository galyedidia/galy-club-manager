import { timestamp } from "../../firebase/config"

const timestampToDate = (firebaseTimestamp) => {
  const date = new Date(firebaseTimestamp.seconds*1000)
  const formatedDate = fullDateToYYYYMMDD(date)
  console.log("timestampToDate",firebaseTimestamp,formatedDate)
  return formatedDate
}

const dateStringToTimestamp = (dateString) => {
  console.log("dateToTimestamp",dateString)
  const date = new Date(dateString)
  console.log("dateToTimestamp",date)
  const convertedTimestamp = timestamp.fromDate(date)
  console.log("dateToTimestamp",dateString,date, convertedTimestamp)
  return convertedTimestamp
}

const fullDateToDDMMYYYY = (fullDate) => {
  return `${fullDate.getDate()+1}-${fullDate.getMonth()+1}-${fullDate.getFullYear()}`
}
const fullDateToYYYYMMDD = (fullDate) => {
  let month = fullDate.getMonth()+1
  month = month < 10 ? `0${month}` : month
  let day = fullDate.getDate()
  day = day < 10 ? `0${day}` : day
  
  return `${fullDate.getFullYear()}-${month}-${day}`
}

export { dateStringToTimestamp, timestampToDate, fullDateToDDMMYYYY }