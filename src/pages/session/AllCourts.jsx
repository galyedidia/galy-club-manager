import { useEffect, useState } from "react";
import Court from "./Court";

export default function AllCourts({ allClubPlayersDocs, courts, startGame, endGame, addPlayerToCourt, 
                                    addWaitingCourtPlayersToCourt, isEn, viewer,addWaitingCourt,
                                    removeWaitingCourt, numWaitingCourts}) {
  const [time,setTime] = useState(0)
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {courts.map((c)=> (
          <Court key={c.id} 
            court={c} 
            allClubPlayersDocs={allClubPlayersDocs} 
            startGame={()=>startGame(c.id)} 
            endGame={(winTeam)=> endGame(winTeam,c.id)}
            addPlayerToCourt={addPlayerToCourt}
            addWaitingCourtPlayersToCourt={addWaitingCourtPlayersToCourt}
            time={time} isEn={isEn} viewer={viewer}
            addWaitingCourt={addWaitingCourt}
            numWaitingCourts={numWaitingCourts}
            removeWaitingCourt={removeWaitingCourt}
          />
        ))}
    </>
  )
}
