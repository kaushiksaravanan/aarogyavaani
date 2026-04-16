import { Link } from 'react-router-dom'
import { Heart, ArrowLeft, Clock } from 'lucide-react'

const articles = [
  { slug: 'diabetes-management', title: 'Diabetes Management: A Simple Guide for Everyone', category: 'Health Guide', readTime: '8 min', excerpt: 'Everything you need to know about managing diabetes — from diet and exercise to medicine and checkups. Written in simple language for patients and caregivers.', color: 'hsl(28 45% 57%)' },
  { slug: 'ayushman-bharat-guide', title: 'Ayushman Bharat: How to Get Your Free ₹5 Lakh Health Card', category: 'Government Scheme', readTime: '6 min', excerpt: 'Step-by-step guide to checking eligibility, getting your PM-JAY card, and accessing free treatment at empaneled hospitals across India.', color: 'hsl(142 45% 40%)' },
  { slug: 'maternal-health-basics', title: 'Maternal Health: What Every Expecting Mother Should Know', category: "Women's Health", readTime: '7 min', excerpt: 'From antenatal checkups to danger signs, nutrition tips, and the Janani Suraksha Yojana — a complete guide for safe motherhood.', color: 'hsl(330 45% 45%)' },
  { slug: 'blood-sugar-warning-signs', title: '5 Warning Signs Your Blood Sugar Is Too High', category: 'Health Alert', readTime: '4 min', excerpt: 'Learn to recognize the early symptoms of high blood sugar before they become serious. Simple signs that anyone can check at home.', color: 'hsl(0 55% 50%)' },
  { slug: 'government-health-schemes', title: '4 Government Health Schemes Every Indian Family Should Know', category: 'Government Scheme', readTime: '5 min', excerpt: 'From Ayushman Bharat to Jan Aushadhi Kendras — free and affordable healthcare options available to every Indian citizen.', color: 'hsl(142 45% 40%)' },
  { slug: 'voice-ai-healthcare', title: 'Why Voice AI Is the Future of Healthcare in Rural India', category: 'Technology', readTime: '5 min', excerpt: 'How voice-first AI assistants like AarogyaVaani are bridging the healthcare gap for 500 million Indians who can\'t read health apps.', color: 'hsl(220 45% 50%)' },
]

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fffdf9' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(34,22,14,0.06)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '64rem', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Heart style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(28 45% 57%)', fill: 'currentColor' }} />
          <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.1rem', color: '#1b130d' }}>AarogyaVaani</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'hsl(45 21% 40%)', textDecoration: 'none' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Home
        </Link>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
        <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em' }}>
          Health <span style={{ fontStyle: 'italic', color: 'hsl(28 45% 57%)' }}>knowledge</span> for everyone
        </h1>
        <p style={{ color: 'hsl(45 21% 40%)', marginTop: '0.75rem', maxWidth: '28rem', marginInline: 'auto' }}>Simple, accurate health articles in plain language.</p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {articles.map(a => (
          <Link key={a.slug} to={`/blog/${a.slug}`} style={{
            textDecoration: 'none', padding: '1.5rem', borderRadius: '1.4rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,241,0.98))',
            border: '1px solid rgba(34,22,14,0.08)', boxShadow: '0 26px 90px rgba(76,46,18,0.08)',
            transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
            display: 'flex', flexDirection: 'column',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(158,92,31,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(34,22,14,0.08)'; }}
          >
            <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 600, color: a.color, background: `${a.color}15`, padding: '0.2rem 0.65rem', borderRadius: '999px', marginBottom: '0.75rem', alignSelf: 'flex-start' }}>{a.category}</span>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.2rem', color: 'hsl(28 45% 15%)', lineHeight: 1.3, marginBottom: '0.5rem' }}>{a.title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', lineHeight: 1.6, flex: 1 }}>{a.excerpt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1rem', fontSize: '0.78rem', color: 'hsl(45 21% 55%)' }}>
              <Clock style={{ width: '0.85rem', height: '0.85rem' }} /> {a.readTime} read
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
