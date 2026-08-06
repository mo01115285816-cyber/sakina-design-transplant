// API request/response types for the server routes

export interface RecitersResponse {
  reciters: unknown[];
}

export interface ReflectionRequest {
  verseText: string;
  surahName: string;
  verseNumber: string | number;
  tafsirText?: string;
}

export interface ReflectionResponse {
  reflection: string;
}

export interface ApiError {
  error: string;
}
