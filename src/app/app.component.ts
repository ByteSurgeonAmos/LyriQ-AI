import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RapBotService } from './rap-bot.service';

interface Message {
  sender: 'user' | 'bot';
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  error?: boolean;
}

interface UploadedDoc {
  name: string;
  type: string;
  id: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  activeMode: 'sentiment' | 'chat' = 'chat';
  messageInput = '';
  selectedLanguage: 'en' | 'de' = 'en';
  messages: Message[] = [];
  uploadedDocs: UploadedDoc[] = [];
  currentSessionId: string | null = null;
  savedDocumentId: string | null = null;

  isLoading = {
    upload: false,
    message: false,
  };
  errors = {
    upload: null as string | null,
    message: null as string | null,
  };
  uploadProgress = 0;

  constructor(private rapBotService: RapBotService) {}

  setMode(mode: 'sentiment' | 'chat') {
    this.activeMode = mode;
    this.clearErrors();
    this.savedDocumentId = null;
    this.currentSessionId = null;
  }

  getInputPlaceholder(): string {
    return this.activeMode === 'sentiment'
      ? this.selectedLanguage === 'en'
        ? 'Enter lyrics to analyze...'
        : 'Geben Sie Songtexte zur Analyse ein...'
      : this.selectedLanguage === 'en'
      ? 'Ask questions about your documents...'
      : 'Stellen Sie Fragen zu Ihren Dokumenten...';
  }

