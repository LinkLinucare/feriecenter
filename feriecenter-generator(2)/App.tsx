import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

const loadingMessages = [
  "Kontakter arkitekterne...",
  "Bestiller rutsjebaner i alle regnbuens farver...",
  "Puster badedyr op...",
  "Tegner byggeplaner...",
  "Hælder vand i swimmingpoolen...",
  "Sætter prikken over i'et...",
];

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-800 bg-opacity-70 rounded-lg">
    <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg text-center text-gray-300">{message}</p>
    <p className="text-sm text-center text-gray-400">Dette kan tage et par minutter. Tag en kop kaffe, mens magien sker.</p>
  </div>
);

// ApiKeyManager component removed - API key is now handled via environment variables

export default function App() {
  const [isKeySelected, setIsKeySelected] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Removed AI Studio dependency - API key is now handled via environment variables

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Removed AI Studio dependency - API key is now handled via environment variables

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
      } else {
        setError("Vælg venligst en gyldig billedfil.");
        setImageFile(null);
        setImagePreview(null);
      }
    }
  };

  const handleGenerateVideo = useCallback(async () => {
    if (!imageFile) {
      setError("Upload venligst et billede først.");
      return;
    }
    
    setIsLoading(true);
    setVideoUrl(null);
    setError(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      // Re-create instance to ensure latest key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imagePart = await fileToGenerativePart(imageFile);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Animer et feriecenter, der bliver bygget oven på dette hus. Tilføj farverige rutsjebaner, der kommer ud af vinduerne, en stor swimmingpool i forhaven og en festlig, glad atmosfære.',
        image: {
          imageBytes: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9',
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        
        if (!videoResponse.ok) {
           throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
      } else {
        throw new Error("Videogenerering mislykkedes, eller der blev ikke returneret nogen video.");
      }
    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || "En ukendt fejl opstod.";
      if (errorMessage.includes("Requested entity was not found.")) {
          errorMessage = "Din API nøgle er muligvis ugyldig. Tjek dine environment variabler.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const resetState = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsLoading(false);
    setError(null);
    setVideoUrl(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Feriecenter Generator
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Forvandl et hvilket som helst hus til et drømmeferiecenter med Gemini's videokraft!
          </p>
        </header>

        <main className="bg-gray-800 rounded-xl shadow-2xl p-6 min-h-[500px] flex flex-col items-center justify-center">
          {isLoading ? (
            <Loader message={loadingMessage} />
          ) : videoUrl ? (
            <div className="w-full text-center">
              <h2 className="text-3xl font-bold mb-4 text-cyan-400">Her er dit nye feriecenter!</h2>
              <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg mb-6 aspect-video bg-black"></video>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={videoUrl} 
                  download={`feriecenter-${Date.now()}.mp4`} 
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
                >
                  Download Video
                </a>
                <button 
                  onClick={resetState} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105"
                >
                  Prøv Igen
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {error && <div className="bg-red-500 text-white p-4 rounded-lg mb-6 w-full text-center">{error}</div>}
              {imagePreview ? (
                <div className="w-full text-center">
                    <img src={imagePreview} alt="Forhåndsvisning" className="max-w-full max-h-[40vh] mx-auto rounded-lg mb-6 shadow-lg aspect-video object-cover"/>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                         <button 
                            onClick={handleGenerateVideo} 
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg"
                         >
                            Byg Feriecenter!
                         </button>
                         <button 
                            onClick={resetState} 
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
                         >
                            Vælg et andet billede
                         </button>
                    </div>
                </div>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center text-center">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full border-4 border-dashed border-gray-600 hover:border-cyan-400 transition-colors rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer">
                        <svg className="w-16 h-16 text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-xl font-semibold text-gray-300">Upload et billede af et hus</span>
                        <span className="text-gray-400 mt-2">Klik eller træk filen hertil</span>
                    </button>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="text-center mt-8 text-sm text-gray-500">
            <p>Drevet af Gemini. Hostet på liveterenlangfest.dk</p>
        </footer>
      </div>
    </div>
  );
}