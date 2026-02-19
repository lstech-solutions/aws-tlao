'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const CARDS = [
  {
    img: `${basePath}/tlao-plan-logo.png`,
    title: 'TLÁO Plan',
    description: 'Execution Planning',
    section: 'agents',
  },
  {
    img: `${basePath}/tlao-grant-logo.png`,
    title: 'TLÁO Grant',
    description: 'Grant Discovery',
    section: 'agents',
  },
  {
    img: `${basePath}/tlao-builder-logo.png`,
    title: 'TLÁO Builder',
    description: 'Agent Creation',
    section: 'agents',
  },
  {
    img: `${basePath}/tlao-email-logo.png`,
    title: 'TLÁO Email',
    description: 'Email Automation',
    section: 'agents',
  },
]

function ThreeDPhotoCarousel() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const ringRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Drag state
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const currentAngle = useRef(0)
  const angleAtDragStart = useRef(0)
  const autoRotateRAF = useRef<number>(0)
  const isAutoRotating = useRef(true)
  const lastTimestamp = useRef(0)
  const autoResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const faceCount = CARDS.length
  const faceWidth = isMobile ? 180 : 260
  const radius = Math.round(faceWidth / (2 * Math.tan(Math.PI / faceCount)))

  const applyRotation = useCallback((angle: number) => {
    if (ringRef.current) {
      ringRef.current.style.transform = `rotateY(${angle}deg)`
    }
  }, [])

  // Auto-rotate loop
  useEffect(() => {
    const speed = 0.3 // degrees per frame (~18deg/s)
    const animate = (timestamp: number) => {
      if (lastTimestamp.current === 0) lastTimestamp.current = timestamp
      const delta = timestamp - lastTimestamp.current
      lastTimestamp.current = timestamp

      if (isAutoRotating.current && expandedCard === null) {
        currentAngle.current += speed * (delta / 16)
        applyRotation(currentAngle.current)
      }
      autoRotateRAF.current = requestAnimationFrame(animate)
    }
    autoRotateRAF.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(autoRotateRAF.current)
  }, [applyRotation, expandedCard])

  // Drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (expandedCard !== null) return
      isDragging.current = true
      isAutoRotating.current = false
      dragStartX.current = e.clientX
      angleAtDragStart.current = currentAngle.current
      if (autoResumeTimer.current) clearTimeout(autoResumeTimer.current)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [expandedCard]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - dragStartX.current
      const sensitivity = 0.4
      currentAngle.current = angleAtDragStart.current + dx * sensitivity
      applyRotation(currentAngle.current)
    },
    [applyRotation]
  )

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    // Resume auto-rotate after 2s of inactivity
    autoResumeTimer.current = setTimeout(() => {
      isAutoRotating.current = true
    }, 2000)
  }, [])

  const handleClick = (index: number) => {
    if (isDragging.current) return
    if (expandedCard === index) {
      setExpandedCard(null)
      isAutoRotating.current = true
      return
    }
    isAutoRotating.current = false
    const angle = -(index * (360 / faceCount))
    currentAngle.current = angle
    if (ringRef.current) {
      ringRef.current.style.transition = 'transform 0.8s cubic-bezier(0.32,0.72,0,1)'
      applyRotation(angle)
      setTimeout(() => {
        if (ringRef.current) ringRef.current.style.transition = ''
        setExpandedCard(index)
      }, 800)
    }
  }

  const handleLearnMore = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => {
      setExpandedCard(null)
      isAutoRotating.current = true
    }, 400)
  }

  const handleClose = () => {
    setExpandedCard(null)
    isAutoRotating.current = true
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative mx-auto overflow-visible select-none"
        style={{
          perspective: '1200px',
          height: `${faceWidth + 60}px`,
          width: '100%',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={ringRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${faceWidth}px`,
            height: `${faceWidth}px`,
            marginLeft: `${-faceWidth / 2}px`,
            marginTop: `${-faceWidth / 2}px`,
            transformStyle: 'preserve-3d',
          }}
        >
          {CARDS.map((card, i) => {
            const angle = i * (360 / faceCount)
            return (
              <div
                key={i}
                onClick={() => handleClick(i)}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/50 backdrop-blur-xl border border-primary/20 cursor-pointer hover:border-primary/50 transition-colors duration-300"
                style={{
                  width: `${faceWidth}px`,
                  height: `${faceWidth}px`,
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-4/5 h-4/5 object-contain drop-shadow-lg pointer-events-none"
                  draggable={false}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Learn More overlay */}
      <AnimatePresence>
        {expandedCard !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 flex flex-col items-center gap-3 z-50"
          >
            <h3 className="text-2xl font-semibold text-foreground">{CARDS[expandedCard].title}</h3>
            <p className="text-muted-foreground">{CARDS[expandedCard].description}</p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleLearnMore(CARDS[expandedCard!].section)}
                className="group bg-primary/90 hover:bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Learn More
                <svg
                  className="inline-block ml-2 w-4 h-4 group-hover:translate-y-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground px-4 py-3 rounded-full transition-colors duration-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { ThreeDPhotoCarousel }
