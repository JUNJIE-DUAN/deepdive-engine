# YouTube Subtitle Export Feature - Implementation Guide

## Overview

This feature enables users to export YouTube video subtitles to PDF with bilingual support (English + Chinese). The implementation includes backend APIs, PDF generation, and frontend React components.

## Project Structure

```
deepdive-engine/
├── backend/src/modules/youtube/
│   ├── youtube.module.ts              # Module definition
│   ├── youtube.controller.ts          # API endpoints
│   ├── youtube.service.ts             # Subtitle fetching service (existing)
│   ├── pdf-generator.service.ts       # NEW: PDF generation service
│   └── README.md                      # Backend documentation
│
└── frontend/
    ├── components/youtube/
    │   ├── subtitle-export-button.tsx # NEW: Export button component
    │   ├── export-dialog.tsx          # NEW: Export options dialog
    │   ├── index.ts                   # Component exports
    │   └── README.md                  # Frontend documentation
    │
    └── hooks/
        └── useYoutubeSubtitleExport.ts # NEW: Custom hook for export
```

## Installation

### 1. Backend Dependencies

```bash
cd backend
npm install pdfkit @types/pdfkit
```

Dependencies installed:
- `pdfkit`: PDF document generation
- `@types/pdfkit`: TypeScript type definitions

### 2. Verify Installation

All TypeScript types are correctly configured and the backend passes type checking.

## API Endpoints

### Base URL
```
http://localhost:4000/api/v1/youtube
```

### 1. Get Single Language Transcript

```http
GET /transcript/:videoId
```

**Example:**
```bash
curl http://localhost:4000/api/v1/youtube/transcript/dQw4w9WgXcQ
```

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "transcript": [
    {
      "text": "Subtitle text",
      "start": 0.0,
      "duration": 2.5
    }
  ]
}
```

### 2. Get Bilingual Subtitles (Aligned)

```http
POST /subtitles
Content-Type: application/json
```

**Request Body:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "english": [
    {
      "text": "English subtitle",
      "start": 0.0,
      "duration": 2.5
    }
  ],
  "chinese": [
    {
      "text": "中文字幕",
      "start": 0.0,
      "duration": 2.5
    }
  ]
}
```

### 3. Export to PDF

```http
POST /export-pdf
Content-Type: application/json
```

**Request Body:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "englishSubtitles": [...],
  "chineseSubtitles": [...],
  "options": {
    "format": "bilingual-side",
    "includeTimestamps": true,
    "includeVideoUrl": true,
    "includeMetadata": true
  }
}
```

**Response:**
- PDF file download (application/pdf)
- Filename: `youtube-subtitles-{videoId}.pdf`

## Frontend Integration

### Basic Usage

```tsx
import { SubtitleExportButton } from '@/components/youtube';

export default function VideoPage() {
  const videoId = 'dQw4w9WgXcQ';

  return (
    <div>
      <h1>Video Player</h1>
      {/* Your video player component */}

      {/* Export button */}
      <SubtitleExportButton videoId={videoId} />
    </div>
  );
}
```

### Advanced Usage with Custom Hook

```tsx
import { useYoutubeSubtitleExport, ExportOptions } from '@/hooks/useYoutubeSubtitleExport';
import { useState } from 'react';

