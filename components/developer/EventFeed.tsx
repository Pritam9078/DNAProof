"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogEntry } from "./types";

interface EventFeedProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function EventFeed({ logs, onClear }: EventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="glass-card border-white/5 overflow-hidden flex flex-col h-[380px]">
      <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Terminal className="w-4 h-4 text-primary" />
           </div>
           <div>
              <CardTitle className="text-sm font-bold tracking-tight">Live SDK Stream</CardTitle>
              <p className="text-[10px] text-foreground/30 font-medium">Real-time cryptographic event monitoring</p>
           </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-foreground/30 hover:text-white text-[10px] font-bold uppercase tracking-wider h-8"
          onClick={onClear}
        >
          Clear Terminal
        </Button>
      </CardHeader>
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-[12px] space-y-2.5 scrollbar-hide bg-black/40"
      >
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-foreground/10 space-y-3 italic select-none">
             <Terminal className="w-10 h-10 opacity-20" />
             <p className="tracking-widest uppercase text-[10px] font-black">Awaiting SDK handshakes...</p>
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex gap-4 leading-relaxed animate-in fade-in slide-in-from-left-4 duration-500">
             <span className="text-foreground/20 font-bold tabular-nums shrink-0">[{log.timestamp}]</span>
             <div className="flex gap-2 min-w-0">
               <span className={cn(
                  "font-black uppercase text-[10px] py-0.5 px-1.5 rounded h-fit shrink-0 tracking-wider",
                  log.level === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                  log.level === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  log.level === "warn" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : 
                  "bg-primary/10 text-primary border border-primary/20"
               )}>
                  {log.level}
               </span>
               <span className="text-foreground/70 break-words font-medium">{log.message}</span>
             </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
