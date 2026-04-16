import { Link } from 'react-router-dom'
import { Phone, Brain, Globe, Shield, Heart, ArrowRight, Mic, MessageCircle, Clock } from 'lucide-react'

const features = [
  {
    icon: Globe,
    title: 'Multilingual Voice AI',
    description: 'Speaks Hindi, English, and Kannada. Auto-detects your language and responds naturally.',
  },
  {
    icon: Brain,
    title: 'Smart Health Knowledge',
    description: 'Powered by Qdrant vector search over verified health information, government schemes, and protocols.',
  },
  {
    icon: Clock,
    title: 'Remembers You',
    description: 'Persistent memory across calls. Recalls your health history, preferences, and past conversations.',
  },
  {
    icon: Shield,
    title: 'Safe & Trustworthy',
    description: 'Never diagnoses. Always recommends seeing a doctor. Emergency guidance for critical situations.',
  },
]

const steps = [
  { step: '01', title: 'Start a Call', description: 'Click the call button or dial the phone number. No app download needed.' },
  { step: '02', title: 'Speak Naturally', description: 'Ask about symptoms, medicines, government schemes, or diet — in your language.' },
  { step: '03', title: 'Get Guidance', description: 'Receive accurate, simple health information sourced from verified medical knowledge.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary-600" fill="currentColor" />
            <span className="text-xl font-bold text-gray-900">AarogyaVaani</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Dashboard
            </Link>
            <Link
              to="/call"
              className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Start Call
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Mic className="w-4 h-4" />
            Powered by Vapi + Qdrant AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Healthcare guidance
            <br />
            <span className="text-primary-600">in your voice</span>
          </h1>
          <p className="text-lg text-text-secondary mt-6 max-w-2xl mx-auto leading-relaxed">
            AarogyaVaani is a voice-first AI assistant that provides accessible healthcare information 
            in Hindi, English, and Kannada — designed for rural India where reading apps isn't an option.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              to="/call"
              className="bg-primary-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Talk to AarogyaVaani
            </Link>
            <a
              href="#features"
              className="text-text-secondary px-6 py-3.5 rounded-xl text-base font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Hero visual */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-8 border border-primary-200/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm flex-1">
                <p className="text-sm text-gray-800">नमस्ते! मैं आरोग्यवाणी हूं। बताइए, आज मैं आपकी क्या मदद कर सकती हूं?</p>
              </div>
            </div>
            <div className="flex items-start gap-4 justify-end mb-4">
              <div className="bg-primary-600 rounded-xl rounded-tr-none p-4 shadow-sm max-w-sm">
                <p className="text-sm text-white">मुझे शुगर है, खाने में क्या ध्यान रखना चाहिए?</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm flex-1">
                <p className="text-sm text-gray-800">बहुत अच्छा सवाल! शुगर में रोटी, दाल, हरी सब्ज़ियां खाएं। चीनी और मीठा कम करें। करेला शुगर कम करने में मदद करता है...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built for real impact</h2>
            <p className="text-text-secondary mt-3 max-w-xl mx-auto">
              Voice-first, multilingual, and designed with empathy for users who can't read apps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="bg-surface-elevated rounded-xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-text-secondary mt-3">Three steps to accessible healthcare guidance.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary-200 mb-3">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to try AarogyaVaani?</h2>
          <p className="text-primary-100 mt-3">Free. No sign-up needed. Just click and talk.</p>
          <Link
            to="/call"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-50 transition-all mt-8 shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Start Your First Call
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary-600" fill="currentColor" />
            <span className="text-sm font-semibold text-gray-900">AarogyaVaani</span>
          </div>
          <p className="text-xs text-text-muted">Built for HackBLR 2026 — Vapi x Qdrant Hackathon</p>
        </div>
      </footer>
    </div>
  )
}
