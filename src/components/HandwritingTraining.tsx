import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Download, Eraser, HelpCircle, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { supabase } from "./AuthGuard";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const TEMPLATE_FILES = {
  pdf: 'MailAI-Template.pdf',
  png1: 'MailAI-Template_1.png',
  png2: 'MailAI-Template_2.png'
};

const BUCKET_NAME = 'mailai-hw-tpl(with-helplines&bgchars)';

interface HandwritingTrainingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const SAMPLE_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const HandwritingTraining = ({ isOpen, onClose, onComplete }: HandwritingTrainingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentChar, setCurrentChar] = useState(SAMPLE_TEXT[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [handwritingData, setHandwritingData] = useState<Record<string, string>>({});
  const [trainingMethod, setTrainingMethod] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState("pdf");
  const [templateSize, setTemplateSize] = useState([50]);
  const [drawHelplines, setDrawHelplines] = useState(true);
  const [charactersAsBackground, setCharactersAsBackground] = useState(true);
  const [templateName] = useState("Mail AI - handwriting template");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const templateCanvasRef = useRef<HTMLCanvasElement>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [bucketFiles, setBucketFiles] = useState<any[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
      if (data.session) {
        listBucketContents();
      }
    };
    
    checkSession();
  }, []);

  const listBucketContents = async () => {
    try {
      console.log(`Listing contents of bucket: ${BUCKET_NAME}`);
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list();
      
      if (error) {
        console.error('Error listing bucket contents:', error);
        return;
      }
      
      console.log('Files found in bucket:', data);
      setBucketFiles(data || []);
    } catch (error) {
      console.error('Error in listBucketContents:', error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || trainingMethod !== "draw") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isErasing) {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="20" fill="%23ffffff" stroke="%23999999" stroke-width="2"/></svg>') 16 16, auto`;
    } else {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 32 32"><path d="M12 28l-8 2 2-8L22 6l6 6z" fill="%23000000" stroke="%23ffffff" stroke-width="1"/></svg>') 0 32, auto`;
    }
  }, [isErasing, trainingMethod]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 2;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    setIsDrawing(false);
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataUrl = canvas.toDataURL('image/png');
    setHandwritingData(prev => ({
      ...prev,
      [currentChar]: dataUrl
    }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleNext = async () => {
    setIsProcessing(true);
    try {
      if (currentIndex < SAMPLE_TEXT.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentChar(SAMPLE_TEXT[currentIndex + 1]);
        clearCanvas();
      } else {
        localStorage.setItem('handwritingStyle', JSON.stringify(handwritingData));
        onComplete();
        onClose();
      }
    } catch (error) {
      console.error('Error processing handwriting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSignedUrls = async (fileNames: string[]) => {
    if (!userSession) {
      toast.error('You must be signed in to download templates');
      return [];
    }
    
    const expiryTime = 3600; // URL expires in 1 hour

    try {
      const existingFiles = bucketFiles.map(file => file.name);
      console.log('Available files in bucket:', existingFiles);
      
      const validFileNames = fileNames.filter(name => existingFiles.includes(name));
      
      if (validFileNames.length === 0) {
        console.error('None of the requested files exist in the bucket');
        toast.error('Template files not found in storage bucket');
        return [];
      }
      
      console.log(`Attempting to fetch these files: ${validFileNames.join(', ')}`);
      
      const signedUrls = await Promise.all(validFileNames.map(async (fileName) => {
        try {
          console.log(`Generating signed URL for ${fileName}...`);
          const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .createSignedUrl(fileName, expiryTime);
          
          if (error) {
            console.error(`Error generating signed URL for ${fileName}:`, error);
            return null;
          }
          
          console.log(`Successfully generated signed URL for ${fileName}`);
          return { file: fileName, url: data.signedUrl };
        } catch (innerError) {
          console.error(`Exception generating URL for ${fileName}:`, innerError);
          return null;
        }
      }));

      return signedUrls.filter(item => item !== null);
    } catch (error) {
      console.error('Error getting signed URLs:', error);
      toast.error('Failed to retrieve template files from storage');
      throw error;
    }
  };

  const downloadPdfTemplate = async () => {
    setIsLoadingTemplates(true);
    try {
      const signedUrls = await getSignedUrls([TEMPLATE_FILES.pdf]);
      
      if (signedUrls.length === 0) {
        toast.error("PDF template not found in storage");
        return false;
      }
      
      const pdfFile = signedUrls[0];
      if (pdfFile && pdfFile.url) {
        console.log('Opening PDF URL in new tab');
        window.open(pdfFile.url, '_blank');
        toast.success("PDF template opened in a new tab");
        return true;
      }
      
      toast.error("Could not generate link for PDF template");
      return false;
    } catch (error) {
      console.error('Error downloading PDF template:', error);
      toast.error(`Error downloading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const downloadPngTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const pngFiles = await getSignedUrls([TEMPLATE_FILES.png1, TEMPLATE_FILES.png2]);
      
      if (pngFiles.length === 0) {
        toast.error("PNG templates not found in storage");
        return false;
      }
      
      const zip = new JSZip();
      
      await Promise.all(pngFiles.map(async (file) => {
        if (file && file.url) {
          console.log(`Fetching PNG: ${file.file}`);
          try {
            const response = await fetch(file.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${file.file}: ${response.statusText}`);
            }
            const blob = await response.blob();
            zip.file(file.file, blob);
          } catch (error) {
            console.error(`Error fetching ${file.file}:`, error);
          }
        }
      }));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "handwriting-templates.zip");
      toast.success("PNG templates downloaded as a zip file");
      return true;
    } catch (error) {
      console.error('Error downloading PNG templates:', error);
      toast.error(`Error downloading PNGs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsLoadingTemplates(true);
    
    try {
      if (bucketFiles.length === 0) {
        await listBucketContents();
      }
      
      let success = false;
      
      if (fileFormat === 'pdf') {
        success = await downloadPdfTemplate();
      } else {
        success = await downloadPngTemplates();
      }
      
      if (!success) {
        toast.error("Failed to download template files");
      }
    } catch (error) {
      console.error('Error downloading templates:', error);
      toast.error("Failed to download template");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const uploadTemplateToSupabase = async (blob: Blob, fileName: string) => {
    try {
      const { error: uploadError } = await supabase
        .storage
        .from('mailai-hw-uploads')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Error uploading ${fileName}:`, uploadError);
        return false;
      }
      
      console.log(`Successfully uploaded ${fileName}`);
      return true;
    } catch (error) {
      console.error('Error in uploadTemplateToSupabase:', error);
      return false;
    }
  };

  const handleUploadTemplate = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    const uploadTemplate = async () => {
      try {
        const timestamp = new Date().getTime();
        const fileName = `uploaded_template_${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('mailai-hw-uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        const mockHandwritingData: Record<string, string> = {};
        SAMPLE_TEXT.split('').forEach(char => {
          mockHandwritingData[char] = '';
        });
        
        setHandwritingData(mockHandwritingData);
        localStorage.setItem('handwritingStyle', JSON.stringify(mockHandwritingData));
        
        toast.success("Template processed successfully");
        onComplete();
        onClose();
      } catch (error) {
        console.error('Error uploading template:', error);
        toast.error("Failed to process template");
      } finally {
        setIsProcessing(false);
      }
    };
    
    uploadTemplate();
  };

  const renderMethodSelection = () => (
    <div className="flex flex-col items-center space-y-8 py-4">
      <h3 className="text-lg font-medium text-gray-900">Choose Training Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
        <button
          onClick={() => setTrainingMethod("draw")}
          className="flex flex-col items-center p-6 border border-purple-100 rounded-xl bg-white hover:bg-purple-50 transition-all shadow-sm hover:shadow"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.2322 5.23223L18.7677 8.76777M16.7322 3.73223C17.7085 2.75592 19.2914 2.75592 20.2677 3.73223C21.244 4.70854 21.244 6.29146 20.2677 7.26777L6.5 21.0355H3V17.4644L16.7322 3.73223Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h4 className="text-base font-medium text-gray-900">Draw Characters</h4>
          <p className="text-sm text-gray-500 text-center mt-2">
            Draw each character one by one on the screen
          </p>
        </button>
        
        <button
          onClick={() => setTrainingMethod("template")}
          className="flex flex-col items-center p-6 border border-purple-100 rounded-xl bg-white hover:bg-purple-50 transition-all shadow-sm hover:shadow"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="text-base font-medium text-gray-900">Download Template</h4>
          <p className="text-sm text-gray-500 text-center mt-2">
            Fill in a template and upload it back
          </p>
        </button>
      </div>
    </div>
  );

  const renderDrawTraining = () => (
    <div className="space-y-6 py-2">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTrainingMethod(null)}
          className="mr-auto rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          Draw the character below:
        </p>
        <div className="bg-purple-50 rounded-xl py-6 px-8">
          <span className="text-5xl font-semibold text-gray-800">{currentChar}</span>
        </div>
        <div className="flex items-center justify-center space-x-1 mt-3">
          <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
          <div className="text-xs text-gray-500">
            {currentIndex + 1} of {SAMPLE_TEXT.length}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="bg-white border border-gray-200 rounded-lg shadow-sm touch-none mx-auto"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            disabled={isProcessing}
            className="rounded-full border-gray-200"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsErasing(!isErasing)}
            disabled={isProcessing}
            className={`rounded-full border-gray-200 ${isErasing ? "bg-gray-100" : ""}`}
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isProcessing}
          className="rounded-full bg-purple-600 hover:bg-purple-700"
        >
          {isProcessing ? "Processing..." : currentIndex === SAMPLE_TEXT.length - 1 ? "Complete" : "Next"}
        </Button>
      </div>
    </div>
  );

  const renderTemplateDownload = () => (
    <div className="space-y-6 py-2">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTrainingMethod(null)}
          className="mr-auto rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
      </div>

      <div className="space-y-5">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
            <HelpCircle className="h-4 w-4 mr-1" />
            Template Information
          </h3>
          <p className="text-sm text-purple-700">
            Download the template, print it, and fill in your handwriting. Then scan or photograph the completed template and upload it to generate your personalized handwriting font.
          </p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700">File Format</Label>
          <RadioGroup defaultValue="pdf" value={fileFormat} onValueChange={setFileFormat} className="flex space-x-4 mt-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" className="text-purple-600" />
              <Label htmlFor="pdf">PDF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="png" className="text-purple-600" />
              <Label htmlFor="png">PNG</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium text-gray-700">Size of template cells</Label>
            <span className="text-sm text-gray-500">{templateSize[0]}</span>
          </div>
          <Slider
            value={templateSize}
            onValueChange={setTemplateSize}
            max={100}
            min={20}
            step={1}
            className="mt-2"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="draw-helplines" 
              checked={drawHelplines}
              onCheckedChange={(checked) => setDrawHelplines(checked as boolean)}
              className="text-purple-600 border-purple-200"
            />
            <div className="flex items-center">
              <Label 
                htmlFor="draw-helplines"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Draw helplines
              </Label>
              <div className="group relative ml-1">
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded shadow-lg w-48">
                  Adds grid lines to help align your characters
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="characters-background" 
              checked={charactersAsBackground}
              onCheckedChange={(checked) => setCharactersAsBackground(checked as boolean)}
              className="text-purple-600 border-purple-200"
            />
            <div className="flex items-center">
              <Label 
                htmlFor="characters-background"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Characters as background
              </Label>
              <div className="group relative ml-1">
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded shadow-lg w-48">
                  Shows light character outlines to guide your writing
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-3 rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-800">
              {fileFormat === 'pdf' ? TEMPLATE_FILES.pdf : "PNG templates (downloadable zip)"}
            </div>
            <div className="text-xs text-gray-500">Templates from Supabase storage</div>
          </div>
          <Button
            onClick={handleDownloadTemplate}
            className="rounded-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoadingTemplates}
          >
            {isLoadingTemplates ? (
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isLoadingTemplates ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-800">Upload completed template</h4>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              After filling out the template, scan or take a clear photo and upload it here
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".png,.pdf,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            
            <Button
              onClick={handleUploadTemplate}
              variant="outline"
              className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-opacity-20 border-t-blue-600 rounded-full"></div>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? "Processing..." : "Upload Filled Template"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!trainingMethod) return renderMethodSelection();
    if (trainingMethod === "draw") return renderDrawTraining();
    if (trainingMethod === "template") return renderTemplateDownload();
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl shadow-xl border-0 p-0 overflow-hidden">
        <DialogHeader className="border-b pb-4 px-6 pt-6">
          <DialogTitle className="text-xl font-bold text-gray-800">Train Your Handwriting</DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Create a personalized handwriting style for your emails
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          {!userSession ? (
            <div className="text-center py-6">
              <p className="text-gray-700 mb-4">You need to be signed in to access handwriting training</p>
              <Button onClick={onClose} variant="default">
                Go to Login
              </Button>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandwritingTraining;
