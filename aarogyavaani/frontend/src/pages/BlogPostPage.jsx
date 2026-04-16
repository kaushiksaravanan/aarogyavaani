import { useParams, Link } from 'react-router-dom'
import { Heart, ArrowLeft, Phone } from 'lucide-react'

const posts = {
  'diabetes-management': {
    title: 'Diabetes Management: A Simple Guide for Everyone',
    category: 'Health Guide',
    readTime: '8 min',
    content: `## What is Diabetes?\n\nDiabetes (also called "sugar disease" or "madhumeh") is a condition where the sugar level in your blood becomes too high. When we eat food, our body breaks it down into sugar (glucose). This sugar gives energy to our body. But to move this sugar from the blood into the body's cells, we need something called "insulin."\n\nThink of insulin as a key that opens the door of your body's cells. If the key is missing or broken, sugar cannot enter the cells and just keeps building up in the blood.\n\n## Symptoms — How to Know\n\n- Passing urine very often, especially at night\n- Feeling very thirsty all the time\n- Feeling very hungry even after eating\n- Losing weight without trying\n- Feeling tired and weak all the time\n- Blurry vision\n- Wounds that heal slowly\n- Tingling or numbness in hands and feet\n\n**Important:** Sometimes diabetes has no symptoms at all in the beginning. Everyone above 40 years should get their blood sugar checked every year.\n\n## Diet — What to Eat\n\n**Eat more:** Whole wheat roti (not maida), brown rice or limited white rice, dal and pulses, green vegetables (palak, methi, lauki, karela), salad with every meal, seasonal fruits in moderation, curd/dahi (plain, no sugar).\n\n**Eat less:** Sugar, mithai, cold drinks, fruit juice (even fresh), white bread and maida products, fried foods (pakora, samosa), potatoes and arbi in excess.\n\n**Golden rules:** Eat at fixed times. Don't skip meals. Eat smaller portions more often. Drink 8-10 glasses of water daily.\n\n## Exercise\n\nWalk briskly for 30-45 minutes daily. Simple yoga — Surya Namaskar, Pranayam. Don't sit for more than 1 hour at a stretch. Do household chores actively.\n\n## Danger Signs — Go to Hospital Immediately\n\n- Blood sugar above 300 mg/dL that won't come down\n- Blood sugar below 70 mg/dL (shaking, sweating, dizziness)\n- Becoming unconscious\n- Severe vomiting or diarrhea\n- Difficulty breathing\n- A wound on the foot turning black\n\n**Remember:** Low blood sugar can be more dangerous than high sugar. Always keep something sweet in your pocket — a toffee or sugar packet.\n\n## Government Help Available\n\n- **Primary Health Centre (PHC):** Free blood sugar testing and free diabetes medicine\n- **Ayushman Bharat card:** Treatment for complications covered up to ₹5 lakh/year\n- **Jan Aushadhi Kendra:** Diabetes medicines at 50-90% less than market price\n- **Health Helpline:** Call 104 for health guidance`,
  },
  'ayushman-bharat-guide': {
    title: 'Ayushman Bharat: How to Get Your Free ₹5 Lakh Health Card',
    category: 'Government Scheme',
    readTime: '6 min',
    content: `## What is Ayushman Bharat PM-JAY?\n\nAyushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY) is the world's largest health insurance scheme. It provides free health coverage of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.\n\n## Who is Eligible?\n\nFamilies identified in the Socio-Economic Caste Census (SECC) 2011 data are automatically eligible. This includes:\n- Families with no adult member aged 16-59\n- Families with no male adult member aged 16-59\n- SC/ST households\n- Landless households\n- Manual scavenger families\n- Destitute/living on alms\n\n## How to Check Eligibility\n\n1. Visit https://pmjay.gov.in\n2. Click "Am I Eligible"\n3. Enter your mobile number and captcha\n4. Search by name, ration card, or SECC number\n\nOr call the helpline: **14555**\n\n## How to Get Your Card\n\n1. Visit your nearest Common Service Centre (CSC) or Ayushman Mitra at an empaneled hospital\n2. Carry: Aadhaar card, ration card, any government ID\n3. Your identity will be verified\n4. Card is generated instantly — no cost!\n\n## What's Covered\n\nOver 1,500 treatment packages including: heart surgery, knee replacement, cancer treatment, kidney dialysis, and more. All pre-existing conditions are covered from day one.\n\n## Important Numbers\n\n- Helpline: **14555**\n- Website: pmjay.gov.in\n- Nearest hospital: Ask your ASHA worker or visit the website`,
  },
  'maternal-health-basics': {
    title: 'Maternal Health: What Every Expecting Mother Should Know',
    category: "Women's Health",
    readTime: '7 min',
    content: `## Confirming Pregnancy\n\nIf you've missed your period and feel nauseous, tired, or have tender breasts — you might be pregnant. Get a urine pregnancy test from any chemist (costs ₹30-50) or visit your nearest health centre for a free test.\n\n## Antenatal Checkups — Minimum 4 Visits\n\nEvery pregnant woman should have at least 4 checkups:\n- **First visit:** As soon as pregnancy is confirmed\n- **Second visit:** 4th month\n- **Third visit:** 6-7th month\n- **Fourth visit:** 8-9th month\n\nAt each visit, the ANM or doctor will check: blood pressure, weight, baby's position, and blood tests.\n\n## Nutrition During Pregnancy\n\n- **Iron tablets:** Take one every day (provided free at health centres)\n- **Folic acid:** Essential for baby's brain development\n- **Extra food:** Eat one extra meal per day. Include: milk/dahi, green leafy vegetables, dal, eggs, seasonal fruits, jaggery (gur)\n- **Avoid:** Raw papaya, excessive caffeine, alcohol, tobacco\n\n## Danger Signs — Go to Hospital IMMEDIATELY\n\n- Heavy bleeding from the vagina\n- Severe headache with blurred vision\n- High fever\n- Severe pain in the abdomen\n- Baby stops moving\n- Water breaks before time\n- Swelling of face and hands\n- Fits or convulsions\n\n## Janani Suraksha Yojana (JSY)\n\nGovernment scheme that pays women for institutional delivery:\n- **Rural areas:** ₹1,400\n- **Urban areas:** ₹1,000\n\nYour ASHA worker will help you register and guide you through the process.\n\n## After Delivery\n\n- Start breastfeeding within 1 hour of birth\n- Exclusive breastfeeding for 6 months (no water, no other food)\n- Get the baby vaccinated on schedule\n- Mother should eat well and rest`,
  },
  'blood-sugar-warning-signs': {
    title: '5 Warning Signs Your Blood Sugar Is Too High',
    category: 'Health Alert',
    readTime: '4 min',
    content: `## 1. Excessive Thirst (Polydipsia)\n\nIf you find yourself constantly thirsty no matter how much water you drink, this could be a sign of high blood sugar. When sugar builds up in your blood, your kidneys work overtime to filter it out, pulling extra water from your body.\n\n## 2. Frequent Urination\n\nGoing to the bathroom much more often than usual — especially waking up multiple times at night — is one of the earliest signs. This is directly connected to the excess thirst.\n\n## 3. Blurry Vision\n\nHigh blood sugar can cause the lens in your eye to swell, making your vision blurry or foggy. If things look unclear that used to be clear, get your sugar tested.\n\n## 4. Wounds That Won't Heal\n\nA small cut or scratch that takes weeks to heal is a warning sign. High sugar levels damage blood vessels and slow down the body's healing process.\n\n## 5. Tingling in Hands and Feet\n\nA pins-and-needles sensation or numbness in your hands and feet can indicate nerve damage from prolonged high blood sugar (diabetic neuropathy).\n\n## What to Do\n\n- Get a fasting blood sugar test at your nearest health centre (free at government hospitals)\n- Normal: below 100 mg/dL\n- Pre-diabetes: 100-125 mg/dL\n- Diabetes: 126 mg/dL or above\n\n**Don't ignore these signs.** Early detection and management can prevent serious complications. Call AarogyaVaani for guidance in your language.`,
  },
  'government-health-schemes': {
    title: '4 Government Health Schemes Every Indian Family Should Know',
    category: 'Government Scheme',
    readTime: '5 min',
    content: `## 1. Ayushman Bharat PM-JAY\n\n**What:** Free health insurance up to ₹5 lakh per family per year\n**Who:** BPL families identified in SECC 2011\n**How:** Visit nearest CSC with Aadhaar card. Call 14555.\n\n## 2. Janani Suraksha Yojana (JSY)\n\n**What:** Cash incentive for institutional delivery\n**Who:** All pregnant women in government hospitals\n**How:** Register through your ASHA worker. Rural: ₹1,400, Urban: ₹1,000.\n\n## 3. Jan Aushadhi Kendra\n\n**What:** Government stores selling medicines at 50-90% cheaper rates\n**Who:** Everyone — no card or registration needed\n**How:** Find your nearest store at janaushadhi.gov.in\n\n## 4. National Health Mission — Health & Wellness Centres\n\n**What:** Free primary healthcare, screening, and medicines at village level\n**Who:** Everyone\n**How:** Visit your nearest Health & Wellness Centre\n\n## Important Numbers\n\n| Service | Number |\n|---------|--------|\n| Health Helpline | 104 |\n| Ambulance | 108 |\n| Ayushman Bharat | 14555 |\n| Women Helpline | 181 |\n| Child Helpline | 1098 |`,
  },
  'voice-ai-healthcare': {
    title: 'Why Voice AI Is the Future of Healthcare in Rural India',
    category: 'Technology',
    readTime: '5 min',
    content: `## The Problem\n\nIndia has over 500 million people who struggle with reading text on smartphones. In rural areas, the doctor-to-patient ratio is 1:25,000 compared to WHO's recommended 1:1,000. Health apps exist, but they require literacy, internet navigation skills, and often English proficiency.\n\n## Why Voice Changes Everything\n\nVoice is the most natural human interface. It requires:\n- No reading ability\n- No app navigation skills\n- No typing\n- Just a basic phone call\n\nA farmer in Uttar Pradesh or a grandmother in Karnataka can simply call a number and speak in their language to get health guidance.\n\n## How AarogyaVaani Works\n\n1. **You call** — using any phone\n2. **You speak** — in Hindi, English, or Kannada\n3. **AI understands** — using advanced speech recognition\n4. **Knowledge is searched** — from verified health databases using vector search\n5. **You hear back** — simple, accurate guidance in your language\n6. **It remembers** — your health history for better guidance next time\n\n## The Technology Behind It\n\n- **Vapi:** Handles real-time voice conversations\n- **Qdrant:** Vector database for semantic health knowledge search\n- **GPT-4o:** Understands context and generates simple, accurate responses\n- **Deepgram:** Converts speech to text in multiple Indian languages\n\n## The Impact\n\nVoice AI can serve as a first point of contact for basic health queries, freeing up doctors for complex cases. It can provide 24/7 guidance in local languages, remind patients about medications, and help navigate government health schemes.\n\nThis isn't about replacing doctors — it's about reaching the millions who currently have no access to any health guidance at all.`,
  },
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = posts[slug]

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fffdf9', fontFamily: '"Inter", system-ui, sans-serif' }}>
        <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '3rem', color: 'hsl(28 45% 15%)' }}>Article not found</h1>
        <Link to="/blog" style={{ marginTop: '1.5rem', color: 'hsl(28 45% 57%)', textDecoration: 'none', fontWeight: 600 }}>← Back to Blog</Link>
      </div>
    )
  }

  // Simple markdown-ish renderer
  const renderContent = (content) => {
    return content.split('\n\n').map((block, i) => {
      if (block.startsWith('## ')) {
        return <h2 key={i} style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.5rem', color: 'hsl(28 45% 15%)', marginTop: '2rem', marginBottom: '0.75rem' }}>{block.slice(3)}</h2>
      }
      if (block.startsWith('- ')) {
        const items = block.split('\n').filter(l => l.startsWith('- '))
        return (
          <ul key={i} style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
            {items.map((item, j) => (
              <li key={j} style={{ fontSize: '0.95rem', color: 'hsl(45 21% 30%)', lineHeight: 1.8, marginBottom: '0.25rem' }}>
                {item.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, k) => {
                  if (part.includes('</strong>')) {
                    const [bold, rest] = part.split('</strong>')
                    return <span key={k}><strong style={{ color: 'hsl(28 45% 15%)' }}>{bold}</strong>{rest}</span>
                  }
                  return part
                })}
              </li>
            ))}
          </ul>
        )
      }
      if (block.startsWith('|')) {
        // Simple table
        const rows = block.split('\n').filter(r => r.trim() && !r.match(/^\|[-\s|]+\|$/))
        return (
          <table key={i} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                    <td key={ci} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(34,22,14,0.08)', fontSize: '0.9rem', color: ri === 0 ? 'hsl(28 45% 15%)' : 'hsl(45 21% 30%)', fontWeight: ri === 0 ? 600 : 400 }}>
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
      // Regular paragraph — handle **bold**
      return (
        <p key={i} style={{ fontSize: '0.95rem', color: 'hsl(45 21% 30%)', lineHeight: 1.8, marginBottom: '1rem' }}>
          {block.split(/\*\*(.*?)\*\*/).map((part, k) => 
            k % 2 === 1 ? <strong key={k} style={{ color: 'hsl(28 45% 15%)' }}>{part}</strong> : part
          )}
        </p>
      )
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffdf9' }}>
      <nav style={{ borderBottom: '1px solid rgba(34,22,14,0.06)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '48rem', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <Heart style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(28 45% 57%)', fill: 'currentColor' }} />
          <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.1rem', color: '#1b130d' }}>AarogyaVaani</span>
        </Link>
        <Link to="/blog" style={{ fontSize: '0.85rem', color: 'hsl(45 21% 40%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> All Articles
        </Link>
      </nav>

      <article style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'hsl(28 45% 57%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.category} · {post.readTime} read</span>
        <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'hsl(28 45% 15%)', letterSpacing: '-0.035em', marginTop: '0.75rem', marginBottom: '2rem', lineHeight: 1.15 }}>{post.title}</h1>
        {renderContent(post.content)}
        
        {/* CTA */}
        <div style={{ marginTop: '3rem', padding: '2rem', borderRadius: '1.4rem', background: 'linear-gradient(180deg, hsl(28 45% 13%), hsl(28 45% 10%))', textAlign: 'center' }}>
          <p style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '1.3rem', color: 'hsl(45 21% 95%)', marginBottom: '0.5rem' }}>Have questions about this topic?</p>
          <p style={{ fontSize: '0.85rem', color: 'hsl(45 21% 65%)', marginBottom: '1.25rem' }}>Talk to AarogyaVaani — get answers in your language, right now.</p>
          <Link to="/call" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(28 45% 57%)', color: 'white', padding: '0.75rem 2rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            <Phone style={{ width: '1rem', height: '1rem' }} /> Call AarogyaVaani
          </Link>
        </div>
      </article>
    </div>
  )
}
