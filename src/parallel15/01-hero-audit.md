# Gitmore Header + Hero Audit

Source refs: `script_chunks.txt:1427`, `script_chunks.txt:44245`, `Git Reporting Tool - Automated Reports to Slack & Email.html:449`

## Header

- Exact visible copy:
  - Logo text: `gitmore.io`
  - Nav: `Features`, `Use Cases`, `How It Works`, `Pricing`
  - CTA: `Get Started`
- Exact structure/classes:
  - Header shell: `absolute top-0 left-0 right-0 z-50 w-full py-4 px-6`
  - Inner row: `flex items-center justify-between max-w-5xl mx-auto`
  - Logo link: `flex items-center gap-2 font-serif text-2xl font-bold text-white`
  - Nav: `hidden md:flex items-center gap-8`
  - Nav links: `text-sm text-white hover:text-white/80 transition-colors`
  - CTA wrapper: `hidden md:flex items-center`
  - CTA classes: `inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer h-9 px-3 rounded-full bg-white text-foreground hover:bg-white/90`
  - Mobile menu button: `md:hidden text-white p-2`
- Exact widths/max widths:
  - Header is `w-full`
  - Inner container is `max-w-5xl` = `64rem`
  - Logo image is `36x36`
- Visual notes:
  - Header is absolutely overlaid on top of the hero, not boxed or separated.
  - All visible header text is white.
  - Desktop nav + CTA are hidden below `md`; logo text is hidden below `sm` via `hidden sm:inline`.

## Hero

- Exact visible copy:
  - H1 line 1: `Git Reporting` (italic) + ` Tool`
  - H1 line 2: `Keep ` + `Everyone` (italic) + ` Updated`
  - Description: `Turns your commits and PRs into clear team updates delivered daily or weekly to Slack or email.`
  - Support line: `Works with Github, Gitlab, and Bitbucket.`
  - Primary CTA: `Get Started Free`
  - Secondary CTA: `View Demo Report`
  - Small note: `No credit card required`
- Exact structure/classes:
  - Section: `relative w-full overflow-hidden`
  - Background layer: `absolute inset-x-0 top-0 h-[140vh] pointer-events-none`
  - Main container: `relative max-w-7xl mx-auto px-6 pt-48 pb-16`
  - Text block: `text-center max-w-4xl mx-auto`
  - H1: `font-serif text-4xl md:text-5xl lg:text-7xl leading-tight text-balance text-white`
  - Description: `mt-8 text-white/90 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed hero-description`
  - Support line: `mt-4 text-white/70 text-base md:text-lg`
  - CTA row wrapper: `mt-10 flex flex-col sm:flex-row items-center justify-center gap-4`
  - CTA inner row: `flex flex-col sm:flex-row items-center justify-center gap-4`
  - Primary CTA classes: `inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer h-10 rounded-full bg-white text-foreground hover:bg-white/90 px-8 py-6 text-base font-medium`
  - Secondary CTA classes: `inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer h-10 rounded-full text-white border border-white/50 hover:bg-white/10 hover:text-white px-8 py-6 text-base font-medium`
  - Small note: `mt-4 text-white/50 text-xs`
  - Demo wrapper: `mt-24 w-full max-w-5xl mx-auto`
  - Demo card: `relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl`
- Exact widths/max widths:
  - Main hero container: `max-w-7xl` = `80rem`
  - Text block: `max-w-4xl` = `56rem`
  - Description: `max-w-3xl` = `48rem`
  - Demo block: `max-w-5xl` = `64rem`
  - Spacing from utility scale: `px-6` = `1.5rem`, `pt-48` = `12rem`, `pb-16` = `4rem`, `mt-8` = `2rem`, `mt-10` = `2.5rem`, `mt-24` = `6rem`, `gap-4` = `1rem`
  - Text sizes from utility scale: `text-4xl` = `2.25rem`, `md:text-5xl` = `3rem`, `lg:text-7xl` = `4.5rem`, `text-lg` = `1.125rem`, `md:text-xl` = `1.25rem`, `text-base` = `1rem`, `text-xs` = `0.75rem`
- Exact CTA targets:
  - Primary CTA href: `https://app.gitmore.io`
  - Secondary CTA href: `/example.html`
- Exact iframe:
  - Wrapper inline style: `position:relative;padding-bottom:calc(54.6958% + 41px);height:0;width:100%`
  - `title`: `Connect a GitHub Repository and Set Up Automated Email Updates`
  - `src`: `https://demo.arcade.software/5tZyFDhp1myCosw6e1po?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true`
  - `width`: `1024`
  - `height`: `560`
  - iframe inline style: `position:absolute;top:0;left:0;width:100%;height:100%;color-scheme:light`
- Visual notes:
  - Hero is center-aligned throughout.
  - Overall look is white typography on a dark warm grain-gradient background.
  - Background effect is a `GrainGradient` with colors `#c38e60`, `#beae60`, `#c38e60`, `colorBack: #000a0f`, `shape: wave`, `softness: 0.72`, `intensity: 0.32`, `noise: 0.5`, `rotation: 8`.
  - `Git Reporting` and `Everyone` are the only italicized words in the H1.
  - Platform names in the support line are white + semibold; surrounding copy is `text-white/70`.
  - Primary CTA is a solid white pill; secondary CTA is a transparent pill with `border-white/50` and white text.
  - The secondary CTA includes a small envelope icon before the label.
  - The embed sits inside a rounded, slightly blurred, translucent card with a thin white border and deep shadow.
