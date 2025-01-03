"use client";
import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Wand2, Moon, Sun } from "lucide-react";
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

  return (
    <div className="min-h-screen w-full p-4 transition-colors duration-200 dark:bg-gray-900">
      <div className="fixed top-4 right-4 flex items-center space-x-2">
        <Sun className="h-5 w-5 dark:text-gray-400" />
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <Moon className="h-5 w-5 text-gray-400" />
      </div>

      <Card className="max-w-3xl mx-auto backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 
        shadow-xl hover:shadow-2xl transition-all duration-200 border-0">
        <CardHeader className="space-y-4 px-6 pt-8">
          <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r 
            from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 
            bg-clip-text text-transparent animate-gradient">
            Smart Content Generator
          </CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Transform your ideas into polished content
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <Textarea
            value={prompt}
            onChange={handleChange}
            placeholder="Enter your content prompt here..."
            className="min-h-[120px] text-lg p-4 rounded-lg bg-white/50 dark:bg-gray-700/50 
              backdrop-blur-sm border-gray-200 dark:border-gray-600 focus:ring-2 
              focus:ring-blue-500 dark:focus:ring-blue-400 transition-all resize-none"
          />

          <Button
            onClick={handleGenerateContent}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 
              dark:from-blue-500 dark:to-purple-500 text-white rounded-lg font-medium 
              tracking-wide transform transition-all duration-200 hover:scale-[1.02] 
              hover:shadow-lg disabled:opacity-50"
            disabled={loading || !prompt}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5" />
                <span>Generate Content</span>
              </div>
            )}
          </Button>

          {generatedContent && (
            <div className="mt-8 rounded-lg overflow-hidden bg-white/50 dark:bg-gray-700/50 
              backdrop-blur-sm animate-fadeIn">
              <div className="flex items-center justify-between p-4 border-b 
                dark:border-gray-600">
                <h3 className="text-lg font-semibold dark:text-white">Generated Content</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Copy className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save As
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={saveAsDoc}>Word Document</DropdownMenuItem>
                    <DropdownMenuItem onClick={saveAsPDF}>PDF File</DropdownMenuItem>
                    <DropdownMenuItem onClick={saveAsImage}>Image (PNG)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div ref={contentRef} className="p-6 prose dark:prose-invert max-w-none">
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
