import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Paperclip, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import HandwritingTraining from "./HandwritingTraining";
import RecordingDialog from "./RecordingDialog";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES } from "./LanguageSelector";

interface GenerationResult {
  generated_text: string;
}

const EmailComposer = () => {
  const [isHandwritingMode, setIsHandwritingMode] = useState(false);
  const [needsTraining, setNeedsTraining] = useState(true);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [convertedContent, setConvertedContent] = useState("");
  const [convertedSubject, setConvertedSubject] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [emailType, setEmailType] = useState("professional");
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0].code);
  const [transcription, setTranscription] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const handleHandwritingToggle = (checked: boolean) => {
    setIsHandwritingMode(checked);
    if (checked && needsTraining) {
      setIsTrainingOpen(true);
    }
  };

  const handleTrainingComplete = () => {
    setNeedsTraining(false);
  };

  const openRecordingDialog = () => {
    setIsRecordingDialogOpen(true);
    setTranscription("");
  };

  const closeRecordingDialog = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (!isProcessing) {
      setIsRecordingDialogOpen(false);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    if (text.trim()) {
      setPrompt(prev => {
        if (prev.trim()) {
          return `${prev} ${text}`;
        }
        return text;
      });
      toast.success("Transcription added to prompt");
      setTranscription("");
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    console.log(`Language changed to: ${language}`);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.error("Error stopping recognition during language change:", e);
      }
    }
  };

  const startRecording = async () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error("Your browser doesn't support speech recognition");
        return;
      }

      setTranscription("");

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current = null;
        } catch (e) {
          console.log("Error stopping previous recognition:", e);
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        } catch (e) {
          console.error("Error stopping previous media recorder:", e);
        }
        mediaRecorderRef.current = null;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = selectedLanguage;
      console.log(`Setting recognition language to: ${selectedLanguage}`);
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      let currentTranscription = '';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            currentTranscription += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (interimTranscript) {
          console.log(`Interim transcript [${selectedLanguage}]:`, interimTranscript);
          setTranscription(currentTranscription + interimTranscript);
        } else {
          setTranscription(currentTranscription);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error(`Recognition error with language ${selectedLanguage}:`, event.error);
        
        if (event.error !== 'no-speech') {
          toast.error(`Recognition error: ${event.error}`);
        }
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsRecording(false);
          setIsProcessing(false);
        }
      };
      
      recognition.onend = () => {
        console.log(`Recognition ended for language ${selectedLanguage}`);
        
        if (isRecording) {
          try {
            setTimeout(() => {
              if (isRecording && recognitionRef.current === recognition) {
                try {
                  recognitionRef.current.start();
                  console.log(`Restarted recognition for ${selectedLanguage}`);
                } catch (e) {
                  console.error("Could not restart recognition:", e);
                  setIsRecording(false);
                  setIsProcessing(false);
                }
              }
            }, 50);
          } catch (e) {
            console.error("Could not restart recognition:", e);
            setIsRecording(false);
            setIsProcessing(false);
          }
        } else {
          if (finalTranscript) {
            setTimeout(() => {
              setIsProcessing(false);
              toast.success("Speech converted to text");
            }, 300);
          } else {
            setIsProcessing(false);
          }
        }
      };
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000
          } 
        });
        
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: navigator.userAgent.indexOf('Firefox') >= 0 ? 'audio/webm' : 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000 
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        recognition.start();
        mediaRecorder.start(100);
        setIsRecording(true);
        
        const langName = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);
        toast.info(`Recording started in ${langName ? langName.name : selectedLanguage}`);
      } catch (e) {
        console.error("Error accessing microphone:", e);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (stopError) {
            console.error("Error stopping recognition after microphone error:", stopError);
          }
        }
        toast.error("Failed to access microphone");
        setIsRecording(false);
      }
    } catch (e) {
      console.error("Error starting recognition:", e);
      stopRecording();
      toast.error("Failed to start speech recognition");
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    setIsRecording(false);
    setIsProcessing(true);
    
    const currentRecognition = recognitionRef.current;
    
    if (currentRecognition) {
      try {
        currentRecognition.onend = () => {
          console.log("Recognition ended after stopping");
          setTimeout(() => {
            setIsProcessing(false);
          }, 500);
        };
        
        currentRecognition.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
        setIsProcessing(false);
      }
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.error("Error stopping media recorder:", e);
        setIsProcessing(false);
      }
      mediaRecorderRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition during cleanup:", e);
        }
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        } catch (e) {
          console.error("Error stopping media recorder during cleanup:", e);
        }
      }
    };
  }, []);

  const generateEmail = async () => {
    setIsConverting(true);
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyCDQQ9gDP6spavfiFhmo2X0gUaIcZeHn28");
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const fullPrompt = `${prompt} Generate a ${emailType} email. Return it in JSON format with 'subject' and 'content' fields.`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response.text();
      try {
        const { subject, content } = JSON.parse(response);
        setEmailSubject(subject);
        setEmailContent(content);

        if (isHandwritingMode && !needsTraining) {
          await Promise.all([
            convertToHandwriting(subject, setConvertedSubject),
            convertToHandwriting(content, setConvertedContent)
          ]);
        }
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        toast.error('Failed to generate a properly formatted email. Please try again.');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const convertToHandwriting = async (text: string, setter: (text: string) => void) => {
    try {
      const handwritingStyle = localStorage.getItem('handwritingStyle');
      if (!handwritingStyle) {
        console.error('No handwriting style found');
        return;
      }

      const styleMap = JSON.parse(handwritingStyle);
      const styledText = applyHandwritingStyle(text, styleMap);
      setter(styledText);
    } catch (error) {
      console.error('Error converting to handwriting:', error);
    }
  };

  const applyHandwritingStyle = (text: string, styleMap: Record<string, any>): string => {
    const styledChars = text.split('').map(char => {
      const style = styleMap[char] || styleMap['a'];
      return `<span style="font-family: 'Handwriting'; font-size: 16px;">${char}</span>`;
    });
    return styledChars.join('');
  };

  const handleContentChange = async (value: string) => {
    setEmailContent(value);
    if (isHandwritingMode && !needsTraining) {
      await convertToHandwriting(value, setConvertedContent);
    }
  };

  const handleSubjectChange = async (value: string) => {
    setEmailSubject(value);
    if (isHandwritingMode && !needsTraining) {
      await convertToHandwriting(value, setConvertedSubject);
    }
  };

  return (
    <div className="flex-1 p-8 ml-64">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Compose Email</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="handwriting-mode"
                  checked={isHandwritingMode}
                  onCheckedChange={handleHandwritingToggle}
                />
                <label
                  htmlFor="handwriting-mode"
                  className="text-sm font-medium text-gray-700"
                >
                  Handwriting Mode
                </label>
              </div>
              {isHandwritingMode && needsTraining && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTrainingOpen(true)}
                  className="text-sm"
                >
                  Train Handwriting
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to write about? Type 'fix' followed by your instructions to fix the generated email."
                className="min-h-[100px] border-0 focus:ring-0 text-gray-600 resize-none placeholder:text-gray-400"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-gray-100"
                    onClick={openRecordingDialog}
                  >
                    <Mic className="h-5 w-5 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Select>
                    <select 
                      className="h-9 px-3 py-1 text-sm rounded-md border border-input bg-white"
                      value={emailType}
                      onChange={(e) => setEmailType(e.target.value)}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </select>
                  </Select>
                  <Button 
                    onClick={generateEmail}
                    disabled={isConverting}
                    className="bg-black hover:bg-gray-900 text-white px-6 rounded-full"
                  >
                    {isConverting ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">To</label>
                <Input
                  type="email"
                  placeholder="Recipient email address"
                  className="mt-1 border-gray-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="Email subject"
                  className="mt-1 border-gray-200"
                />
                {isHandwritingMode && !needsTraining && convertedSubject && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: convertedSubject }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <Textarea
                  value={emailContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Your email content..."
                  className="mt-1 min-h-[200px] border-gray-200"
                />
                {isHandwritingMode && !needsTraining && convertedContent && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: convertedContent }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  aria-label="Refresh"
                >
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </Button>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    Save as Draft
                  </Button>
                  
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HandwritingTraining
        isOpen={isTrainingOpen}
        onClose={() => setIsTrainingOpen(false)}
        onComplete={handleTrainingComplete}
      />

      <RecordingDialog 
        isOpen={isRecordingDialogOpen}
        isRecording={isRecording}
        isProcessing={isProcessing}
        selectedLanguage={selectedLanguage}
        transcription={transcription}
        onLanguageChange={handleLanguageChange}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onClose={closeRecordingDialog}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
    </div>
  );
};

export default EmailComposer;
