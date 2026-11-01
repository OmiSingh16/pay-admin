"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function LogoUploader() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logo from localStorage on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem("payorbit_logo");
    if (savedLogo) setLogo(savedLogo);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast("File too large. Max 1MB allowed.");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      localStorage.setItem("payorbit_logo", base64);
      setLogo(base64);
      
      // Dispatch custom event taaki sidebar turant update ho jaye
      window.dispatchEvent(new Event("logoUpdated"));
      toast("Logo updated successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    localStorage.removeItem("payorbit_logo");
    setLogo(null);
    window.dispatchEvent(new Event("logoUpdated"));
    toast("Logo removed");
  };

  return (
    <div className="bg-[var(--panel)] rounded-[var(--r)] p-6">
      <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Brand Logo
      </h3>
      
      <div className="flex items-center gap-4">
        {/* Current Logo Preview */}
        <div className="w-[60px] h-[60px] rounded-[14px] bg-[var(--panel-2)] grid place-items-center overflow-hidden shrink-0 border border-[var(--line)]">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[var(--ink-2)] text-xs font-bold">No Logo</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[var(--navy)] text-white font-bold text-sm hover:bg-[var(--navy-2)] transition-colors"
          >
            Upload New
          </button>
          
          {logo && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] font-bold text-sm hover:bg-[var(--bad)] hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--ink-2)] mt-3">Recommended: Square image, max 1MB. Logo is saved locally in your browser.</p>
    </div>
  );
}