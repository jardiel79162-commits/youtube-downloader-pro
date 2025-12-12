import { Download, Youtube } from "lucide-react";

const Header = () => {
  return (
    <header className="text-center mb-12 animate-fade-in">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
            <Youtube className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-secondary border-2 border-background flex items-center justify-center">
            <Download className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
        <span className="text-foreground">YouTube </span>
        <span className="text-gradient">Downloader</span>
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
        Baixe seus vídeos favoritos do YouTube de forma rápida e fácil. 
        Cole o link e pronto!
      </p>

      {/* Decorative line */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
      </div>
    </header>
  );
};

export default Header;
