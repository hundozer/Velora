"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";
import {
  ShieldCheck,
  Camera,
  X,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

interface GetVerifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  onVerificationSubmitted: (verificationPhotoUrl: string) => void;
}

export function GetVerifiedModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  onVerificationSubmitted,
}: GetVerifiedModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const todayDateString = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMsg("Please upload your selfie holding the paper note.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let finalPhotoUrl = previewUrl || "";

      if (selectedFile) {
        setUploadProgress(10);
        const result = await uploadFileToR2(selectedFile, "general", (percent) => {
          setUploadProgress(percent);
        }, requestParticipantDeclaration());
        finalPhotoUrl = result.publicUrl;
      }

      setSubmitSuccess(true);
      onVerificationSubmitted(finalPhotoUrl);
    } catch (err: any) {
      console.error("Verification upload error:", err);
      setErrorMsg(err?.message || "Failed to upload verification photo. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <Card variant="goldBorder" className="w-full max-w-lg p-6 sm:p-8 space-y-6 text-left bg-velora-card relative shadow-2xl my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-velora-textMuted hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        {submitSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-gold-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-white">Verification Photo Submitted!</h3>
              <p className="text-xs text-velora-textMuted max-w-md mx-auto leading-relaxed">
                Your identity verification request is now under review by platform administration. Manual verification typically takes under 24 hours.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 font-semibold font-mono">
              Status: Verification Pending Manual Review ⏳
            </div>

            <Button variant="gold" size="lg" onClick={onClose} className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
              Got It
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-velora-gold fill-amber-400/20" />
                <h2 className="text-xl font-serif font-bold text-white">Get Biometric Verified</h2>
              </div>
              <p className="text-xs text-velora-textMuted">
                Build 100% trust with members on Intimo. Show you are authentic and verified behind your profile.
              </p>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-velora-gold" /> Step-by-Step Instructions
              </h3>

              <div className="space-y-2.5 text-xs text-velora-textMuted">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <p>
                    Take a piece of paper and write <strong className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/10">INTIMO</strong> and today&apos;s date (<strong className="text-amber-300 font-mono">{todayDateString}</strong>) in clear handwriting.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <p>
                    Hold the paper in front of you so your face and the handwritten text are clearly visible, then take a photo or selfie.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <p>
                    Upload the photo below. Our admin team will manually inspect it and issue your <strong className="text-emerald-300">Biometric Verified Badge</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Discretion Guarantee */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">100% Private & Discreet Guarantee</h4>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  Your verification photo is encrypted, stored in private storage, inspected strictly by platform administrators, and <strong>NEVER published publicly</strong> on your profile or search.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Upload Dropzone / Preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-amber-400/40 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center group relative overflow-hidden"
              >
                {previewUrl ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Verification selfie" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                        Click to Change Photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Click or tap to upload verification selfie</p>
                      <p className="text-[11px] text-velora-textMuted mt-0.5">Supports JPG, PNG, WEBP (Max 20MB)</p>
                    </div>
                    <Button type="button" variant="gold" size="sm" className="text-xs font-bold gap-1 mt-1">
                      <Camera className="w-3.5 h-3.5" /> Choose Verification Photo
                    </Button>
                  </>
                )}
              </div>

              {/* Live Upload Progress */}
              {uploadProgress !== null && (
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      Uploading directly to Cloudflare R2...
                    </span>
                    <span className="font-mono font-bold text-amber-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button variant="glass" size="lg" type="button" onClick={onClose} className="w-1/3 text-xs">
                  Cancel
                </Button>
                <Button
                  variant="gold"
                  size="lg"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 text-xs font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? "Uploading & Submitting..." : "Submit Verification Photo"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
