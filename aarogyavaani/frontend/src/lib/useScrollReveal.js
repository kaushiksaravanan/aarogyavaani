import { useEffect } from 'react'

export default function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target) // one-shot
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    // Observe all elements with data-reveal attribute
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))
    // Also observe stagger items
    document.querySelectorAll('.stagger-item').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