export default function CustomExport() {
  const { isLoading, error, fetchSubtitles, exportPdf } = useYoutubeSubtitleExport();
  const [videoId] = useState('dQw4w9WgXcQ');

  const handleExport = async () => {
    // Fetch subtitles
    const subtitles = await fetchSubtitles(videoId);

    if (subtitles) {
      // Export to PDF
      const options: ExportOptions = {
        format: 'bilingual-side',
        includeTimestamps: true,
        includeVideoUrl: true,
        includeMetadata: true
      };

      await exportPdf(
        subtitles.videoId,
        subtitles.title,
        subtitles.english,
        subtitles.chinese,
        options
      );
    }
  };

  return (
    <div>
      <button onClick={handleExport} disabled={isLoading}>
        {isLoading ? 'Exporting...' : 'Export Subtitles'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

### Button Variants

```tsx
// Primary button (default)
<SubtitleExportButton videoId={videoId} variant="primary" />

// Secondary button
<SubtitleExportButton videoId={videoId} variant="secondary" />

// Icon-only button
<SubtitleExportButton videoId={videoId} variant="icon" />

// Positioned in top-right corner
<SubtitleExportButton
  videoId={videoId}
  variant="icon"
  position="top-right"
/>
```

## Export Format Options

### 1. Bilingual Side-by-Side
- English and Chinese in parallel columns
- Best for comparison and language learning
- Format: `bilingual-side`

### 2. Bilingual Stacked
- English and Chinese one after another
- Good for reading flow
- Format: `bilingual-stack`

### 3. English Only
- Only English subtitles
- Cleaner single-language format
- Format: `english-only`

### 4. Chinese Only
- Only Chinese subtitles
- Single-language format
- Format: `chinese-only`

## Features

### Backend Features
- ✅ Multiple subtitle providers with automatic fallback
  - Primary: youtubei.js
  - Secondary: youtube-transcript npm package
  - Tertiary: External API fallback
- ✅ Bilingual subtitle alignment by timestamp
- ✅ PDF generation with multiple format options
- ✅ Metadata inclusion (title, URL, export date)
- ✅ Timestamp support
- ✅ Page numbering
- ✅ Error handling and logging

### Frontend Features
- ✅ React components with TypeScript
- ✅ Custom hook for state management
- ✅ Multiple button variants (primary, secondary, icon)
- ✅ Configurable positioning (inline, top-right)
- ✅ Export options dialog
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Retry functionality
- ✅ Responsive design
- ✅ Tailwind CSS styling

## Testing

### Backend Testing

1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Test single transcript endpoint:**
```bash
curl http://localhost:4000/api/v1/youtube/transcript/dQw4w9WgXcQ
```

3. **Test bilingual subtitles:**
```bash
curl -X POST http://localhost:4000/api/v1/youtube/subtitles \
  -H "Content-Type: application/json" \
  -d '{"videoId":"dQw4w9WgXcQ"}'
```

4. **Test PDF export (save to file):**
```bash
curl -X POST http://localhost:4000/api/v1/youtube/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "videoId":"dQw4w9WgXcQ",
    "title":"Test Video",
    "englishSubtitles":[{"text":"Hello","start":0,"duration":2}],
    "chineseSubtitles":[{"text":"你好","start":0,"duration":2}],
    "options":{
      "format":"bilingual-side",
      "includeTimestamps":true,
      "includeVideoUrl":true,
      "includeMetadata":true
    }
  }' \
  --output test.pdf
```

### Frontend Testing

1. **Import and use the component:**
```tsx
import { SubtitleExportButton } from '@/components/youtube';

<SubtitleExportButton videoId="dQw4w9WgXcQ" />
```

2. **Test different variants:**
- Click the export button
- Configure export options in the dialog
- Verify PDF download
- Test error states (invalid video ID)
- Test loading states

## Error Handling

### Backend Errors
- `400 Bad Request`: Invalid video ID or missing required fields
- `404 Not Found`: Video not found or subtitles unavailable
- `500 Internal Server Error`: PDF generation or service errors

### Frontend Error Handling
- Network errors: Toast notification with retry button
- Subtitle fetch errors: Error message in dialog
- PDF export errors: Toast notification
- Invalid video ID: Backend validation error

## Configuration

### Environment Variables

**Backend:** (optional - uses defaults)
No additional environment variables required.

**Frontend:** `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## TypeScript Support

All components and hooks are fully typed:

```typescript
// Export options type
interface ExportOptions {
  format: 'bilingual-side' | 'bilingual-stack' | 'english-only' | 'chinese-only';
  includeTimestamps: boolean;
  includeVideoUrl: boolean;
  includeMetadata: boolean;
}

// Subtitle segment type
interface SubtitleSegment {
  text: string;
  start: number;
  duration: number;
}

// Bilingual subtitles type
interface BilingualSubtitles {
  videoId: string;
  title: string;
  url: string;
  english: SubtitleSegment[];
  chinese: SubtitleSegment[];
}
```

## Code Quality

### Backend
- ✅ TypeScript strict mode enabled
- ✅ Type checking passes without errors
- ✅ Proper error handling with try-catch blocks
- ✅ Logging with NestJS Logger
- ✅ Dependency injection
- ✅ Module separation

### Frontend
- ✅ TypeScript with proper types
- ✅ React hooks best practices
- ✅ Error boundaries
- ✅ Loading states
- ✅ Accessibility (ARIA labels)
- ✅ Responsive design

## Next Steps

1. **Integration:** Add the SubtitleExportButton to your video player pages
2. **Styling:** Customize button styles using the className prop
3. **Testing:** Test with various YouTube videos
4. **Monitoring:** Monitor backend logs for subtitle fetch performance
5. **Enhancement:** Consider adding more export formats (TXT, SRT, VTT)

## Troubleshooting

### "Subtitles not available" error
- The video may not have subtitles enabled
- Try a different video with confirmed subtitles
- Check backend logs for detailed error messages

### PDF generation fails
- Verify pdfkit is installed: `npm list pdfkit`
- Check backend logs for specific errors
- Ensure sufficient disk space

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check backend is running on port 4000
- Verify CORS settings in backend

## Support Files Created

1. **Backend:**
   - `backend/src/modules/youtube/pdf-generator.service.ts`
   - `backend/src/modules/youtube/youtube.controller.ts` (updated)
   - `backend/src/modules/youtube/youtube.module.ts` (updated)
   - `backend/src/modules/youtube/README.md`

2. **Frontend:**
   - `frontend/components/youtube/subtitle-export-button.tsx`
   - `frontend/components/youtube/export-dialog.tsx`
   - `frontend/components/youtube/index.ts`
   - `frontend/components/youtube/README.md`
   - `frontend/hooks/useYoutubeSubtitleExport.ts`

All files are production-ready with:
- Complete TypeScript typing
- Error handling
- Logging
- Documentation
- Clean, maintainable code
