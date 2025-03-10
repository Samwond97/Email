import React, { useEffect, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import LanguageSelector from "./LanguageSelector";
import { SUPPORTED_LANGUAGES } from "./LanguageSelector";

interface RecordingDialogProps {
  isOpen: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  selectedLanguage: string;
  transcription: string;
  onLanguageChange: (language: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClose: () => void;
  onTranscriptionComplete: (transcription: string) => void;
}

const RecordingDialog: React.FC<RecordingDialogProps> = ({
  isOpen,
  isRecording,
  isProcessing,
  selectedLanguage,
  transcription,
  onLanguageChange,
  onStartRecording,
  onStopRecording,
  onClose,
  onTranscriptionComplete,
}) => {
  // This useEffect will automatically close the dialog and pass the transcription to the parent component
  // when processing is complete
  useEffect(() => {
    if (!isProcessing && !isRecording && isOpen && transcription.trim()) {
      // Small delay to allow for any final processing
      const timer = setTimeout(() => {
        onTranscriptionComplete(transcription);
        onClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isProcessing, isRecording, isOpen, transcription, onTranscriptionComplete, onClose]);

  // This function ensures we don't close the dialog if we're still recording or processing
  const handleOpenChange = (open: boolean) => {
    if (!open && (isRecording || isProcessing)) {
      // Don't close the dialog if we're recording or processing
      return;
    }
    
    // If there's a transcription, pass it back to the parent component
    if (transcription.trim() && !isRecording && !isProcessing) {
      onTranscriptionComplete(transcription);
    }
    
    onClose();
  };

  // Get the current language's native name for display in the UI
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);
  const languageDisplay = currentLanguage ? 
    (currentLanguage.nativeName && currentLanguage.nativeName !== currentLanguage.name ? 
      `${currentLanguage.name} (${currentLanguage.nativeName})` : 
      currentLanguage.name) : 
    selectedLanguage;

  // Handle language change with improved fast-switching mechanism
  const handleLanguageChange = (language: string) => {
    if (isRecording) {
      onStopRecording();
      // Quick language switching with minimal delays
      setTimeout(() => {
        onLanguageChange(language);
        // Start recording with the new language after a minimal delay
        setTimeout(() => {
          onStartRecording();
        }, 300); // Reduced delay for faster language switching
      }, 200);
    } else {
      onLanguageChange(language);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Voice Recording</DialogTitle>
          <DialogDescription className="text-gray-500">
            Speak clearly to capture your message accurately
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Language
          </label>
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative flex items-center justify-center mb-6">
            {isRecording ? (
              <div className="relative">
                {/* Enhanced sound wave animation rings */}
                <div className="absolute -inset-16 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-black opacity-20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </div>
                <div className="absolute -inset-12 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-black opacity-30 animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </div>
                <div className="absolute -inset-8 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-black opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </div>
                
                {/* Microphone button */}
                <div className="relative z-10 p-5 bg-black rounded-full shadow-lg animate-pulse">
                  <Mic className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : isProcessing ? (
              <div className="relative">
                {/* Improved modern processing animation */}
                <div className="relative p-5 bg-gradient-to-r from-gray-800 to-black rounded-full shadow-lg overflow-hidden">
                  {/* Single clean spinner with subtle glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full border-4 border-t-blue-400 border-r-transparent border-b-gray-600 border-l-transparent rounded-full animate-spin"></div>
                  </div>
                  
                  {/* Subtle pulsing core */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 bg-gradient-to-br from-blue-500 to-purple-500 bg-opacity-20 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-300 cursor-pointer transform hover:scale-105" onClick={onStartRecording}>
                <Mic className="h-8 w-8 text-gray-700" />
              </div>
            )}
          </div>
          
          <p className="text-center text-sm text-gray-600 mb-3 font-medium">
            {isRecording
              ? `Recording in ${languageDisplay}... Speak clearly.`
              : isProcessing
              ? "Processing transcription... Almost done."
              : "Click the microphone to start recording."}
          </p>
          
          {isRecording && (
            <div className="flex items-center justify-center space-x-1 mb-3">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span
                    key={i}
                    className="h-6 w-1 bg-black rounded-full"
                    style={{
                      animation: `equalizer ${0.5 + Math.random() * 0.3}s ease-in-out ${i * 0.05}s infinite alternate`,
                      transformOrigin: "bottom",
                    }}
                  ></span>
                ))}
              </div>
            </div>
          )}
          
          {/* Display current transcription */}
          {transcription.trim() && !isRecording && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200 max-h-24 overflow-y-auto w-full">
              <p className="text-sm text-gray-800">{transcription}</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex sm:justify-center border-t pt-4">
          {isRecording ? (
            <Button
              variant="destructive"
              onClick={onStopRecording}
              className="px-8 bg-black hover:bg-gray-800 text-white"
            >
              <MicOff className="h-4 w-4 mr-2" /> Stop Recording
            </Button>
          ) : isProcessing ? (
            <Button
              variant="default"
              disabled
              className="px-8 bg-gray-500 text-white cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onStartRecording}
              className="px-8 bg-black hover:bg-gray-800 text-white"
            >
              <Mic className="h-4 w-4 mr-2" /> Record
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingDialog;
