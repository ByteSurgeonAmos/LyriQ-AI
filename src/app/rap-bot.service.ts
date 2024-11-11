import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ChatRequest {
  message: string;
  document_id?: string;
  session_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RapBotService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // 1. Upload Text
  uploadText(text: string, title: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { text, title };

    return this.http.post(`${this.baseUrl}/api/upload/`, body, { headers });
  }

  // 2. Upload File
  uploadFile(file: File, title: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    return this.http.post(`${this.baseUrl}/api/upload/`, formData);
  }

  // 3. Start New Chat
  startNewChat(message: string, documentId?: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body: ChatRequest = { message, document_id: documentId };

    return this.http.post(`${this.baseUrl}/api/chat/`, body, { headers });
  }

  // 4. Continue Chat
  continueChat(
    message: string,
    sessionId: string,
    document_id: string
  ): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body: ChatRequest = { message, session_id: sessionId, document_id };

    return this.http.post(`${this.baseUrl}/api/chat/`, body, { headers });
  }

  // 5. Get All Sessions
  getAllSessions(page: number, pageSize: number): Observable<any> {
    const params = { page: page.toString(), page_size: pageSize.toString() };
    return this.http.get(`${this.baseUrl}/api/chat/history/`, { params });
  }

  // 6. Get Session History
  getSessionHistory(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/chat/history/${sessionId}/`);
  }

  // 7. Delete Session
  deleteSession(sessionId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/chat/history/${sessionId}/`);
  }

  // 8. Update Session
  updateSession(
    sessionId: string,
    title: string,
    documentId: string
  ): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { title, document_id: documentId };

    return this.http.patch(
      `${this.baseUrl}/api/chat/history/${sessionId}/`,
      body,
      { headers }
    );
  }
}
