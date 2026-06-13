import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowUpRight, CircleCheck, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route=createFileRoute("/_authenticated/dashboard")({component:Dashboard});
function Dashboard(){
  const {user}=Route.useRouteContext();
  const name=String(user.user_metadata?.display_name??user.email?.split("@")[0]??"Founder");
  const [rows,setRows]=useState<Tables<"evaluations">[]>([]);
  const [activeBin,setActiveBin]=useState<number|null>(null);
  useEffect(()=>{supabase.from("evaluations").select("*").order("created_at",{ascending:false}).then(({data})=>setRows(data??[]))},[]);
  const completed=rows.filter(row=>row.status==="completed"&&row.overall_score!==null);
  const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);
  const thisMonth=rows.filter(row=>new Date(row.created_at)>=monthStart);
  const monthCompleted=thisMonth.filter(row=>row.status==="completed"&&row.overall_score!==null);
  const average=monthCompleted.length?Math.round(monthCompleted.reduce((sum,row)=>sum+(row.overall_score??0),0)/monthCompleted.length):0;
  const bins=useMemo(()=>[0,20,40,60,80].map(min=>completed.filter(row=>(row.overall_score??0)>=min&&(row.overall_score??0)<(min===80?101:min+20)).length),[rows]);
  const maxBin=Math.max(1,...bins);
  const palette=["bg-primary","bg-foreground","bg-success","bg-warning"];
  const displayed=activeBin===null?rows:rows.filter(row=>{const s=row.overall_score??-1;return s>=activeBin*20&&s<(activeBin===4?101:activeBin*20+20)});
  return <AppShell>
    <motion.header initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.1}} className="text-xs text-muted-foreground">Good afternoon, {name}</motion.p>
        <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.15}} className="mt-4 max-w-lg text-4xl leading-tight">What startup are we evaluating <span className="shimmer-title">today?</span></motion.h1>
      </div>
      <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} whileHover={{scale:1.05,y:-2}} whileTap={{scale:.95}}>
        <Button variant="hero" className="btn-shine btn-pulse" asChild><Link to="/new-evaluation"><Plus/>New Evaluation</Link></Button>
      </motion.div>
    </motion.header>
    <div className="mt-10 grid gap-7 xl:grid-cols-[1fr_270px]">
      <section>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}} whileHover={{y:-3,boxShadow:"0 18px 40px -16px color-mix(in oklab, var(--primary) 30%, transparent)"}} className="border border-border bg-card p-5 transition-shadow">
          <textarea readOnly value="Describe your startup idea in a few lines…\n\nExample: AI copilot for university students to find and summarize notes from previous years." className="h-28 w-full resize-none bg-transparent text-xs leading-6 text-muted-foreground outline-none"/>
          <div className="flex justify-end">
            <motion.div whileHover={{scale:1.05}} whileTap={{scale:.95}}>
              <Button variant="hero" size="sm" className="btn-shine" asChild><Link to="/new-evaluation"><Plus/>New Evaluation</Link></Button>
            </motion.div>
          </div>
        </motion.div>
        <motion.h2 initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="mb-5 mt-10 font-sans text-sm font-semibold">6 AI Agents, Working in Parallel.</motion.h2>
        <AgentGrid progress={86}/>
      </section>
      <aside className="space-y-5">
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:.25}} whileHover={{y:-3}} className="border border-border bg-card p-5">
          <h3 className="font-sans text-xs font-semibold">This Month Overview</h3>
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Evaluations</p>
              <motion.b initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",delay:.4}} className="text-2xl inline-block">{thisMonth.length}</motion.b>
              <p className="mt-1 text-[9px] text-muted-foreground">{monthCompleted.length} completed this month</p>
            </div>
            <motion.div animate={{y:[0,-4,0]}} transition={{repeat:Infinity,duration:3}} className="text-center">
              <ScoreRing score={average} size="sm"/>
              <p className="mt-1 text-[9px] text-muted-foreground">Avg. Overall Score</p>
            </motion.div>
          </div>
          <div className="mt-5 grid grid-cols-2 border-t border-border pt-4 text-xs">
            <div><motion.b initial={{scale:.5}} animate={{scale:1}} transition={{type:"spring",delay:.5}} className="text-lg inline-block">{completed.length}</motion.b><p className="text-muted-foreground">Reports Generated</p></div>
            <div><motion.b initial={{scale:.5}} animate={{scale:1}} transition={{type:"spring",delay:.55}} className="text-lg inline-block">{rows.length}</motion.b><p className="text-muted-foreground">Ideas Evaluated</p></div>
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:.35}} whileHover={{y:-3}} className="border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Score Distribution</p>
            {activeBin!==null&&<button onClick={()=>setActiveBin(null)} className="text-[9px] text-primary hover:underline">Clear</button>}
          </div>
          <div className="mt-7 flex h-24 items-end gap-2">
            {bins.map((count,i)=>(
              <motion.button key={i} initial={{scaleY:0,opacity:0}} animate={{scaleY:1,opacity:1}} transition={{delay:.5+i*.08,type:"spring",stiffness:120}} style={{transformOrigin:"bottom"}} onClick={()=>setActiveBin(activeBin===i?null:i)} whileHover={{y:-2}} className={`flex h-full flex-1 flex-col justify-end text-center transition-opacity ${activeBin!==null&&activeBin!==i?"opacity-40":"opacity-100"} hover:opacity-100`}>
                <span className="mb-1 text-[8px] text-muted-foreground">{count}</span>
                <div className={`${activeBin===i?"bg-primary":i===4?"bg-primary/70":"bg-primary/25"} min-h-1 w-full transition-all hover:bg-primary`} style={{height:`${Math.max(8,(count/maxBin)*100)}%`}}/>
                <span className="mt-2 whitespace-nowrap text-[8px] text-muted-foreground">{i*20}-{i===4?100:i*20+19}</span>
              </motion.button>
            ))}
          </div>
          {activeBin!==null&&<p className="mt-3 text-[10px] text-muted-foreground">Showing {displayed.length} idea{displayed.length===1?"":"s"} scoring {activeBin*20}-{activeBin===4?100:activeBin*20+19}.</p>}
        </motion.div>
      </aside>
    </div>
    <motion.section initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold">Recent Evaluations{activeBin!==null&&<span className="ml-2 text-xs font-normal text-muted-foreground">(filtered)</span>}</h2>
        <Link to="/reports" className="text-xs text-primary story-link">View all <ArrowUpRight className="inline h-3 w-3"/></Link>
      </div>
      <div className="mt-4 overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[650px] text-left text-xs"><tbody>
          {displayed.slice(0,5).map((row,index)=>(
            <motion.tr key={row.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:index*.08}} whileHover={{backgroundColor:"color-mix(in oklab, var(--primary) 6%, transparent)"}} className="border-b border-border last:border-0">
              <td className="p-4"><Link to={row.status==="completed"?"/results/$id":"/evaluation/$id"} params={{id:row.id}} className="flex items-center gap-3 font-medium"><motion.span whileHover={{rotate:360,scale:1.1}} transition={{duration:.5}} className={`grid h-8 w-8 place-items-center rounded text-[10px] font-bold text-primary-foreground ${palette[index%palette.length]}`}>{row.title.slice(0,2).toUpperCase()}</motion.span><span><b className="block">{row.title}</b><small className="block max-w-52 truncate font-normal text-muted-foreground">{row.idea}</small></span></Link></td>
              <td><span className={`inline-flex items-center gap-1 ${row.status==="completed"?"text-success":"text-warning"}`}><CircleCheck className="h-3.5 w-3.5"/>{row.status}</span></td>
              <td><b>{row.overall_score??"—"}</b> /100</td>
              <td className="text-muted-foreground">{new Date(row.updated_at).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</td>
              <td><motion.div whileHover={{scale:1.2,rotate:5}} whileTap={{scale:.9}}><Button variant="ghost" size="icon" asChild><Link to={row.status==="completed"?"/results/$id":"/evaluation/$id"} params={{id:row.id}} aria-label={`Open ${row.title}`}><FileText/></Link></Button></motion.div></td>
            </motion.tr>
          ))}
        </tbody></table>
        {displayed.length===0&&<div className="p-10 text-center text-xs text-muted-foreground">{activeBin!==null?"No evaluations in this score range.":"Your completed evaluations will appear here."}</div>}
      </div>
    </motion.section>
  </AppShell>}