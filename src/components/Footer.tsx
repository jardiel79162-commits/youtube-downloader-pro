import { Heart, Code } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-16 pb-8 text-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
      <div className="glass rounded-2xl p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Code className="w-4 h-4" />
          <span>Desenvolvido com</span>
          <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
          <span>por</span>
        </div>
        <p className="mt-2 text-xl font-bold text-gradient">
          Jardiel
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Criador da JTC
        </p>
      </div>

      {/* Copyright */}
      <p className="mt-6 text-muted-foreground/60 text-sm">
        © {new Date().getFullYear()} JTC. Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default Footer;
