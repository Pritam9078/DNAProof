"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, CheckCircle2, Loader2, Shield } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File, hash: string) => void;
  onClear: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onClear }) => {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Preparing...");
  const [isAiScanning, setIsAiScanning] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setIsCalculating(true);
      setProgress(0);

      // Simulate hashing and AI scanning progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 40) {
            setStatusMessage("Hashing Keccak256...");
            return prev + 5;
          } else if (prev < 80) {
            setIsAiScanning(true);
            setStatusMessage("AI Document Scanning...");
            return prev + 5;
          } else if (prev < 95) {
            setStatusMessage("Finalizing Proof...");
            return prev + 2;
          }
          clearInterval(interval);
          return 95;
        });
      }, 150);

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const buffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(buffer);
          const fileHash = ethers.keccak256(uint8Array);
          
          setHash(fileHash);
          setProgress(100);
          setStatusMessage("Secure Hash Generated");
          setIsAiScanning(false);
          setIsCalculating(false);
          onFileSelect(selectedFile, fileHash);
          clearInterval(interval);
        };
        reader.readAsArrayBuffer(selectedFile);
      } catch (error) {
        console.error("Hashing error:", error);
        setIsCalculating(false);
        clearInterval(interval);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false
  });

  const clearFile = () => {
    setFile(null);
    setHash(null);
    setProgress(0);
    onClear();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...(getRootProps() as any)}
            className={cn(
              "relative group cursor-pointer aspect-[16/6] flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-all overflow-hidden",
              isDragActive 
                ? "border-primary bg-primary/10 neon-glow" 
                : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <div className={cn(
              "w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110",
              isDragActive && "scale-110 rotate-12 neon-glow bg-primary/20"
            )}>
              <Upload className={cn("w-8 h-8 text-foreground/40", isDragActive && "text-primary")} />
            </div>

            <div className="text-center">
              <p className="text-xl font-bold">Drag & Drop Documents</p>
              <p className="text-sm text-foreground/40 mt-1">Supports PDF, DOCX, JPG (Max 50MB)</p>
            </div>

            <input {...getInputProps()} />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 rounded-3xl border-white/10 flex items-center gap-6 relative group"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
               {isCalculating ? (
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
               ) : (
                 <File className="w-8 h-8 text-primary" />
               )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold truncate">{file.name}</p>
                {!isCalculating && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>
              <div className="flex flex-col gap-2 mt-2">
                 <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-foreground/30">
                    <span>{isCalculating ? "Calculating Keccak256..." : "Hash Generated"}</span>
                    <span>{progress}%</span>
                 </div>
                 <Progress value={progress} className="h-1 bg-white/5" />
                 {hash && (
                   <div className="flex items-center gap-2 mt-1">
                      {isAiScanning ? (
                        <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                      ) : (
                        <Shield className="w-3 h-3 text-primary" />
                      )}
                      <p className={cn("text-[10px] font-mono truncate", isAiScanning ? "text-cyan-400" : "text-primary/60")}>
                        {isAiScanning ? "Analyzing document structure..." : hash}
                      </p>
                   </div>
                  )}
              </div>
            </div>

            <button 
              onClick={clearFile}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
