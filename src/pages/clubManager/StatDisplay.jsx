export default function StatDisplay( {text, number} ) {
  return (
    <div className="stat-display">
      <p className="stat-display-number">{number}</p>
      <p className="stat-display-text">{text}</p>
    </div>
  )
}
