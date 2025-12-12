import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Play, Link2, AlertCircle, Loader2, Music, Video, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DownloadFormat = "video" | "audio";
type VideoQuality = "360" | "480" | "720" | "1080";

const qualityOptions: { value: VideoQuality; label: string }[] = [
  { value: "360", label: "360p" },
  { value: "480", label: "480p" },
  { value: "720", label: "720p HD" },
  { value: "1080", label: "1080p Full HD" },
];

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [format, setFormat] = useState<DownloadFormat>("video");
  const [quality, setQuality] = useState<VideoQuality>("720");

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl.trim() === "") {
      setVideoId(null);
    }
  };

  const handleLoadVideo = async () => {
    if (!url.trim()) {
      toast.error("Por favor, cole um link do YouTube");
      return;
    }

    setIsLoading(true);
    const id = extractVideoId(url);

    if (!id) {
      toast.error("Link inválido. Por favor, cole um link válido do YouTube");
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    
    setVideoId(id);
    toast.success("Vídeo carregado com sucesso!");
    setIsLoading(false);
  };

  const handleDownload = async () => {
    if (!videoId || !url) {
      toast.error("Primeiro carregue um vídeo");
      return;
    }

    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { 
          url: url,
          format: format,
          quality: quality
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error("Erro ao processar o download. Tente novamente.");
        setIsDownloading(false);
        return;
      }

      if (data.success && data.downloadUrl) {
        // Open download URL in new tab
        window.open(data.downloadUrl, '_blank');
        toast.success(`Download iniciado! ${format === 'audio' ? 'MP3' : `Vídeo ${quality}p`}`);
      } else if (data.picker && data.options) {
        // If there are multiple options, use the first one
        const firstOption = data.options[0];
        if (firstOption?.url) {
          window.open(firstOption.url, '_blank');
          toast.success("Download iniciado!");
        } else {
          toast.error("Não foi possível obter o link de download");
        }
      } else {
        toast.error(data.error || "Erro ao processar o download");
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Input Section */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Cole o link do vídeo</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={handleUrlChange}
              className="flex-1"
            />
            <Button 
              onClick={handleLoadVideo} 
              variant="hero" 
              size="lg"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Carregar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Video Preview Section */}
      {videoId && (
        <div className="glass rounded-2xl overflow-hidden animate-scale-in">
          {/* Video Embed */}
          <div className="relative aspect-video bg-secondary">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Download Options */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Format Selection */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Formato</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormat("video")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    format === "video"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Vídeo MP4</span>
                  {format === "video" && <Check className="w-4 h-4 text-primary" />}
                </button>
                <button
                  onClick={() => setFormat("audio")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    format === "audio"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Music className="w-5 h-5" />
                  <span className="font-medium">Áudio MP3</span>
                  {format === "audio" && <Check className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </div>

            {/* Quality Selection (only for video) */}
            {format === "video" && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Qualidade do Vídeo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${
                        quality === option.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  {format === "video" ? (
                    <Video className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <Music className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-foreground font-semibold">
                    {format === "video" ? `Vídeo ${quality}p` : "Áudio MP3"}
                  </p>
                  <p className="text-muted-foreground text-sm">Pronto para baixar</p>
                </div>
              </div>
              
              <Button 
                onClick={handleDownload} 
                variant="glow" 
                size="xl"
                disabled={isDownloading}
                className="w-full sm:w-auto"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Baixar {format === "video" ? "Vídeo" : "MP3"}
                  </>
                )}
              </Button>
            </div>

            {/* Info Alert */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground text-sm">
                {format === "video" 
                  ? `O download será processado em qualidade ${quality}p. O arquivo abrirá em uma nova aba.`
                  : "O áudio será extraído em formato MP3 de alta qualidade."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!videoId && (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum vídeo carregado
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Cole um link do YouTube acima e clique em "Carregar" para visualizar e baixar o vídeo.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoDownloader;
