"use client";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import OpenAI from "openai";
import {
  Languages,
  Search,
  Bookmark,
  Star,
  Copy,
  Wand2,
  Moon,
  Sun,
  Info,
  ChevronRight,
  ChevronLeft,
  Save,
  ChevronDown,
  Loader,
} from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const API_KEYS = [
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_1,
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_2,
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_3,
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_4,
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_5,
  process.env.NEXT_PUBLIC_API_KEY_OPEN_AI_6,
].filter(Boolean) as string[];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

const TIPS = [
  "Be specific about topic and tone",
  "Include target audience",
  "Specify desired length",
  "Use ### for headers",
  "Request examples or case studies",
  "Specify formatting preferences",
  "Request citations if needed",
  "Use bold text for key points",
];

const ContentGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isThemeVisible, setIsThemeVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [savedPrompts, setSavedPrompts] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [translatedContent, setTranslatedContent] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("savedPrompts");
    if (saved) setSavedPrompts(JSON.parse(saved));

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const makeOpenAIRequest = async <T,>(
    request: (openai: OpenAI) => Promise<T>, 
    currentKeyIndex: number, 
    setCurrentKeyIndex: (index: number) => void
  ): Promise<T> => {
    if (!API_KEYS.length) {
      throw new Error("No API keys available");
    }
  
    let attempts = 0;
    while (attempts < API_KEYS.length) {
      try {
        const openai = new OpenAI({
          apiKey: API_KEYS[currentKeyIndex],
          dangerouslyAllowBrowser: true,
        });
        return await request(openai);
      } catch (error: any) {
        if (error?.status === 429) {
          setCurrentKeyIndex((currentKeyIndex + 1) % API_KEYS.length);
          attempts++;
          continue;
        }
        throw error;
      }
    }
    throw new Error("All API keys exhausted");
  };
  
  const generateContent = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await makeOpenAIRequest(   openai => openai.chat.completions.create({
        model: 'gpt-3.5-turbo', 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      }),
      currentKeyIndex,
      setCurrentKeyIndex
    );
      if (response.choices[0].message.content) {
        setGeneratedContent(response.choices[0].message.content);
      }
    }catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await makeOpenAIRequest(
        openai => openai.chat.completions.create({
        model: 'gpt-3.5-turbo', 
        messages: [
          {
            role: "system",
            content:
              "You are a search assistant. Find relevant content based on the query.",
          },
          { role: "user", content: searchQuery },
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
      currentKeyIndex,
      setCurrentKeyIndex
    );
      setRecommendations(
        response.choices[0].message.content?.split("\n") || []
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Search failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const translateContent = async () => {
    if (!generatedContent) return;
    setLoading(true);
    try {
      const response = await makeOpenAIRequest(
        openai => openai.chat.completions.create({
        model: 'gpt-3.5-turbo', 
        messages: [
          {
            role: "system",
            content: `Translate to ${
              LANGUAGES.find((l) => l.code === targetLanguage)?.name
            }`,
          },
          { role: "user", content: generatedContent },
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
      currentKeyIndex,
      setCurrentKeyIndex
    );
      setTranslatedContent(response.choices[0].message.content || "");
    } catch (error) {
      toast({
        title: "Error",
        description: "Translation failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = () => {
    const updated = [...savedPrompts, prompt];
    setSavedPrompts(updated);
    localStorage.setItem("savedPrompts", JSON.stringify(updated));
    toast({
      title: "Success",
      description: "Prompt saved",
    });
  };

  const formatContent = (content: string) => {
    return content
      .split("\n")
      .map((line, index) => {
        if (line.startsWith("###") && !line.startsWith("####")) {
          return (
            <h1
              key={index}
              className="text-3xl font-bold mb-4 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              {line.replace(/^###\s+/, "")}
            </h1>
          );
        }
        if (line.startsWith("####")) {
          return (
            <h2
              key={index}
              className="text-2xl font-semibold mb-3 mt-4 text-gray-800 dark:text-gray-200"
            >
              {line.replace(/^####\s+/, "")}
            </h2>
          );
        }
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={i} className="font-bold text-gray-900 dark:text-white">
                {part.slice(2, -2)}
              </span>
            );
          }
          return part;
        });
        return line.trim() ? (
          <p
            key={index}
            className="text-gray-700 dark:text-gray-200 leading-relaxed mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
          >
            {formattedLine}
          </p>
        ) : null;
      })
      .filter(Boolean);
  };

  const exportHandlers = {
    copyToClipboard: async () => {
      await navigator.clipboard.writeText(generatedContent);
      toast({ title: "Copied!", description: "Content copied to clipboard" });
    },
    saveAsDoc: () => {
      const filename = `content-${Date.now()}.doc`;
      const blob = new Blob([generatedContent], { type: "application/msword" });
      saveAs(blob, filename);
      toast({ title: "Success!", description: `Saved as ${filename}` });
    },
    saveAsPDF: async () => {
      if (!contentRef.current) return;
      try {
        const pdf = new jsPDF();
        const content = await html2canvas(contentRef.current);
        const imgData = content.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
        pdf.save(`content-${Date.now()}.pdf`);
        toast({ title: "Success!", description: "Saved as PDF" });
      } catch (error) {
        toast({ title: "Error!", description: "Failed to save PDF" });
      }
    },
    saveAsImage: async () => {
      if (!contentRef.current) return;
      try {
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        });
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `content-${Date.now()}.png`);
            toast({ title: "Success!", description: "Image saved" });
          }
        }, "image/png");
      } catch (error) {
        toast({ title: "Error!", description: "Failed to save image" });
      }
    },
  };

  return (
    <div className="min-h-screen w-full py-8 px-4 transition-colors dark:bg-gray-900">
      <div
        className={`fixed top-4 transition-all duration-300 z-50 ${
          isThemeVisible ? "right-4" : "-right-20"
        }`}
      >
        <Button
          onClick={() => setIsThemeVisible(!isThemeVisible)}
          className="absolute -left-7 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-l-lg"
        >
          {isThemeVisible ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <Sun className="h-5 w-5 text-yellow-500" />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="data-[state=checked]:bg-blue-600"
            />
            <Moon className="h-5 w-5 text-blue-400" />
          </div>
        </div>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Content Generator
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid grid-cols-3 gap-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                  {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={savePrompt}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Prompt
                </Button>
              </div>

              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setPrompt(e.target.value)
                  }
                  placeholder="Enter your content prompt..."
                  className="min-h-[120px] p-4 rounded-lg"
                />
                <div className="absolute top-3 right-3 group">
                  <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  <div className="invisible group-hover:visible absolute right-0 w-64 p-3 mt-2 text-sm bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="space-y-2">
                      <p className="font-medium">Writing Tips</p>
                      <ul className="space-y-1">
                        {TIPS.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateContent}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5 mr-2" />
                )}
                Generate Content
              </Button>

              {loading && (
                <div className="mt-6 p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {TIPS[tipIndex]}
                    </p>
                  </div>
                </div>
              )}

              {generatedContent && (
                <div
                  ref={contentRef}
                  className="mt-8 rounded-lg bg-white/50 dark:bg-gray-700/50"
                >
                  <div className="flex justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Generated Content</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={exportHandlers.copyToClipboard}
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary">
                            <Save className="w-4 h-4 mr-2" />
                            Save As
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={exportHandlers.saveAsDoc}>
                            Word Document
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportHandlers.saveAsPDF}>
                            PDF File
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={exportHandlers.saveAsImage}
                          >
                            Image (PNG)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-6 prose dark:prose-invert max-w-none">
                    {formatContent(generatedContent)}
                  </div>
                </div>
              )}

              {generatedContent && (
                <Button
                  onClick={translateContent}
                  variant="outline"
                  className="w-full"
                >
                  <Languages className="w-4 h-4 mr-2" />
                  Translate Content
                </Button>
              )}

              {translatedContent && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Translated Content</h4>
                  <div className="prose dark:prose-invert">
                    {formatContent(translatedContent)}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for content ideas..."
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Recommendations</h4>
                  <div className="grid gap-2">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setPrompt(rec)}
                      >
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              {savedPrompts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No saved prompts yet
                </p>
              ) : (
                savedPrompts.map((saved, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <p className="text-sm flex-1">{saved}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrompt(saved)}
                    >
                      Use
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGenerator;
