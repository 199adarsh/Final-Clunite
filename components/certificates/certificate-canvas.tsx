'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { loadCertificateFonts } from './fonts';

export interface CertificateConfig {
  recipientName: string;
  fontFamily: string;
  fontSize: number; // in pt (1 - 200)
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  letterSpacing: number; // -5 to 20
  uppercase: boolean;
  
  // Secondary metadata
  showDate: boolean;
  dateText: string;
  dateXPercent: number;
  dateYPercent: number;
  dateFontSize: number;
  dateColor: string;

  showCertCode: boolean;
  certCodeText: string;
  certCodeXPercent: number;
  certCodeYPercent: number;
  certCodeFontSize: number;
  certCodeColor: string;
}

export interface CertificateCanvasRef {
  exportPNG: (quality?: number) => Promise<string>;
  exportBlob: (quality?: number) => Promise<Blob | null>;
  renderForRecipient: (name: string, certCode?: string) => Promise<Blob | null>;
}

interface CertificateCanvasProps {
  templateUrl: string;
  config: CertificateConfig;
  onChangeConfig?: (newConfig: Partial<CertificateConfig>) => void;
  showGuides?: boolean;
  activeField?: 'name' | 'date' | 'code';
  readOnly?: boolean;
}

export const CertificateCanvas = forwardRef<CertificateCanvasRef, CertificateCanvasProps>(
  ({ templateUrl, config, onChangeConfig, showGuides = true, activeField = 'name', readOnly = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const bgImageRef = useRef<HTMLImageElement | null>(null);

    // Native design resolution (1080p canvas)
    const nativeWidth = 1920;
    const nativeHeight = 1080;

    useEffect(() => {
      loadCertificateFonts();
    }, []);

    // Load template image
    useEffect(() => {
      if (!templateUrl) return;
      const img = new Image();
      if (!templateUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        bgImageRef.current = img;
        setImageLoaded(true);
      };
      img.onerror = (err) => {
        console.warn('Certificate template load warning:', err);
      };
      img.src = templateUrl;
    }, [templateUrl]);

    // Draw canvas function
    const drawCanvas = (
      ctx: CanvasRenderingContext2D,
      recipientName = config.recipientName,
      certCode = config.certCodeText,
      drawOverlayGuides = showGuides && !readOnly
    ) => {
      ctx.clearRect(0, 0, nativeWidth, nativeHeight);

      // 1. Draw background template
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, nativeWidth, nativeHeight);
      } else {
        // Fallback placeholder
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, nativeWidth, nativeHeight);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, nativeWidth - 80, nativeHeight - 80);
      }

      // 2. Draw Recipient Name
      if (recipientName) {
        ctx.save();
        const fontStyle = config.italic ? 'italic ' : '';
        const fontWeight = config.bold ? 'bold ' : 'normal ';
        const fontFam = config.fontFamily || "'Great Vibes', cursive";
        // Convert pt to canvas px (1pt ≈ 1.333px at standard 96dpi, scaled for 1080p canvas)
        const pixelSize = Math.round(config.fontSize * 1.6);

        ctx.font = `${fontStyle}${fontWeight}${pixelSize}px ${fontFam}`;
        ctx.fillStyle = config.color || '#0f172a';
        ctx.textAlign = config.align;
        ctx.textBaseline = 'middle';

        const nameX = (config.xPercent / 100) * nativeWidth;
        const nameY = (config.yPercent / 100) * nativeHeight;
        const textToDraw = config.uppercase ? recipientName.toUpperCase() : recipientName;

        ctx.fillText(textToDraw, nameX, nameY);

        // Visual guide box if guides enabled
        if (drawOverlayGuides) {
          const metrics = ctx.measureText(textToDraw);
          const textWidth = metrics.width;
          const textHeight = pixelSize;

          let boxLeft = nameX;
          if (config.align === 'center') boxLeft = nameX - textWidth / 2;
          if (config.align === 'right') boxLeft = nameX - textWidth;

          // Bounding box
          ctx.strokeStyle = activeField === 'name' ? '#6366f1' : '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(boxLeft - 12, nameY - textHeight / 2 - 8, textWidth + 24, textHeight + 16);

          // Center crosshair marker
          ctx.setLineDash([]);
          ctx.strokeStyle = activeField === 'name' ? '#4f46e5' : '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(nameX - 14, nameY);
          ctx.lineTo(nameX + 14, nameY);
          ctx.moveTo(nameX, nameY - 14);
          ctx.lineTo(nameX, nameY + 14);
          ctx.stroke();

          // Alignment label
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.textAlign = 'left';
          ctx.fillText(`Recipient Name (${config.xPercent.toFixed(1)}%, ${config.yPercent.toFixed(1)}%)`, boxLeft - 10, nameY - textHeight / 2 - 16);
        }

        ctx.restore();
      }

      // 3. Draw Date
      if (config.showDate && config.dateText) {
        ctx.save();
        const datePixelSize = Math.round((config.dateFontSize || 16) * 1.6);
        ctx.font = `bold ${datePixelSize}px 'Inter', sans-serif`;
        ctx.fillStyle = config.dateColor || '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const dateX = (config.dateXPercent / 100) * nativeWidth;
        const dateY = (config.dateYPercent / 100) * nativeHeight;
        ctx.fillText(config.dateText, dateX, dateY);

        if (drawOverlayGuides && activeField === 'date') {
          const m = ctx.measureText(config.dateText);
          const boxWidth = m.width + 24;
          const boxHeight = datePixelSize + 16;

          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(dateX - boxWidth / 2, dateY - boxHeight / 2, boxWidth, boxHeight);

          // Crosshairs
          ctx.setLineDash([]);
          ctx.strokeStyle = '#4f46e5';
          ctx.beginPath();
          ctx.moveTo(dateX - 12, dateY);
          ctx.lineTo(dateX + 12, dateY);
          ctx.moveTo(dateX, dateY - 12);
          ctx.lineTo(dateX, dateY + 12);
          ctx.stroke();

          // Alignment label
          ctx.font = 'bold 15px Inter, sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.textAlign = 'center';
          ctx.fillText(`Date (${config.dateXPercent.toFixed(1)}%, ${config.dateYPercent.toFixed(1)}%)`, dateX, dateY - boxHeight / 2 - 12);
        }
        ctx.restore();
      }

      // 4. Draw Certificate Code
      if (config.showCertCode && certCode) {
        ctx.save();
        const codePixelSize = Math.round((config.certCodeFontSize || 16) * 1.6);
        ctx.font = `bold ${codePixelSize}px monospace`;
        ctx.fillStyle = config.certCodeColor || '#b45309';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const codeX = (config.certCodeXPercent / 100) * nativeWidth;
        const codeY = (config.certCodeYPercent / 100) * nativeHeight;
        const textToDraw = `ID: ${certCode}`;
        ctx.fillText(textToDraw, codeX, codeY);

        if (drawOverlayGuides && activeField === 'code') {
          const m = ctx.measureText(textToDraw);
          const boxWidth = m.width + 24;
          const boxHeight = codePixelSize + 16;

          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(codeX - boxWidth / 2, codeY - boxHeight / 2, boxWidth, boxHeight);

          // Crosshairs
          ctx.setLineDash([]);
          ctx.strokeStyle = '#4f46e5';
          ctx.beginPath();
          ctx.moveTo(codeX - 12, codeY);
          ctx.lineTo(codeX + 12, codeY);
          ctx.moveTo(codeX, codeY - 12);
          ctx.lineTo(codeX, codeY + 12);
          ctx.stroke();

          // Alignment label
          ctx.font = 'bold 15px Inter, sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.textAlign = 'center';
          ctx.fillText(`Code (${config.certCodeXPercent.toFixed(1)}%, ${config.certCodeYPercent.toFixed(1)}%)`, codeX, codeY - boxHeight / 2 - 12);
        }
        ctx.restore();
      }
    };

    // Redraw whenever template or config changes
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawCanvas(ctx);
    }, [config, imageLoaded, showGuides, activeField, readOnly]);

    // Handle mouse/touch coordinate interaction
    const handleCoordinateEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly || !onChangeConfig) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const xPercent = Math.max(0, Math.min(100, Number(((clickX / rect.width) * 100).toFixed(1))));
      const yPercent = Math.max(0, Math.min(100, Number(((clickY / rect.height) * 100).toFixed(1))));

      if (activeField === 'name') {
        onChangeConfig({ xPercent, yPercent });
      } else if (activeField === 'date') {
        onChangeConfig({ dateXPercent: xPercent, dateYPercent: yPercent });
      } else if (activeField === 'code') {
        onChangeConfig({ certCodeXPercent: xPercent, certCodeYPercent: yPercent });
      }
    };

    // Expose export methods
    useImperativeHandle(ref, () => ({
      exportPNG: async (quality = 1.0) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = nativeWidth;
        offscreen.height = nativeHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return '';
        drawCanvas(ctx, config.recipientName, config.certCodeText, false);
        return offscreen.toDataURL('image/png', quality);
      },
      exportBlob: async (quality = 1.0) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = nativeWidth;
        offscreen.height = nativeHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;
        drawCanvas(ctx, config.recipientName, config.certCodeText, false);
        return new Promise<Blob | null>((resolve) => {
          offscreen.toBlob((blob) => resolve(blob), 'image/png', quality);
        });
      },
      renderForRecipient: async (name: string, certCode = config.certCodeText) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = nativeWidth;
        offscreen.height = nativeHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;
        drawCanvas(ctx, name, certCode, false);
        return new Promise<Blob | null>((resolve) => {
          offscreen.toBlob((blob) => resolve(blob), 'image/png', 0.95);
        });
      },
    }));

    return (
      <div ref={containerRef} className="relative w-full aspect-[16/9] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 group">
        <canvas
          ref={canvasRef}
          width={nativeWidth}
          height={nativeHeight}
          onClick={handleCoordinateEvent}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleCoordinateEvent(e);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleCoordinateEvent(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`w-full h-full object-contain ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
        />

        {/* Live Coordinate Pill Badge */}
        {!readOnly && (
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Target: {activeField === 'name' ? 'Recipient Name' : activeField === 'date' ? 'Date' : 'Cert Code'}</span>
            <span className="text-slate-400">|</span>
            <span>X: {activeField === 'name' ? config.xPercent : activeField === 'date' ? config.dateXPercent : config.certCodeXPercent}%</span>
            <span>Y: {activeField === 'name' ? config.yPercent : activeField === 'date' ? config.dateYPercent : config.certCodeYPercent}%</span>
          </div>
        )}
      </div>
    );
  }
);

CertificateCanvas.displayName = 'CertificateCanvas';
