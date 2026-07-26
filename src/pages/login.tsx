import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, ArrowRight, Zap } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-canvas text-ink selection:bg-surface-2 relative overflow-hidden flex items-center justify-center font-sans">
        {/* Depth Background */}
        <div className="bg-vignette" />
        <div className="bg-sphere top-[-20%] left-[-10%] opacity-20" />
        <div className="bg-sphere bottom-[-20%] right-[-10%] opacity-20" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} />

        <div className="max-w-xl w-full px-10 relative z-10">
          <div className="glass-3d p-16 text-center group">
            <img 
              src="/logo.png" 
              alt="Saubol Logo" 
              className="w-24 h-24 object-contain mx-auto mb-12 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform duration-500"
            />
            
            <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-400">Secure Authentication</span>
            </div>
            
            <h1 className="text-5xl font-black tracking-tighter mb-6 text-shimmer">
              WELCOME BACK.
            </h1>
            
            <p className="text-ink-muted font-medium mb-16 leading-relaxed">
              Входи в свой аккаунт, чтобы продолжить путь к топовому баллу и университету мечты.
            </p>
            
            <div className="space-y-6">
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-100 h-20 rounded-2xl font-black tracking-widest uppercase text-xs shadow-[0_15px_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#000000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#000000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#000000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#000000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "AUTHENTICATING..." : "CONTINUE WITH GOOGLE"}
              </Button>
              
              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-surface" />
                <span className="text-[10px] font-black text-[#222] uppercase tracking-[0.3em]">Institutional Access</span>
                <div className="h-px flex-1 bg-surface" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-surface rounded-2xl border border-line flex flex-col items-center">
                    <Zap className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="text-[9px] font-black text-ink-subtle uppercase tracking-widest">Fast Access</span>
                 </div>
                 <div className="p-6 bg-surface rounded-2xl border border-line flex flex-col items-center">
                    <Sparkles className="w-5 h-5 text-yellow-400 mb-2" />
                    <span className="text-[9px] font-black text-ink-subtle uppercase tracking-widest">Premium UI</span>
                 </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-line text-[9px] font-bold text-[#333] uppercase tracking-[0.3em] leading-relaxed">
              By authenticating, you confirm your adherence to the Saubol Academic Excellence Guidelines and Privacy Protocols.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
