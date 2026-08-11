import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type SeatStatus = 'available' | 'occupied' | 'selected'
type Screen = 'detail' | 'success'

interface Seat {
  id: string
  row: string
  num: number
  status: SeatStatus
}

// ─── Seat data ────────────────────────────────────────────────────────────────

const ROWS = ['A', 'B', 'C', 'D', 'E']
const COLS = 6
const OCCUPIED: Set<string> = new Set(['A2', 'A5', 'B1', 'B4', 'C3', 'C6', 'D2', 'D5', 'E1', 'E4'])

function buildSeats(): Seat[] {
  const seats: Seat[] = []
  for (const row of ROWS) {
    for (let n = 1; n <= COLS; n++) {
      const id = `${row}${n}`
      seats.push({ id, row, num: n, status: OCCUPIED.has(id) ? 'occupied' : 'available' })
    }
  }
  return seats
}

// ─── Confetti canvas ─────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; size: number; rotation: number; rv: number; life: number
}

const PALETTE = ['#8B5CF6', '#C4B5FD', '#F59E0B', '#F5415B', '#34D399', '#60A5FA', '#FBBF24']

function useConfetti(active: boolean, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const particles = useRef<Particle[]>([])
  const raf = useRef<number>(0)

  const spawn = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width
    for (let i = 0; i < 140; i++) {
      particles.current.push({
        x: W / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 9,
        vy: -(Math.random() * 12 + 4),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: Math.random() * 7 + 4,
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 8,
        life: 1,
      })
    }
  }, [canvasRef])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    particles.current = []
    spawn()

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.current = particles.current.filter(p => p.life > 0.01)
      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.35
        p.vx *= 0.98
        p.rotation += p.rv
        p.life -= 0.012
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      }
      if (particles.current.length > 0) raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [active, spawn, canvasRef])
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PressButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const scale = !disabled && pressed ? 'scale(0.95)' : hovered && !disabled ? 'scale(1.04)' : 'scale(1)'
  const bgColor = disabled ? '#2a2a35' : hovered ? '#7c3aed' : '#8b5cf6'
  const textColor = disabled ? '#555' : '#fff'
  const boxShadow = !disabled && hovered
    ? '0 8px 32px rgba(139,92,246,0.55), 0 0 0 1px rgba(196,181,253,0.3)'
    : !disabled
    ? '0 4px 16px rgba(139,92,246,0.3)'
    : 'none'

  const shimmerOpacity = hovered && !disabled ? 1 : 0

  return (
    <button
      className={`relative overflow-hidden rounded-2xl px-6 py-4 font-semibold text-sm tracking-wide select-none border-0 outline-none ${className}`}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => { setPressed(false); setHovered(false) }}
      onPointerEnter={() => !disabled && setHovered(true)}
      style={{
        background: variant === 'primary' ? bgColor : 'transparent',
        color: variant === 'primary' ? textColor : hovered ? '#c4b5fd' : '#aaa',
        transform: scale,
        transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), background 0.15s ease, box-shadow 0.15s ease',
        boxShadow: variant === 'primary' ? boxShadow : 'none',
        border: variant === 'ghost' ? `1px solid ${hovered ? '#8b5cf6' : '#2e2e3a'}` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Shimmer overlay */}
      {variant === 'primary' && (
        <span
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% -10%, rgba(196,181,253,0.5) 0%, transparent 65%)',
            opacity: shimmerOpacity,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}

