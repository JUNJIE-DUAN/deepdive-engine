import { Injectable, Logger } from "@nestjs/common";
import * as PDFDocument from "pdfkit";
import { TranscriptSegment } from "./youtube.service";

export interface SubtitleExportOptions {
  format:
    | "bilingual-side"
    | "bilingual-stack"
    | "english-only"
    | "chinese-only";
  includeTimestamps: boolean;
  includeVideoUrl: boolean;
  includeMetadata: boolean;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  url: string;
  exportDate: Date;
}

export interface BilingualTranscript {
  english: TranscriptSegment[];
  chinese: TranscriptSegment[];
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Generate PDF from subtitles
   * @param transcript Bilingual transcript data
   * @param metadata Video metadata
   * @param options Export options
   * @returns PDF document stream
   */
  generatePdf(
    transcript: BilingualTranscript,
    metadata: VideoMetadata,
    options: SubtitleExportOptions,
  ): PDFKit.PDFDocument {
    this.logger.log(`Generating PDF for video: ${metadata.videoId}`);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    // Add metadata
    if (options.includeMetadata) {
      this.addMetadataSection(doc, metadata, options.includeVideoUrl);
      doc.moveDown(2);
    }

    // Add subtitles based on format
    switch (options.format) {
      case "bilingual-side":
        this.addBilingualSideBySide(doc, transcript, options.includeTimestamps);
        break;
      case "bilingual-stack":
        this.addBilingualStacked(doc, transcript, options.includeTimestamps);
        break;
      case "english-only":
        this.addSingleLanguage(
          doc,
          transcript.english,
          "English",
          options.includeTimestamps,
        );
        break;
      case "chinese-only":
        this.addSingleLanguage(
          doc,
          transcript.chinese,
          "Chinese",
          options.includeTimestamps,
        );
        break;
    }

    // Add page numbers
    this.addPageNumbers(doc);

    // Finalize the PDF
    doc.end();

    return doc as PDFKit.PDFDocument;
  }

  /**
   * Add metadata section to PDF
   */
  private addMetadataSection(
    doc: PDFKit.PDFDocument,
    metadata: VideoMetadata,
    includeUrl: boolean,
  ): void {
    doc
      .fontSize(18)
      .font("Helvetica")
      .text(metadata.title, { align: "center" });

    doc.moveDown(0.5);

    if (includeUrl) {
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("blue")
        .text(metadata.url, {
          align: "center",
          link: metadata.url,
          underline: true,
        })
        .fillColor("black");

      doc.moveDown(0.3);
    }

    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text(`Exported on: ${metadata.exportDate.toLocaleString()}`, {
        align: "center",
      })
      .text(`Video ID: ${metadata.videoId}`, { align: "center" });

    doc.moveDown(0.5);
    doc
      .strokeColor("#cccccc")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
  }

  /**
   * Add bilingual subtitles side by side
   */
  private addBilingualSideBySide(
    doc: PDFKit.PDFDocument,
    transcript: BilingualTranscript,
    includeTimestamps: boolean,
  ): void {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bilingual Transcript", { align: "center" });
    doc.moveDown(1);

    const pageWidth = doc.page.width - 100; // Account for margins
    const columnWidth = pageWidth / 2 - 10;
    const leftX = 50;
    const rightX = 50 + columnWidth + 20;

    // Header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("English", leftX, doc.y, { width: columnWidth, continued: false });

    // Chinese header - use separate line with Helvetica
    doc
      .font("Helvetica-Bold")
      .text("Chinese", rightX, doc.y - 12, { width: columnWidth });

    doc.moveDown(0.5);

    const maxLength = Math.max(
      transcript.english.length,
      transcript.chinese.length,
    );

    for (let i = 0; i < maxLength; i++) {
      const english = transcript.english[i];
      const chinese = transcript.chinese[i];

      // Check if we need a new page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      const startY = doc.y;

      // English column
      if (english) {
        doc.font("Helvetica").fontSize(9);
        if (includeTimestamps) {
          doc
            .fillColor("#666666")
            .text(this.formatTimestamp(english.start), leftX, startY, {
              width: columnWidth,
            });
        }
        doc
          .fillColor("black")
          .fontSize(10)
          .text(english.text, leftX, doc.y, { width: columnWidth });
      }

      const englishEndY = doc.y;

      // Chinese column
      if (chinese) {
        doc.font("Helvetica").fontSize(9);
        if (includeTimestamps) {
          doc
            .fillColor("#666666")
            .text(this.formatTimestamp(chinese.start), rightX, startY, {
              width: columnWidth,
            });
        }
        doc
          .fillColor("black")
          .fontSize(10)
          .text(this.sanitizeTextForPdf(chinese.text), rightX, doc.y, {
            width: columnWidth,
          });
      }

      const chineseEndY = doc.y;

      // Move to the maximum Y position
      doc.y = Math.max(englishEndY, chineseEndY);
      doc.moveDown(0.5);
    }
  }

