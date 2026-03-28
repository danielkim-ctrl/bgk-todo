export function ProgressBar({value=0, onChange}: {value?: number, onChange: (v: number) => void}) {
  const steps=[25,50,75,100];
  const pct=Math.round((value||0)/25)*25;
  const boxColor=(step: number)=>step===100?"#16a34a":step===75?"#84cc16":step===50?"#eab308":"#f97316";
  const textColor=pct===100?"#16a34a":pct>=50?"#ca8a04":pct>0?"#ea580c":"#94a3b8";
  return(
    <div style={{display:"flex",alignItems:"center",gap:2}}>
      {steps.map(step=>(
        <div key={step} onClick={e=>{e.stopPropagation();onChange(pct===step?step-25:step);}}
          title={`${step}%`}
          style={{flex:1,height:8,borderRadius:3,cursor:"pointer",
            background:pct>=step?boxColor(step):"#e2e8f0",
            border:`1px solid ${pct>=step?boxColor(step)+"99":"#d1d5db"}`,
            transition:"background .12s"}}/>
      ))}
      <span style={{fontSize:10,minWidth:22,textAlign:"right" as const,fontWeight:pct>0?600:400,color:textColor,flexShrink:0}}>
        {pct}%
      </span>
    </div>
  );
}
