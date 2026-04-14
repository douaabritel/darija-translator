# Darija Translator — LLM-powered RESTful Web Service

> **Mini Project 2** · Pr. El Habib Nfaoui  
> A secured Jakarta RESTful Web Service that translates text from any source language into **Moroccan Arabic Dialect (Darija)** using the Google Gemini AI API.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────┐
                        │   GlassFish 8 Application Server        │
                        │                                         │
                        │   darija-translator.war                 │
                        │   ├── TranslatorApplication  (/api)     │
                        │   ├── TranslatorResource     (/translator)│
                        │   ├── GeminiTranslationService ─────────────► Google Gemini API
                        │   ├── CorsFilter                        │
                        │   └── Basic Auth (web.xml)              │
                        └─────────────────────────────────────────┘
                               ▲         ▲         ▲         ▲
                        Chrome Ext   PHP Client  Python   React Native
                       (Manifest V3) (web + CLI) (GUI/CLI)  (Expo)
```

---

## Project Structure

```
darija-translator/
├── rest-service/                        # Maven WAR project (Jakarta EE 10)
│   ├── pom.xml
│   └── src/main/java/ma/translator/
│       ├── TranslatorApplication.java   # JAX-RS bootstrap (@ApplicationPath /api)
│       ├── resource/
│       │   ├── TranslatorResource.java  # REST endpoints
│       │   └── CorsFilter.java          # CORS response filter
│       ├── service/
│       │   ├── TranslationService.java  # Interface (swap LLM providers easily)
│       │   ├── GeminiTranslationService.java
│       │   └── TranslationException.java
│       └── model/
│           ├── TranslationRequest.java
│           └── TranslationResponse.java
│
├── chrome-extension/                    # Manifest V3 Chrome extension
│   ├── manifest.json
│   ├── background.js                    # Service worker
│   ├── content.js                       # Text-selection listener
│   ├── sidepanel.html / sidepanel.js    # Side panel UI
│   └── icons/
│
├── php-client/
│   └── index.php                        # Web form + CLI PHP client
│
├── python-client/
│   ├── client.py                        # Tkinter GUI + CLI
│   └── requirements.txt
│
├── react-native-client/                 # Expo / React Native mobile app
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── TranslatorScreen.js
│       │   └── SettingsScreen.js
│       └── services/
│           └── TranslatorApi.js
│
└── uml-diagrams/
    └── diagrams.html                    # Class, Deployment, and Use Case diagrams
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Java 17, Jakarta EE 10 |
| Application Server | GlassFish 8 |
| REST Framework | Jakarta JAX-RS (Jersey) |
| LLM | Google Gemini 2.5 Flash |
| Authentication | Jakarta Basic Authentication |
| Chrome Extension | Manifest V3, chrome.sidePanel API |
| PHP Client | PHP 8, cURL |
| Python Client | Python 3, urllib, Tkinter |
| Mobile Client | React Native (Expo SDK 54) |

---

## Setup & Deployment

### Prerequisites

- Java 17+, Maven 3.9+
- GlassFish 8 (Jakarta EE 10)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Configure the Gemini API key

```bash
# GlassFish JVM property (persists across restarts)
asadmin create-jvm-options "-Dgemini.api.key=YOUR_KEY_HERE"
```

Alternatively, set the environment variable `GEMINI_API_KEY` before starting GlassFish.

### 2. Build

```bash
cd rest-service
mvn clean package
```

Output: `target/darija-translator.war`

### 3. Deploy

```bash
asadmin deploy target/darija-translator.war
```

Or drag the WAR into the GlassFish Admin Console at `http://localhost:4848`.

### 4. Create the security realm and user

```bash
asadmin create-auth-realm \
  --classname com.sun.enterprise.security.auth.realm.file.FileRealm \
  --property file=${com.sun.aas.instanceRoot}/config/keyfile:jaas-context=fileRealm \
  DarijaTranslatorRealm

asadmin create-file-user \
  --groups translator-users \
  --authrealmname DarijaTranslatorRealm \
  <username>
```

---

## REST API Reference

**Base URL:** `http://localhost:8080/darija-translator/api/translator`

### Health Check

```
GET /health
```

Response:
```json
{ "status": "UP", "service": "Darija Translator" }
```

### Translate (GET)

```
GET /translate?text=Hello&lang=English
Authorization: Basic <base64(username:password)>
```

### Translate (POST)

```
POST /translate
Authorization: Basic <base64(username:password)>
Content-Type: application/json

{
  "text": "Hello, how are you?",
  "sourceLanguage": "English"
}
```

**Success response:**
```json
{
  "originalText": "Hello, how are you?",
  "translatedText": "آش حالك؟",
  "sourceLanguage": "English",
  "targetLanguage": "Darija (Moroccan Arabic)",
  "success": true
}
```

**Error response:**
```json
{
  "success": false,
  "errorMessage": "Gemini API returned status: 429"
}
```

---

## Testing with cURL

```bash
# Health check
curl http://localhost:8080/darija-translator/api/translator/health

# GET translation
curl -u <username>:<password> \
  "http://localhost:8080/darija-translator/api/translator/translate?text=Good+morning&lang=English"

# POST translation
curl -u <username>:<password> \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Morocco!","sourceLanguage":"English"}' \
  http://localhost:8080/darija-translator/api/translator/translate
```

---

## Running the Clients

### Chrome Extension

1. Go to `chrome://extensions/` → enable **Developer mode**
2. Click **Load unpacked** → select the `chrome-extension/` folder
3. Open the extension → enter server URL, username, and password in Settings
4. **Right-click** selected text on any page → **"Translate to Darija 🇲🇦"**

Features: auto-fill selected text · context menu · read aloud (TTS) · copy to clipboard

### PHP Client

```bash
# Web server
cd php-client
php -S localhost:3000
# Open http://localhost:3000

# CLI mode
DARIJA_API_USER=<user> DARIJA_API_PASS=<pass> php index.php
```

### Python Client

```bash
cd python-client

# GUI (Tkinter)
DARIJA_API_USER=<user> DARIJA_API_PASS=<pass> python client.py

# CLI one-shot
DARIJA_API_USER=<user> DARIJA_API_PASS=<pass> python client.py --cli "Good morning!" --lang English
```

### React Native (Expo)

```bash
cd react-native-client
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. In the app's **Settings** tab, set:
- **Server URL:** `http://<your-machine-ip>:8080/darija-translator/api/translator`
- **Username / Password:** your GlassFish credentials

> Android emulator: use `http://10.0.2.2:8080/...` as the server URL.

---

## Running Tests

```bash
cd rest-service
mvn test
```

---

## UML Diagrams

Open `uml-diagrams/diagrams.html` in a browser to view:

- **Class Diagram** — software structure and class relationships
- **Deployment Diagram** — physical server/client layout
- **Use Case Diagram** — user interactions

---

## Security Notes

- All `/translate` endpoints require **HTTP Basic Authentication**.
- The `/health` endpoint is public.
- For production: uncomment `<transport-guarantee>CONFIDENTIAL</transport-guarantee>` in `web.xml` to enforce HTTPS.
- Never commit API keys — use environment variables or JVM system properties.

---

## Team Members

| Name | Role |
|---|---|
| | |
| | |

---

## Screenshots

> _Add screenshots here before final submission._

---

## License

MIT License — Mini Project 2 submission.
