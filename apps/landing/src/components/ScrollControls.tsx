'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ScrollIndicator() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleScrollDown = () => {
    const nextSection = document.querySelector('section:nth-of-type(2)')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <motion.button
      onClick={handleScrollDown}
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 p-2 rounded-full hover:bg-primary/10 transition-colors group"
      aria-label="Scroll down"
    >
      <div className="w-6 h-10 border-2 border-foreground/40 dark:border-foreground/60 rounded-full flex justify-center group-hover:border-primary transition-colors">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1 h-2 bg-foreground/40 dark:bg-foreground/60 rounded-full mt-2 group-hover:bg-primary transition-colors"
        />
      </div>
    </motion.button>
  )
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [bottomPosition, setBottomPosition] = useState('2rem')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }

      // Calculate distance from footer and adjust button position
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const distanceFromBottom = scrollableHeight - window.scrollY

      // If within 200px of footer, move button up to sit at footer top
      if (distanceFromBottom < 200) {
        setBottomPosition(`${distanceFromBottom + 1}px`)
      } else {
        setBottomPosition('2rem')
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          style={{ bottom: bottomPosition }}
          className="fixed z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all right-8"
          aria-label="Back to top"
        >
          <ChevronUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export function BackToTopButtonWrapper() {
  return <BackToTopButton />
}
