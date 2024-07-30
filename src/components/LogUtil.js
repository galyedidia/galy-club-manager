
const log = true
export default function Log(module,tag,msg) {
  if (log) {
    console.log(new Date()," ",module," ",tag," ",msg)
  }
}