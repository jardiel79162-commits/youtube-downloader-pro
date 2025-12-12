import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Play, Link2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const VideoDownloader = () => {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{ title: string; thumbnail: string } | null>(null);

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
      setVideoInfo(null);
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

    // Simulating API call to get video info
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setVideoId(id);
    setVideoInfo({
      title: "Vídeo do YouTube",
      thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    });
    
    toast.success("Vídeo carregado com sucesso!");
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!videoId) {
      toast.error("Primeiro carregue um vídeo");
      return;
    }

    // Open a download service (using a common YouTube download service)
    const downloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
    window.open(downloadUrl, "_blank");
    toast.info("Redirecionando para o serviço de download...");
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

          {/* Download Section */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">Vídeo pronto!</p>
                  <p className="text-muted-foreground text-sm">Clique para baixar</p>
                </div>
              </div>
              
              <Button 
                onClick={handleDownload} 
                variant="glow" 
                size="xl"
                className="w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                Baixar Vídeo
              </Button>
            </div>

            {/* Info Alert */}
            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground text-sm">
                Você será redirecionado para um serviço externo para completar o download. 
                Escolha a qualidade desejada na página de download.
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
