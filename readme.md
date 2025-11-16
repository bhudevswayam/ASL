# SignSync
### Your personal AI interpreter, translating ASL to speech in real-time.

![SignSync in action](https://via.placeholder.com/800x400.png?text=PLACEHOLDER:+Add+a+GIF+of+SignSync+here)

**SignSync** is a full-stack web application that bridges the communication gap by translating live ASL fingerspelling into natural, spoken sentences. It uses a custom-trained gesture model, a secure backend, and the Google Gemini AI to create a seamless, two-way conversation.

---

## 🚀 Core Features

* **Live ASL Recognition:** Uses your webcam and a **MediaPipe** gesture model to recognize ASL alphabet signs in real-time.
* **AI Sentence Generation:** Translates raw, fingerspelled words (e.g., "BATHROOM WHERE") into full, polite sentences (e.g., "Could you please tell me where the bathroom is?") using the **Google Gemini API**.
* **Two-Way Conversation:**
    * **Text-to-Speech:** Speaks the generated sentences aloud.
    * **Speech-to-Text:** Listens to the other person's spoken reply and transcribes it.
* **Full Conversation Memory:** A secure **MongoDB** backend saves the entire conversation (both signed and spoken parts), giving the AI full context for follow-up questions.
* **Secure by Design:** All API keys and database connections are hidden in a backend server, so your frontend code is 100% secure and shareable.

---

## 🛠️ Tech Stack

* **Frontend:**
    * Vanilla **TypeScript**
    * HTML5 & CSS3
    * **MediaPipe** (for gesture recognition)
    * **Web Speech API** (`SpeechRecognition` & `SpeechSynthesis`)
* **Backend:**
    * **Node.js**
    * **Express**
    * **TypeScript**
    * **Mongoose** (for MongoDB)
* **AI & Database:**
    * **Google Gemini API**
    * **MongoDB Atlas** (or local MongoDB)

### Architecture
This project uses a secure client-server architecture. The frontend handles all UI and gesture capture, while the backend manages API keys, database operations, and all calls to the Gemini AI.



---

## 📦 Getting Started

You need to run two separate processes: the **Backend Server** and the **Frontend Application**.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or later)
* [Git](https://git-scm.com/)
* A **MongoDB** database. You can use:
    * [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (a free cloud database) **(Recommended)**
    * A local [MongoDB Community Server](https://www.mongodb.com/try/download/community-server)
* A **Google Gemini API Key**. You can get one from [Google AI Studio](https://ai.google.dev/).

### 1. Backend Setup

The backend server **must** be running for the frontend to work.

```bash
# 1. Clone the project (if you haven't)
git clone https://your-repo-url/SignSync.git
cd SignSync

# 2. Go into the backend folder
cd backend

# 3. Install all necessary packages
npm install
