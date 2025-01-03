"use client";
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Wand2, Moon, Sun, Info, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OpenAI from 'openai';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Save, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

const ContentGenerator = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isThemeVisible, setIsThemeVisible] = useState(true);

  const { theme, setTheme } = useTheme();

  const getTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, '-');
  };
  const generateFilename = (content: string) => {
    // Extract title from first ### heading
    const titleMatch = content.match(/^###\s*(.+)$/m);
    const title = titleMatch 
      ? titleMatch[1]
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 50) // Limit length
      : 'generated-content';
      
    const timestamp = new Date()
      .toISOString()
      .split('T')[0]; // YYYY-MM-DD format
      
    return `${title}-${timestamp}`;
  };


  const saveAsDoc = () => {
    try {
      const filename = `${generateFilename(generatedContent)}.doc`;
  
      const styles = `
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          h1 { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1a1a1a; 
            margin: 30px 0 20px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
          }
          h2 { 
            font-size: 22px; 
            font-weight: bold; 
            color: #333; 
            margin: 25px 0 15px;
          }
          .paragraph { 
            margin-bottom: 15px; 
            color: #333; 
            text-align: justify;
          }
          .bold { font-weight: bold; }
        </style>
      `;
  
      const formattedContent = generatedContent
        .split('\n')
        .map(line => {
          if (line.startsWith('#')) {
            // Remove all # symbols and count them
            const headerMatch = line.match(/^#+/);
            const headerLevel = headerMatch ? headerMatch[0].length : 0;
            const headerText = line.replace(/^#+\s*/, '').trim();
            
            return `<h${headerLevel}>${headerText}</h${headerLevel}>`;
          }
          
          // Handle bold text
          const formattedLine = line.replace(
            /\*\*(.*?)\*\*/g, 
            '<span class="bold">$1</span>'
          );
          return `<div class="paragraph">${formattedLine}</div>`;
        })
        .join('\n');
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            ${styles}
          </head>
          <body>${formattedContent}</body>
        </html>
      `;
  
      const blob = new Blob(
        ['\ufeff', htmlContent],
        { type: 'application/msword;charset=utf-8' }
      );
      
      saveAs(blob, filename);
      toast({
        title: "Success!",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save document",
        variant: "destructive",
      });
    }
  };



  const saveAsPDF = async () => {
    if (!contentRef.current) return;
  
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin + 15;
      let pageNumber = 1;
  
      // Reset text styling to default
      const resetTextStyle = () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
      };
  
      // Enhanced PDF Metadata
      pdf.setProperties({
        title: generateFilename(generatedContent),
        author: 'Content Generator',
        creator: 'Smart Content Generator',
        subject: 'Generated Content',
        keywords: 'ai generated, content, article'
      });
  
      const addHeader = () => {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(0, 0, pageWidth, 20, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Smart Content Generator', margin, 13);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin, 13, { align: 'right' });
        resetTextStyle();
      };
  
      const processText = (line: string) => {
        if (line.startsWith('###')) {
          pdf.setFontSize(22);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 64, 175);
          const text = line.replace('###', '').trim();
          resetTextStyle();
          return { text, spacing: 20, isHeader: true, newPage: true };
        } 
        
        if (line.startsWith('####')) {
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(75, 85, 99);
          const text = line.replace('####', '').trim();
          resetTextStyle();
          return { text, spacing: 15, isHeader: true, newPage: false };
        }
  
        // Process bold text
        const boldSegments = line.split(/(\*\*.*?\*\*)/g);
        let processedText = '';
  
        boldSegments.forEach(segment => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            pdf.setFont("helvetica", "bold");
            processedText += segment.slice(2, -2);
            pdf.setFont("helvetica", "normal");
          } else {
            processedText += segment;
          }
        });
  
        return {
          text: processedText,
          spacing: 7,
          isHeader: false,
          newPage: false
        };
      };
  
      addHeader();
      resetTextStyle();
  
      const lines = generatedContent.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const { text, spacing, isHeader, newPage } = processText(line);
        
        if (newPage && pageNumber > 1) {
          pdf.addPage();
          pageNumber++;
          yPosition = margin + 15;
          addHeader();
          resetTextStyle();
        }
  
        const textLines = pdf.splitTextToSize(text, contentWidth);
        
        if (yPosition + (textLines.length * spacing) > pageHeight - 25) {
          pdf.addPage();
          pageNumber++;
          yPosition = margin + 15;
          addHeader();
          resetTextStyle();
        }
  
        if (isHeader) {
          if (line.startsWith('###')) {
            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 64, 175);
          } else {
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(75, 85, 99);
          }
        } else {
          resetTextStyle();
        }
  
        textLines.forEach((textLine: string) => {
          pdf.text(textLine, margin, yPosition, { 
            align: isHeader ? 'left' : 'justify',
            maxWidth: contentWidth
          });
          yPosition += spacing;
        });
  
        resetTextStyle();
        yPosition += isHeader ? 10 : 5;
      }
  
      const filename = `${generateFilename(generatedContent)}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "Success!",
        description: `PDF saved as ${filename}`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error!",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };
  

  const saveAsImage = async () => {
    if (!contentRef.current) return;
    
    try {
      const scale = 2; // Increase quality
      const canvas = await html2canvas(contentRef.current, {
        scale: scale,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
  
      canvas.toBlob(
        (blob) => {
          if (blob) {
            saveAs(blob, `content-${getTimestamp()}.png`);
            toast({
              title: "Success!",
              description: "Image saved successfully",
            });
          }
        },
        'image/png',
        1.0
      );
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save image",
        variant: "destructive",
      });
    }
  };

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    dangerouslyAllowBrowser: true,
  });

  const handleGenerateContent = async () => {
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.choices[0].message.content;
      if (content) {
        setGeneratedContent(content);
      } else {
        console.error('Generated content is null');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle main headers (###)
      if (line.startsWith('###') && !line.startsWith('####')) {
        return (
          <h1
            key={index}
            className="text-3xl font-bold mb-4 mt-6 bg-gradient-to-r from-blue-600 
              to-purple-600 bg-clip-text text-transparent animate-gradient"
          >
            {line.replace(/^###\s+/, '').trim()}
          </h1>
        );
      }
  
      // Handle sub headers (####)
      if (line.startsWith('####')) {
        return (
          <h2
            key={index}
            className="text-2xl font-semibold mb-3 mt-4 text-gray-800 
              dark:text-gray-200"
          >
            {line.replace(/^####\s+/, '').trim()}
          </h2>
        );
      }
  
      // Handle bold text (**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span
              key={partIndex}
              className="font-bold text-gray-900 dark:text-white"
            >
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });
  
      // Regular paragraphs with reduced spacing
      return line.trim() ? (
        <p
          key={index}
          className="text-gray-700 dark:text-gray-200 leading-relaxed mb-2 
            hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg 
            transition-colors duration-200"
        >
          {formattedLine}
        </p>
      ) : null;
    }).filter(Boolean); // Remove empty lines
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const TIPS = [
    "Try being specific about your topic and desired tone",
    "Include target audience in your prompt for better results",
    "Mention desired length: 'short summary' or 'detailed article'",
    "Request specific sections using ### for headers",
    "Ask for examples or case studies in your content",
    "Specify formatting: bullets, paragraphs, or numbered lists",
    "Request citations or sources if needed",
    "Add 'Use bold text for key points' in your prompt"
  ];
  
  // Add Tips component
  const LoadingState = () => {
    const [tipIndex, setTipIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
      }, 3000);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <div className="mt-6 space-y-4 animate-fade-in">
      
        <div className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm 
          border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <div className="w-4 h-4 border-2 border-current border-t-transparent 
                rounded-full animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-blue-600 dark:text-blue-400">
                Quick Tip:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
                {TIPS[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  

  return (
    <div className="min-h-screen w-full py-4 px-2 sm:py-6 sm:px-4 md:py-8 md:px-6 
    transition-colors duration-200 dark:bg-gray-900">
    {/* Theme Toggle - Responsive positioning */}
    <div className={`fixed top-2 sm:top-4 transition-all duration-300 z-50
        ${isThemeVisible ? 'right-2 sm:right-4' : '-right-20'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsThemeVisible(!isThemeVisible)}
          className="absolute -left-7 top-1/2 -translate-y-1/2 p-1.5 
            bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-l-lg 
            shadow-lg transition-colors hover:bg-white dark:hover:bg-gray-900"
          aria-label={isThemeVisible ? 'Hide theme toggle' : 'Show theme toggle'}
        >
          {isThemeVisible ? 
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : 
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          }
        </button>

        {/* Theme Toggle */}
        <div className="p-3 sm:p-4 bg-white/80 dark:bg-gray-900/80 
          backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-gray-400" />
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="data-[state=checked]:bg-blue-600"
            />
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-blue-400" />
          </div>
        </div>
      </div>

    <Card className="w-full max-w-3xl mx-auto mt-12 sm:mt-16 backdrop-blur-sm 
        bg-white/90 dark:bg-gray-800/90 shadow-xl transition-all duration-200 border-0">
        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6 md:p-8">
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center 
            bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 
            dark:to-purple-400 bg-clip-text text-transparent animate-gradient">
            Smart Content Generator
          </CardTitle>
          <p className="text-sm sm:text-base text-center text-gray-500 dark:text-gray-400">
            Transform your ideas into polished content
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Enter your content prompt here..."
          className="min-h-[120px] text-base sm:text-lg p-3 sm:p-4 rounded-lg 
            bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border-gray-200 
            dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
            dark:focus:ring-blue-400 transition-all resize-none"
        />
      <div className="absolute top-3 right-3 group">
  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-blue-500 
    transition-all duration-200 cursor-help transform hover:scale-110" />
    
  <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100
    absolute right-0 sm:right-auto sm:left-full w-[280px] sm:w-64 p-2.5 
    mt-2 sm:mt-0 sm:ml-2 text-sm bg-white/95 dark:bg-gray-800/95 
    rounded-lg shadow-md border border-gray-200/50 dark:border-gray-700/50 
    backdrop-blur-sm transition-all duration-200 transform origin-top-right 
    scale-95 group-hover:scale-100 z-50">
    
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1.5 
        border-b border-gray-100 dark:border-gray-700 pb-1.5">
        Writing Tips
      </p>
      <ul className="space-y-1.5 max-h-[280px] overflow-y-auto 
        scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {TIPS.map((tip, index) => (
          <li key={index} 
            className="flex items-start gap-2 text-gray-600 dark:text-gray-300 
            hover:text-gray-900 dark:hover:text-white transition-colors 
            px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <span className="text-blue-500 mt-0.5">•</span>
            <span className="text-[13px] leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>
      </div>
      <Button
    onClick={handleGenerateContent}
    className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 
      text-white rounded-lg font-medium tracking-wide transition-all duration-200 
      hover:scale-[1.02] hover:shadow-lg disabled:opacity-50"
    disabled={loading || !prompt}
  >
  <div className={`flex items-center justify-center gap-2 
    transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
    <Wand2 className="w-5 h-5" />
    <span>Generate Content</span>
  </div>
  
  {loading && (
    <div className="absolute inset-0 flex items-center justify-center gap-3 
      bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="w-5 h-5 border-2 border-white border-t-transparent 
        rounded-full animate-spin" />
      <span>Generating...</span>
    </div>
  )}
  </Button>
  {loading && <LoadingState />}

          {generatedContent && (
            <div className="mt-6 sm:mt-8 rounded-lg overflow-hidden bg-white/50 
              dark:bg-gray-700/50 backdrop-blur-sm animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center 
                justify-between p-3 sm:p-4 border-b dark:border-gray-600 gap-3 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold dark:text-white">
                  Generated Content
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" 
                        className="flex items-center gap-2 w-full sm:w-auto">
                        <Save className="w-4 h-4" />
                        Save As
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={saveAsDoc}>Word Document</DropdownMenuItem>
                    <DropdownMenuItem onClick={saveAsPDF}>PDF File</DropdownMenuItem>
                    <DropdownMenuItem onClick={saveAsImage}>Image (PNG)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div ref={contentRef} 
                className="p-4 sm:p-6 prose dark:prose-invert max-w-none 
                prose-sm sm:prose-base">
                {formatContent(generatedContent)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGenerator;
