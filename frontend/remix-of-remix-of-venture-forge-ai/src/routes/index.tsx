import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Check, CircleDollarSign, Code2, Github, Hand, Layers3, Megaphone, Search, Send, Sparkles, WalletCards, Zap } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brand } from "@/components/brand";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Venture Forge — AI Startup Evaluator" },
      { name: "description", content: "Turn startup ideas into investment-grade clarity with six specialist AI agents." },
      { property: "og:title", content: "Venture Forge — AI Startup Evaluator" },
      { property: "og:description", content: "Investor-ready startup analysis from six specialist AI agents." },
    ],
  }),
  component: Index,
});

function Index() {
  const [sampleOpen, setSampleOpen] = useState(false);
  const agents = ["YC Partner","Tech Auditor","Business CFO","Marketing Expert","Demand Intel","Synthesis Agent"];

  const MotionLink = motion(Link);
  const logos = [
    { el: <><i className="grid h-6 w-6 place-items-center bg-primary not-italic text-primary-foreground">Y</i>Combinator</> },
    { el: <><i className="grid h-6 w-6 place-items-center rounded-full bg-foreground not-italic text-background">P</i>Product Hunt</> },
    { el: <><Github className="h-6 w-6"/>GitHub</> },
    { el: <><i className="text-xl not-italic">▲</i>Vercel</> },
    { el: <><Hand className="h-6 w-6"/>AngelList</> },
  ];

  const steps: Array<[typeof Send, string, string, string]> = [
    [Send, "01", "Submit Your Idea", "Describe your startup in a few lines. The more detail you give, the sharper the verdict."],
    [Layers3, "02", "6 Agents Analyze", "Six specialist agents work in parallel — market, tech, finance, growth, demand, synthesis."],
    [CircleDollarSign, "03", "Get Investor Report", "Scores, insights, a roadmap and Cursor-ready tasks delivered in under 30 seconds."],
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      {/* === NAV (full width) === */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between px-6 lg:px-12">
          <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}><Brand/></motion.div>
          <div className="hidden items-center gap-10 text-sm font-medium md:flex lg:text-base">
            {[["#product","Product"],["#how","How It Works"],["#agents","Agents"],["#pricing","Pricing"],["#docs","Docs"]].map(([href,label],i)=>(
              <motion.a key={href} href={href} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{delay:.1+i*.05}} whileHover={{y:-2,color:"var(--primary)"}} className="story-link">{label}</motion.a>
            ))}
          </div>
          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth" search={{mode:"signin"}}>Sign In</Link></Button>
            <Button variant="hero" size="sm" className="btn-shine btn-pulse" asChild><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
          </motion.div>
        </div>
      </nav>

      {/* === HERO (full width, animated background) === */}
      <section id="product" className="relative w-full overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" aria-hidden/>
        <div className="orb orb-a -top-32 -left-20 h-[420px] w-[420px]" style={{background:"color-mix(in oklab, var(--primary) 35%, transparent)"}} aria-hidden/>
        <div className="orb orb-b top-40 right-0 h-[520px] w-[520px]" style={{background:"color-mix(in oklab, var(--primary) 22%, transparent)"}} aria-hidden/>
        <svg className="spin-slow pointer-events-none absolute -right-40 top-20 hidden h-[600px] w-[600px] opacity-20 lg:block" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--primary)" strokeWidth=".4" strokeDasharray="2 4"/>
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--primary)" strokeWidth=".4" strokeDasharray="1 3"/>
          <circle cx="100" cy="100" r="40" fill="none" stroke="var(--primary)" strokeWidth=".4"/>
        </svg>

        <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-16 px-6 py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-32">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7}} className="relative z-10">
            <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:.2}} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-primary">
              <motion.span animate={{rotate:360}} transition={{repeat:Infinity,duration:4,ease:"linear"}}><Sparkles className="h-3.5 w-3.5"/></motion.span>
              AI-powered startup evaluation
            </motion.div>
            <h1 className="relative max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[5.5rem]">
              Turn ideas into{" "}
              <span className="relative inline-block">
                <span className="shimmer-title">investment-grade clarity.</span>
                <span className="title-underline"/>
              </span>
            </h1>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}} className="mt-8 max-w-xl text-base leading-7 text-muted-foreground lg:text-lg">
              Get feedback from six AI specialists in parallel and receive a complete investor-ready report in under 30 seconds.
            </motion.p>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.55}} className="mt-10 flex flex-wrap gap-4">
              <motion.div whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}>
                <Button variant="hero" size="lg" className="btn-shine btn-pulse group" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Evaluate My Startup
                    <motion.span animate={{x:[0,4,0]}} transition={{repeat:Infinity,duration:1.5}} className="inline-flex"><ArrowRight/></motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}>
                <Button variant="outline" size="lg" className="btn-shine" onClick={()=>setSampleOpen(true)}>View Sample Report</Button>
              </motion.div>
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.8}} className="mt-12 flex items-center gap-6 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary"/>30s analysis</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary"/>No card required</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary"/>6 specialists</span>
            </motion.div>
          </motion.div>

          <motion.div initial={{opacity:0,scale:.9,y:30}} animate={{opacity:1,scale:1,y:0}} transition={{delay:.3,duration:.7}} whileHover={{y:-6,rotateY:2,rotateX:-2}} style={{transformStyle:"preserve-3d"}} className="bob relative z-20 mx-auto w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-primary/20">
            <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-primary/30 via-transparent to-primary/10" aria-hidden/>
            <div className="relative flex items-center justify-between border-b p-6">
              <div>
                <p className="text-xs text-muted-foreground">Overall Score</p>
                <div className="mt-1 font-display text-5xl">87<span className="font-sans text-xs text-muted-foreground"> /100</span></div>
                <p className="mt-1 text-xs font-medium text-primary">Strong Potential</p>
              </div>
              <ScoreRing score={87}/>
            </div>
            <div className="relative p-6">
              <p className="mb-4 text-xs font-semibold">6 Agents Evaluating</p>
              <div className="space-y-3">
                {agents.map((agent,i)=>(
                  <motion.div key={agent} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.6+i*.08}} className="flex items-center gap-3">
                    <motion.span animate={{scale:[1,1.15,1]}} transition={{repeat:Infinity,duration:2,delay:i*.2}} className={`grid h-7 w-7 place-items-center rounded ${i%2 ? "bg-foreground text-background":"bg-primary text-primary-foreground"}`}><Check className="h-3.5 w-3.5"/></motion.span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{agent}</p>
                      <p className="text-[10px] text-muted-foreground">Analysis complete</p>
                    </div>
                    <span className="text-[9px] text-success">Completed</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Logo marquee */}
        <div className="relative w-full border-y border-border/60 bg-card/40 py-8 overflow-hidden">
          <p className="mb-6 text-center text-[10px] uppercase tracking-[.2em] text-muted-foreground">Trusted by builders from</p>
          <div className="flex w-max marquee-track gap-16 px-8 text-sm font-semibold">
            {[...logos,...logos,...logos].map((l,i)=>(
              <span key={i} className="flex shrink-0 items-center gap-2 opacity-70 transition-opacity hover:opacity-100">{l.el}</span>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS — vertical, generous === */}
      <section id="how" className="relative w-full border-t border-border py-32">
        <div className="orb orb-a top-20 right-10 h-[300px] w-[300px]" style={{background:"color-mix(in oklab, var(--primary) 18%, transparent)"}} aria-hidden/>
        <div className="relative mx-auto w-full max-w-[1600px] px-6 lg:px-12">
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">How It Works</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">From idea to <span className="shimmer-title">investor report</span> in three steps.</h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-muted-foreground lg:text-base">A simple loop: you write a few lines, six specialist agents go to work, you get a verdict and a plan.</p>
          </motion.div>

          <div className="relative mt-24 space-y-24">
            {/* connecting vertical line */}
            <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/40 to-transparent lg:block" aria-hidden/>
            {steps.map(([Icon, num, title, text], i) => {
              const reverse = i % 2 === 1;
              return (
                <motion.article
                  key={num}
                  initial={{opacity:0,y:60}}
                  whileInView={{opacity:1,y:0}}
                  viewport={{once:true,margin:"-100px"}}
                  transition={{duration:.7,ease:"easeOut"}}
                  className={`relative grid items-center gap-12 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
                >
                  <div className={`${reverse ? "lg:pl-20 lg:text-left" : "lg:pr-20 lg:text-right"}`}>
                    <motion.span initial={{opacity:0,scale:.5}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:.1}} className="font-display text-7xl text-primary/20 lg:text-8xl">{num}</motion.span>
                    <h3 className="mt-2 text-3xl font-semibold lg:text-4xl">{title}</h3>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground lg:text-base">{text}</p>
                  </div>
                  <div className="relative flex justify-center">
                    <motion.div
                      whileHover={{scale:1.05,rotate:reverse?-3:3}}
                      transition={{type:"spring",stiffness:200}}
                      className="relative grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-2xl border border-border bg-card p-10 shadow-xl shadow-primary/10"
                    >
                      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:30,ease:"linear"}} className="absolute inset-0">
                        <div className="absolute inset-6 rounded-full border border-dashed border-primary/30"/>
                        <div className="absolute inset-14 rounded-full border border-dashed border-primary/20"/>
                      </motion.div>
                      <motion.span animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:3,ease:"easeInOut"}} className="relative grid h-24 w-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
                        <Icon className="h-10 w-10"/>
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* === AGENTS (full width) === */}
      <section id="agents" className="w-full border-t border-border bg-card">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-28 lg:px-12">
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Six specialists. One decisive report.</p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
              <h2 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">A venture team <span className="shimmer-title">working in parallel</span>.</h2>
              <p className="max-w-md text-sm leading-7 text-muted-foreground lg:text-base">Every agent examines your startup through a different investor lens, then a synthesis agent resolves the findings into an actionable verdict.</p>
            </div>
          </motion.div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[[WalletCards,"YC Partner","Founder insight, market timing and venture-scale potential."],[Code2,"Tech Auditor","MVP feasibility, architecture, complexity and technical risk."],[CircleDollarSign,"Business CFO","Unit economics, pricing, margins and business model."],[Megaphone,"Marketing Expert","Positioning, acquisition channels and go-to-market strategy."],[Search,"Demand Intel","Problem urgency, demand signals and willingness to pay."],[BrainCircuit,"Synthesis Agent","Cross-agent verdict, priorities, roadmap and next steps."]].map(([Icon,name,copy],i)=>{const I=Icon as typeof Send;return(
              <motion.article key={String(name)} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-60px"}} transition={{delay:i*.08,duration:.5}} whileHover={{y:-8,boxShadow:"0 24px 48px -16px color-mix(in oklab, var(--primary) 35%, transparent)"}} className="group relative overflow-hidden rounded-xl border border-border bg-background p-8">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100"/>
                <motion.span whileHover={{rotate:360}} transition={{duration:.6}} className="relative grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><I className="h-5 w-5"/></motion.span>
                <h3 className="relative mt-6 font-sans text-base font-semibold">{String(name)}</h3>
                <p className="relative mt-3 text-sm leading-6 text-muted-foreground">{String(copy)}</p>
                <motion.div initial={{scaleX:0}} whileInView={{scaleX:1}} viewport={{once:true}} transition={{delay:i*.08+.3,duration:.6}} style={{transformOrigin:"left"}} className="relative mt-6 h-0.5 bg-primary"/>
              </motion.article>
            )})}
          </div>
        </div>
      </section>

      {/* === PRICING (full width) === */}
      <section id="pricing" className="relative w-full overflow-hidden border-t border-border py-28">
        <div className="orb orb-b -bottom-32 left-1/3 h-[400px] w-[400px]" style={{background:"color-mix(in oklab, var(--primary) 20%, transparent)"}} aria-hidden/>
        <div className="relative mx-auto grid w-full max-w-[1600px] gap-16 px-6 lg:grid-cols-[1fr_460px] lg:px-12">
          <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Simple pricing</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Start free. Upgrade when you are ready to <span className="shimmer-title">move faster</span>.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground lg:text-base">Create your account, evaluate your first idea and explore the full investor report. No card required to begin.</p>
          </motion.div>
          <motion.article initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} whileHover={{y:-6,scale:1.02}} className="relative overflow-hidden rounded-xl border-2 border-primary bg-card p-10 shadow-2xl shadow-primary/20">
            <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:20,ease:"linear"}} className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-2xl"/>
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold">Founder</p>
                <p className="mt-3 font-display text-5xl">Free</p>
              </div>
              <motion.span animate={{y:[0,-4,0]}} transition={{repeat:Infinity,duration:2}} className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold text-primary">Get started</motion.span>
            </div>
            <ul className="relative mt-8 space-y-3 text-sm">
              {["Six-agent parallel analysis","Investor-readiness score","Detailed specialist reports","Roadmap and Cursor-ready tasks"].map((item,i)=>(
                <motion.li key={item} initial={{opacity:0,x:-10}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.1}} className="flex gap-2"><Check className="h-4 w-4 text-primary"/>{item}</motion.li>
              ))}
            </ul>
            <motion.div whileHover={{scale:1.03}} whileTap={{scale:.97}} className="relative">
              <Button variant="hero" className="mt-8 w-full btn-shine btn-pulse" asChild><Link to="/auth" search={{mode:"signup"}}>Evaluate My Startup <ArrowRight/></Link></Button>
            </motion.div>
          </motion.article>
        </div>
      </section>

      {/* === DOCS / CTA (full bleed) === */}
      <section id="docs" className="relative w-full overflow-hidden border-y border-border bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-10" aria-hidden/>
        <div className="orb orb-a top-0 left-1/4 h-[400px] w-[400px]" style={{background:"color-mix(in oklab, var(--primary) 35%, transparent)"}} aria-hidden/>
        <div className="relative mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-10 px-6 py-24 lg:px-12">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-primary">Documentation</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">From first idea to <span className="shimmer-title">execution plan</span>.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 opacity-70 lg:text-base">Learn how scores work, what each agent evaluates, and how to use reports, roadmaps and development tasks.</p>
          </motion.div>
          <motion.div whileHover={{scale:1.05,y:-2}} whileTap={{scale:.97}}>
            <Button variant="hero" size="lg" className="btn-shine btn-pulse" asChild><Link to="/auth" search={{mode:"signup"}}>Open Venture Forge <ArrowRight/></Link></Button>
          </motion.div>
        </div>
      </section>

      {/* === FOOTER (full width) === */}
      <footer className="w-full px-6 py-12 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap justify-between gap-10">
          <Brand/>
          <div className="grid grid-cols-3 gap-16 text-xs">
            <div><b>Product</b><div className="mt-3 space-y-2 text-muted-foreground"><a className="block transition-colors hover:text-primary" href="#agents">Agents</a><a className="block transition-colors hover:text-primary" href="#product">Reports</a><a className="block transition-colors hover:text-primary" href="#pricing">Pricing</a></div></div>
            <div><b>Explore</b><div className="mt-3 space-y-2 text-muted-foreground"><a className="block transition-colors hover:text-primary" href="#how">How it works</a><button className="block transition-colors hover:text-primary" onClick={()=>setSampleOpen(true)}>Sample report</button><Link className="block transition-colors hover:text-primary" to="/auth" search={{mode:"signin"}}>Sign in</Link></div></div>
            <div><b>Resources</b><div className="mt-3 space-y-2 text-muted-foreground"><a className="block transition-colors hover:text-primary" href="#docs">Docs</a><a className="block transition-colors hover:text-primary" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a><a className="block transition-colors hover:text-primary" href="#product">Status</a></div></div>
          </div>
        </div>
      </footer>

      <Dialog open={sampleOpen} onOpenChange={setSampleOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="font-display text-2xl">AI Study Companion — Sample Report</DialogTitle><DialogDescription>Six-agent investor-readiness analysis</DialogDescription></DialogHeader><div className="grid gap-5 sm:grid-cols-[auto_1fr]"><ScoreRing score={87}/><div><h3 className="font-sans font-semibold">Strong Potential</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A compelling student productivity product with a clear audience and credible freemium path. Focus the MVP on retention and prove learning outcomes before expanding.</p></div></div><Button variant="hero" asChild><Link to="/auth" search={{mode:"signup"}}>Evaluate your idea</Link></Button></DialogContent></Dialog>
    </main>
  );
}
