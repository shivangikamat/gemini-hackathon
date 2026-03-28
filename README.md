# Gemini Hackathon - AI Hairstyle Generator 💇‍♀️

Welcome to the **Gemini Hackathon** project! This is an innovative Next.js web application that uses Google's powerful **Gemini API** (`gemini-1.5-flash`) to analyze facial features and provide personalized hairstyle recommendations. It also features a capability to visually render these new hairstyles directly onto the user's selfie!

##  Features

- **📸 Selfie Upload & Analysis**: Upload a photo to let the AI scan your facial profile.
- **Intelligent Face Profiling**: Detects your:
  - Face Shape (e.g., oval, round, square, heart, diamond, oblong)
  - Hair Texture (e.g., straight, wavy, curly, coily)
  - Skin Tone
- **Personalized Recommendations**: Get 3 tailored hairstyle suggestions uniquely suited for your features, complete with professional reasoning.
- **AI Image Generation**: Preview the new hairstyles seamlessly integrated onto your original selfie while preserving your identity, skin tone, and lighting.

##  Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **UI & Styling**: React 18, [Tailwind CSS 4](https://tailwindcss.com/), Framer Motion, Lucide React
- **AI Model**: Google's [Gemini API](https://ai.google.dev/) (`@google/genai` & `@google/generative-ai`)

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gemini-hackathon.git
   cd gemini-hackathon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root of the project and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/lib/gemini.ts`: Contains the logic for interacting with the Gemini API to analyze the uploaded selfie and return the facial profile along with hairstyle suggestions.
- `src/app/api/render-hairstyle/route.ts`: API route for rendering the newly suggested hairstyle on the user's uploaded selfie using Gemini's image editing capabilities.

## License

This project was created for the Gemini Hackathon.
