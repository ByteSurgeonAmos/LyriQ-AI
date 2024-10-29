# RAP-B SERVER

**Description**: A Python server for handling document uploads, querying, and conversational AI, allowing users to chat with uploaded documents. This project utilizes Django, Django REST framework, ChromaDB, and Hugging Face models.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Running the Server](#running-the-server)
5. [API Endpoints](#api-endpoints)
6. [Usage](#usage)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

### Prerequisites

Ensure you have the following installed:

- **Python** 3.8 or higher
- **pip** (Python package manager)
- **virtualenv** (recommended for creating a virtual environment)
- **Git** for version control

---

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Create and activate a virtual environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate  # On Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

### Environment Variables

Create a `.env` file in the project root directory to store your environment variables. Here’s a sample configuration:

```env
DEBUG=True
SECRET_KEY=top-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:4200
DATABASE_URL=sqlite:///db.sqlite3
MEDIA_ROOT=media/
CHROMA_DB_DIR=chroma_db/
```

---

### Running the Server

1. **Apply migrations**:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

The server will be running at `http://127.0.0.1:8000/`.

---

### API Endpoints

Here are the main endpoints:

- **`POST /upload/`**: Upload a document for processing.

  - **Request**: `file` (form-data)
  - **Response**: Document details, including sentiment and language information.

- **`POST /chat/`**: Start a chat session or query with a specific document.

  - **Request**:
    ```json
    {
      "session_id": "your-session-id",
      "message": "Your question here",
      "document_id": "document-id" // Optional if current document is set
    }
    ```
  - **Response**: Chat response with generated text and sentiment information.

- **`GET /chat-history/{session_id}/`**: Retrieve chat history for a specific session.

---

### Usage

1. **Upload Documents**:
   Use a tool like **Postman** or `curl` to upload documents to the server at `POST /upload/`.

2. **Start Chatting**:
   After uploading documents, you can start chatting with the document via `POST /chat/`. Specify the `document_id` if you want to refer to a specific document.

3. **Switch Documents in a Session**:
   Provide a different `document_id` in the `/chat/` request to switch between documents within the same session.

---

### Testing

1. **Running Tests**:
   To run tests, use the Django testing command:

   ```bash
   python manage.py test
   ```

2. **Testing Individual Endpoints**:
   Use **Postman** or `curl` to verify that each endpoint works as expected. Example `curl` commands are provided below:

   - **Upload a document**:

     ```bash
     curl -F "file=@/path/to/your/document.txt" http://127.0.0.1:8000/upload/
     ```

   - **Chat with the document**:
     ```bash
     curl -X POST -H "Content-Type: application/json" -d '{"session_id": "your-session-id", "message": "Summarize the document"}' http://127.0.0.1:8000/chat/
     ```

---

### Troubleshooting

- **Server Won't Start**:

  - Ensure all environment variables are correctly set in `.env`.
  - Confirm all dependencies are installed with `pip install -r requirements.txt`.

- **File Upload Issues**:

  - Check file permissions for the `documents/` directory.
  - Ensure the uploaded file type is supported by the server.

- **Missing Dependencies**:
  - Run `pip install -r requirements.txt` to make sure all necessary packages are installed.