function SeatGrid({
  seats,
  onToggle,
}: {
  seats: Seat[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Screen indicator */}
      <div className="mb-3 flex flex-col items-center gap-1">
        <div
          className="w-40 h-1.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #8B5CF6, transparent)' }}
        />
        <span className="text-[10px] text-[#555] tracking-widest uppercase">Screen</span>
      </div>

      {ROWS.map(row => (
        <div key={row} className="flex items-center gap-1.5">
          <span className="w-4 text-[10px] text-[#555] font-mono text-right">{row}</span>
          <div className="flex gap-1.5">
            {seats
              .filter(s => s.row === row)
              .map(seat => {
                const isOccupied = seat.status === 'occupied'
                const isSelected = seat.status === 'selected'
                return (
                  <button
                    key={seat.id}
                    disabled={isOccupied}
                    onClick={() => !isOccupied && onToggle(seat.id)}
                    className={`w-8 h-7 rounded-md text-[10px] font-mono transition-all duration-150 select-none
                      ${isOccupied ? 'bg-[#1e1e26] text-[#333] cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-violet-500 text-white shadow-md shadow-violet-900/60 scale-110' : ''}
                      ${!isOccupied && !isSelected ? 'bg-[#252530] text-[#666] hover:bg-[#2e2e3d] hover:text-violet-300 cursor-pointer' : ''}
                    `}
                    style={isSelected ? { boxShadow: '0 0 0 2px #8B5CF6' } : {}}
                  >
                    {seat.num}
                  </button>
                )
              })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-[#555]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#252530] inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-violet-500 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#1e1e26] inline-block" /> Taken
        </span>
      </div>
    </div>
  )
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  seats,
  onToggle,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  seats: Seat[]
  onToggle: (id: string) => void
  onConfirm: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const selected = seats.filter(s => s.status === 'selected')

  useEffect(() => {
    if (open) { setMounted(true); setExiting(false) }
  }, [open])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => { setMounted(false); onClose() }, 340)
  }

  if (!mounted) return null

  const total = selected.length * 18.5

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: exiting ? 0 : 1, transition: 'opacity 0.34s ease' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative z-10 rounded-t-3xl overflow-hidden ${exiting ? 'sheet-exit' : 'sheet-enter'}`}
        style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-base" style={{ fontFamily: 'var(--font-display)' }}>
              Choose Your Seats
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-[#1e1e26] text-[#888] flex items-center justify-center text-sm hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <SeatGrid seats={seats} onToggle={onToggle} />

          {/* Price summary */}
          <div
            className="mt-5 rounded-2xl p-4 flex items-center justify-between"
            style={{ background: '#0d0d12', border: '1px solid #1e1e28' }}
          >
            <div>
              <p className="text-[#555] text-xs mb-0.5">
                {selected.length > 0 ? `${selected.length} seat${selected.length > 1 ? 's' : ''} selected` : 'No seats selected'}
              </p>
              <p className="text-white font-semibold text-lg">
                {selected.length > 0 ? `$${total.toFixed(2)}` : '—'}
              </p>
            </div>
            {selected.length > 0 && (
              <div className="text-right">
                {selected.map(s => (
                  <span
                    key={s.id}
                    className="inline-block text-[10px] font-mono text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded-md mr-1 mb-1"
                  >
                    {s.id}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
          <PressButton
            disabled={selected.length === 0}
            onClick={onConfirm}
            className="w-full mt-3 mb-2"
          >
            {selected.length === 0 ? 'Select a seat to continue' : `Confirm ${selected.length} Seat${selected.length > 1 ? 's' : ''}`}
          </PressButton>

          {selected.length === 0 && (
            <p className="text-center text-[10px] text-[#444] mt-1">
              Tap any available seat above
            </p>
          )}
        </div>

        {/* iPhone home indicator space */}
        <div className="h-6" />
      </div>
    </div>
  )
}

// ─── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({ seats, onReset }: { seats: Seat[]; onReset: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => { setTimeout(() => setShow(true), 60) }, [])
  useConfetti(show, canvasRef)

  const selected = seats.filter(s => s.status === 'selected')

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: '#09090e' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" width={390} height={700} />

      <div className={`flex flex-col items-center gap-5 relative z-10 ${show ? 'fade-up' : 'opacity-0'}`}>
        {/* Checkmark */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full pulse-ring"
            style={{ background: 'rgba(139,92,246,0.3)' }}
          />
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${show ? 'pop-in' : 'opacity-0'}`}
            style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20L16 28L32 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-3xl text-white font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            You&apos;re in!
          </h2>
          <p className="text-[#666] text-sm">Booking confirmed. Enjoy the show.</p>
        </div>

        {/* Ticket stub */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: '#131318', border: '1px solid #1e1e28' }}
        >
          <div
            className="px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #1a1028, #0f0f18)' }}
          >
            <p className="text-violet-400 text-[10px] font-mono tracking-widest uppercase mb-1">Event</p>
            <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Neon Requiem
            </p>
            <p className="text-[#666] text-xs mt-0.5">August 23, 2026 · 9:00 PM</p>
          </div>

          {/* Perforation */}
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-[#09090e] -ml-2" />
            <div className="flex-1 border-t border-dashed border-[#1e1e28]" />
            <div className="w-4 h-4 rounded-full bg-[#09090e] -mr-2" />
          </div>

          <div className="px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-1">Seats</p>
              <div className="flex gap-1 flex-wrap">
                {selected.map(s => (
                  <span
                    key={s.id}
                    className="text-xs font-mono text-white bg-violet-900/40 border border-violet-800/50 px-2 py-0.5 rounded-md"
                  >
                    {s.id}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-1">Total</p>
              <p className="text-violet-300 font-semibold">${(selected.length * 18.5).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="text-[#555] text-sm hover:text-[#888] transition-colors mt-2"
        >
          ← Back to event
        </button>
      </div>
    </div>
  )
}

// ─── Event Detail Screen ───────────────────────────────────────────────────────

function EventDetail({ onBook }: { onBook: () => void }) {
  const [imgHovered, setImgHovered] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#09090e' }}>
      {/* Hero image */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: 260 }}
        onPointerEnter={() => setImgHovered(true)}
        onPointerLeave={() => setImgHovered(false)}
      >
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=520&fit=crop&auto=format"
          alt="Concert crowd with vivid stage lighting"
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: imgHovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,14,0.2) 0%, rgba(9,9,14,0.9) 85%, #09090e 100%)' }}
        />

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.5)', color: '#c4b5fd' }}
          >
            ◉ Live Music
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-5 right-5">
          <h1
            className="text-3xl font-semibold text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            Neon Requiem
          </h1>
          <p className="text-[#888] text-sm mt-1">The Meridian · Brooklyn, NY</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 pb-6 flex flex-col gap-5">
        {/* Meta row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Date', value: 'Aug 23', sub: '2026' },
            { label: 'Time', value: '9:00', sub: 'PM EDT' },
            { label: 'Seats', value: '240', sub: 'available' },
          ].map(m => (
            <div
              key={m.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: '#131318', border: '1px solid #1e1e28' }}
            >
              <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-white font-semibold text-lg leading-none">{m.value}</p>
              <p className="text-[#666] text-[10px] mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p className="text-[#777] text-sm leading-relaxed">
            An immersive audio-visual experience blending orchestral arrangements with live electronic
            production. Expect slow-burn builds, strobing violet light arcs, and a 90-minute uninterrupted set.
          </p>
        </div>

        {/* Artist row */}
        <div>
          <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-3">Lineup</p>
          <div className="flex flex-col gap-2">
            {[
              { name: 'Vesper Halo', role: 'Electronic / Orchestral', img: 'photo-1493225457124-a3eb161ffa5f' },
              { name: 'Coda Rites', role: 'Opening Act', img: 'photo-1516450360452-9312f5e86fc7' },
            ].map(a => (
              <div
                key={a.name}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#131318', border: '1px solid #1e1e28' }}
              >
                <img
                  src={`https://images.unsplash.com/${a.img}?w=80&h=80&fit=crop&auto=format`}
                  alt={a.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-white text-sm font-medium">{a.name}</p>
                  <p className="text-[#555] text-xs">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer so button isn't hidden under safe area */}
        <div className="flex-1" />

        {/* CTA */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: '#131318', border: '1px solid #1e1e28' }}
        >
          <div>
            <p className="text-[#555] text-xs">Starting from</p>
            <p className="text-white font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>
              $18.50 <span className="text-[#555] text-xs font-normal">/ seat</span>
            </p>
          </div>
          <PressButton onClick={onBook} className="px-8">
            Book Now
          </PressButton>
        </div>
      </div>
    </div>
  )
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 390,
        height: 700,
        borderRadius: 44,
        background: '#09090e',
        boxShadow: '0 0 0 1px #2a2a35, 0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(139,92,246,0.08)',
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-30"
        style={{
          width: 120,
          height: 30,
          background: '#000',
          borderRadius: '0 0 20px 20px',
        }}
      />
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-start justify-between px-7 pt-3 z-20 pointer-events-none">
        <span className="text-[10px] text-[#888] font-mono">9:41</span>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex gap-0.5">
            {[3, 4, 5].map(h => (
              <div key={h} className="w-0.5 rounded-sm bg-[#888]" style={{ height: h }} />
            ))}
          </div>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <rect x="0" y="0" width="12" height="8" rx="2" stroke="#888" strokeWidth="1" />
            <rect x="1" y="1" width="9" height="6" rx="1" fill="#888" />
            <rect x="12.5" y="2.5" width="1.5" height="3" rx="0.75" fill="#888" />
          </svg>
        </div>
      </div>

      {/* Screen content */}
      <div className="absolute inset-0 pt-12 overflow-hidden">{children}</div>

      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-[#333] z-30" />
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [seats, setSeats] = useState<Seat[]>(buildSeats)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('detail')

  const toggleSeat = useCallback((id: string) => {
    setSeats(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status: s.status === 'selected' ? 'available' : 'selected' }
          : s
      )
    )
  }, [])

  const handleConfirm = () => {
    setSheetOpen(false)
    setTimeout(() => setScreen('success'), 380)
  }

  const handleReset = () => {
    setScreen('detail')
    setSeats(buildSeats())
    setSheetOpen(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1028 0%, #09090b 60%)' }}
    >
      {/* Label */}
      <p className="text-[#333] text-xs font-mono tracking-widest uppercase mb-8">
        Interactive Prototype · Ticket Booking
      </p>

      <PhoneMockup>
        {screen === 'detail' ? (
          <div className="relative h-full">
            <EventDetail onBook={() => setSheetOpen(true)} />
            <BottomSheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              seats={seats}
              onToggle={toggleSeat}
              onConfirm={handleConfirm}
            />
          </div>
        ) : (
          <SuccessScreen seats={seats} onReset={handleReset} />
        )}
      </PhoneMockup>

      {/* Interaction guide */}
      <div className="mt-8 flex items-center gap-6 text-[#333] text-xs font-mono">
        <span>① Hover / press Book Now</span>
        <span>·</span>
        <span>② Select seats</span>
        <span>·</span>
        <span>③ Confirm → 🎉</span>
      </div>
    </div>
  )
}