  /**
   * Add bilingual subtitles stacked (one after another)
   */
  private addBilingualStacked(
    doc: PDFKit.PDFDocument,
    transcript: BilingualTranscript,
    includeTimestamps: boolean,
  ): void {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bilingual Transcript", { align: "center" });
    doc.moveDown(1);

    const maxLength = Math.max(
      transcript.english.length,
      transcript.chinese.length,
    );

    for (let i = 0; i < maxLength; i++) {
      const english = transcript.english[i];
      const chinese = transcript.chinese[i];

      // Check if we need a new page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      if (includeTimestamps && (english || chinese)) {
        const timestamp = english ? english.start : chinese.start;
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#666666")
          .text(this.formatTimestamp(timestamp));
      }

      if (english) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("black")
          .text(`EN: ${english.text}`);
      }

      if (chinese) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#333333")
          .text(`Chinese: ${this.sanitizeTextForPdf(chinese.text)}`);
      }

      doc.moveDown(0.8);
    }
  }

  /**
   * Add single language subtitles
   */
  private addSingleLanguage(
    doc: PDFKit.PDFDocument,
    segments: TranscriptSegment[],
    language: string,
    includeTimestamps: boolean,
  ): void {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`${language} Transcript`, { align: "center" });
    doc.moveDown(1);

    for (const segment of segments) {
      // Check if we need a new page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      if (includeTimestamps) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#666666")
          .text(this.formatTimestamp(segment.start));
      }

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("black")
        .text(
          language === "Chinese"
            ? this.sanitizeTextForPdf(segment.text)
            : segment.text,
        );

      doc.moveDown(0.5);
    }
  }

  /**
   * Add page numbers to all pages
   */
  private addPageNumbers(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      const pageNumber = i + 1;
      const totalPages = range.count;

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#999999")
        .text(`Page ${pageNumber} of ${totalPages}`, 50, doc.page.height - 30, {
          align: "center",
        });
    }
  }

  /**
   * Format timestamp in HH:MM:SS format
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `[${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}]`;
    }
    return `[${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}]`;
  }

  /**
   * Sanitize text for PDF rendering with limited font support
   * PDFKit standard fonts don't support Chinese/CJK characters
   * Replace them with a placeholder to prevent garbled output
   */
  private sanitizeTextForPdf(text: string): string {
    if (!text) return text;

    // Check if text contains non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(text);

    if (hasNonAscii) {
      // Text contains non-ASCII characters (likely Chinese/CJK)
      // PDFKit standard fonts don't support these, so return placeholder
      return "[Chinese text - Font not supported in PDF]";
    }

    return text;
  }

  /**
   * Align bilingual transcripts by timestamp
   * @param english English transcript segments
   * @param chinese Chinese transcript segments
   * @returns Aligned bilingual transcript
   */
  alignTranscripts(
    english: TranscriptSegment[],
    chinese: TranscriptSegment[],
  ): BilingualTranscript {
    this.logger.log(
      `Aligning transcripts: EN=${english.length}, ZH=${chinese.length}`,
    );

    // Simple alignment based on timestamps
    const aligned: BilingualTranscript = {
      english: [],
      chinese: [],
    };

    let enIndex = 0;
    let zhIndex = 0;

    while (enIndex < english.length || zhIndex < chinese.length) {
      const enSeg = english[enIndex];
      const zhSeg = chinese[zhIndex];

      if (!enSeg && zhSeg) {
        // Only Chinese left
        aligned.english.push({
          text: "",
          start: zhSeg.start,
          duration: zhSeg.duration,
        });
        aligned.chinese.push(zhSeg);
        zhIndex++;
      } else if (enSeg && !zhSeg) {
        // Only English left
        aligned.english.push(enSeg);
        aligned.chinese.push({
          text: "",
          start: enSeg.start,
          duration: enSeg.duration,
        });
        enIndex++;
      } else if (enSeg && zhSeg) {
        // Both available - align by closest timestamp
        const timeDiff = Math.abs(enSeg.start - zhSeg.start);

        if (timeDiff < 1.0) {
          // Close enough - pair them
          aligned.english.push(enSeg);
          aligned.chinese.push(zhSeg);
          enIndex++;
          zhIndex++;
        } else if (enSeg.start < zhSeg.start) {
          // English comes first
          aligned.english.push(enSeg);
          aligned.chinese.push({
            text: "",
            start: enSeg.start,
            duration: enSeg.duration,
          });
          enIndex++;
        } else {
          // Chinese comes first
          aligned.english.push({
            text: "",
            start: zhSeg.start,
            duration: zhSeg.duration,
          });
          aligned.chinese.push(zhSeg);
          zhIndex++;
        }
      }
    }

    this.logger.log(`Alignment complete: ${aligned.english.length} pairs`);
    return aligned;
  }
}