  clearErrors() {
    this.errors.upload = null;
    this.errors.message = null;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  triggerFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.pdf';
    fileInput.multiple = true;
    fileInput.onchange = (e) => this.onFileSelect(e);
    fileInput.click();
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleFiles(files: FileList) {
    this.isLoading.upload = true;
    this.clearErrors();
    this.uploadProgress = 0;

    const validFiles = Array.from(files).filter(
      (file) => file.type === 'text/plain' || file.type === 'application/pdf'
    );

    if (validFiles.length === 0) {
      this.errors.upload = 'Please upload only TXT or PDF files.';
      this.isLoading.upload = false;
      return;
    }

    const totalFiles = validFiles.length;
    let completedFiles = 0;

    validFiles.forEach((file) => {
      this.rapBotService.uploadFile(file, file.name).subscribe({
        next: (response) => {
          const documentId = response.document_id;
          this.savedDocumentId = documentId; // Save document_id here for chat

          this.uploadedDocs.push({
            name: file.name,
            type: file.type,
            id: documentId,
          });

          const sentimentType =
            response.sentiment > 0.5 ? 'positive' : 'negative';
          this.messages.push({
            sender: 'bot',
            content: `Document uploaded successfully:
            Sentiment: ${sentimentType.toUpperCase()} (${(
              response.sentiment * 100
            ).toFixed(1)}%)
            Language: ${response.language.toUpperCase()}
            `,
            sentiment: sentimentType,
          });

          completedFiles++;
          this.uploadProgress = (completedFiles / totalFiles) * 100;

          if (completedFiles === totalFiles) {
            this.isLoading.upload = false;
            this.uploadProgress = 0;
          }
        },
        error: (error) => {
          this.errors.upload = `Error uploading ${file.name}: ${error.message}`;
          this.isLoading.upload = false;
        },
      });
    });
  }

  async sendMessage() {
    if (!this.messageInput.trim()) return;

    this.isLoading.message = true;
    this.clearErrors();

    const userMessage = this.messageInput;
    this.messages.push({ sender: 'user', content: userMessage });
    this.messageInput = '';

    if (this.activeMode === 'sentiment') {
      // Check if we need to start a new sentiment session or continue an existing one
      if (!this.currentSessionId) {
        if (!this.savedDocumentId) {
          this.rapBotService.uploadText(userMessage, '').subscribe({
            next: (response) => {
              this.savedDocumentId = response.document_id;
              const sentimentType =
                response.sentiment > 0.5 ? 'positive' : 'negative';
              this.messages.push({
                sender: 'bot',
                content: `Sentiment: ${sentimentType.toUpperCase()} (${(
                  response.sentiment * 100
                ).toFixed(1)}%)
              Language: ${response.language.toUpperCase()}
              `,
              });
              this.isLoading.message = false;
            },
            error: (error) => {
              this.messages.push({
                sender: 'bot',
                content:
                  'Sorry, I encountered an error analyzing the sentiment.',
                error: true,
              });
              this.errors.message = `Error: ${error.message}`;
              this.isLoading.message = false;
            },
          });
        } else {
          this.rapBotService
            .startNewChat(userMessage, this.savedDocumentId)
            .subscribe({
              next: (response) => {
                this.currentSessionId = response.session_id; // Save session_id for subsequent messages
                this.messages.push({
                  sender: 'bot',
                  content: `${response.response}

                  Response Sentiment: ${response.user_sentiment.sentiment},
                  `,
                  sentiment: response.sentiment,
                });
                this.isLoading.message = false;
              },
              error: (error) => {
                this.messages.push({
                  sender: 'bot',
                  content:
                    'Sorry, I encountered an error processing your message.',
                  error: true,
                });
                this.errors.message = `Error: ${error.message}`;
                this.isLoading.message = false;
              },
            });
        }
        // Start a new sentiment analysis session
      } else {
        // Continue the existing sentiment session
        this.rapBotService
          .continueChat(
            userMessage,
            this.currentSessionId,
            this.savedDocumentId!
          )
          .subscribe({
            next: (response) => {
              const sentimentType =
                response.user_sentiment.score > 0.5 ? 'positive' : 'negative';
              this.messages.push({
                sender: 'bot',
                content: `${response.response}
              Sentiment: ${sentimentType.toUpperCase()} (${(
                  response.user_sentiment.score * 100
                ).toFixed(1)}%)
              Language: ${response.language.toUpperCase()}
            `,
                sentiment: sentimentType,
              });
              this.isLoading.message = false;
            },
            error: (error) => {
              this.messages.push({
                sender: 'bot',
                content:
                  'Sorry, I encountered an error analyzing the sentiment.',
                error: true,
              });
              this.errors.message = `Error: ${error.message}`;
              this.isLoading.message = false;
            },
          });
      }
    } else if (this.activeMode === 'chat') {
      // Check if document_id exists; if not, prompt for document upload
      if (!this.savedDocumentId) {
        this.errors.message = 'Please upload a document first.';
        this.isLoading.message = false;
        return;
      }

      if (!this.currentSessionId) {
        // Start a new chat session using document_id
        this.rapBotService
          .startNewChat(userMessage, this.savedDocumentId)
          .subscribe({
            next: (response) => {
              this.currentSessionId = response.session_id; // Save session_id for subsequent messages
              this.messages.push({
                sender: 'bot',
                content: `${response.response}
                
                Response Sentiment: ${response.user_sentiment.sentiment}`,
                sentiment: response.sentiment,
              });
              this.isLoading.message = false;
            },
            error: (error) => {
              this.messages.push({
                sender: 'bot',
                content:
                  'Sorry, I encountered an error processing your message.',
                error: true,
              });
              this.errors.message = `Error: ${error.message}`;
              this.isLoading.message = false;
            },
          });
      } else {
        // Continue the existing chat session
        this.rapBotService
          .continueChat(
            userMessage,
            this.currentSessionId,
            this.savedDocumentId
          )
          .subscribe({
            next: (response) => {
              this.messages.push({
                sender: 'bot',
                content: response.response,
                sentiment: response.sentiment,
              });
              this.isLoading.message = false;
            },
            error: (error) => {
              this.messages.push({
                sender: 'bot',
                content:
                  'Sorry, I encountered an error processing your message.',
                error: true,
              });
              this.errors.message = `Error: ${error.message}`;
              this.isLoading.message = false;
            },
          });
      }
    }
  }

  removeDocument(docIndex: number) {
    const docToRemove = this.uploadedDocs[docIndex];
    this.rapBotService.deleteSession(docToRemove.id).subscribe(() => {
      this.uploadedDocs.splice(docIndex, 1);
      if (this.uploadedDocs.length === 0) {
        this.currentSessionId = null;
        this.savedDocumentId = null; // Clear savedDocumentId if no documents remain
      }
    });
  }
}
