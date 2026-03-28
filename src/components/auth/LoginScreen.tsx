import { AVATAR_COLORS } from "../../constants";

interface LoginScreenProps {
  members: string[];
  onLogin: (name: string) => void;
}

export function LoginScreen({ members, onLogin }: LoginScreenProps) {
  return <div style={{minHeight:"100vh",background:"#f0f4f8",fontFamily:"'Pretendard',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
    <div style={{position:"sticky",top:0,zIndex:100,background:"#172f5a",padding:"20px 36px",textAlign:"center",boxShadow:"0 2px 16px rgba(0,0,0,.25)"}}>
      <img src={`${import.meta.env.BASE_URL}bgk_logo_white.png`} alt="Bridging Group" style={{height:40,width:"auto",display:"block",margin:"0 auto"}}/>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px"}}>
      <div style={{background:"#fff",borderRadius:20,width:480,maxWidth:"100%",boxShadow:"0 24px 64px rgba(0,0,0,.12)",padding:"32px 36px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:18,fontWeight:700,color:"#172f5a",marginBottom:6}}>팀 TODO 통합관리</div>
          <div style={{fontSize:13,color:"#94a3b8"}}>계속하려면 계정을 선택하세요</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {members.map((m,i)=>{
            const c=AVATAR_COLORS[i%AVATAR_COLORS.length];
            return <button key={m} onClick={()=>onLogin(m)}
              style={{padding:"14px 12px",border:"1.5px solid #e2e8f0",borderRadius:12,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .15s",fontFamily:"inherit",textAlign:"left"}}
              onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor=c;b.style.background=c+"11";b.style.transform="translateY(-1px)";b.style.boxShadow=`0 4px 12px ${c}22`;}}
              onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.borderColor="#e2e8f0";b.style.background="#fff";b.style.transform="none";b.style.boxShadow="none";}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${c},${AVATAR_COLORS[(i+3)%AVATAR_COLORS.length]})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0}}>{m[0]}</div>
              <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{m}</span>
            </button>;
          })}
        </div>
      </div>
    </div>
  </div>;
}
