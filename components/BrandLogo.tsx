'use client'

// ─── Brand logos as inline SVG ────────────────────────────────────────────────

export function AmdLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* AMD stylised "a" — approximation of their arrow/trapezoid mark */}
      <polygon points="10,90 50,10 90,90" fill="none" stroke="#e8220f" strokeWidth="10" strokeLinejoin="round" />
      <line x1="28" y1="65" x2="72" y2="65" stroke="#e8220f" strokeWidth="10" />
    </svg>
  )
}

export function NvidiaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* NVIDIA stylised eye/shield */}
      <path
        d="M50,10 C25,10 5,28 5,50 C5,72 25,90 50,90 C75,90 95,72 95,50 C95,28 75,10 50,10 Z"
        fill="none"
        stroke="#76b900"
        strokeWidth="8"
      />
      <path
        d="M30,35 L50,20 L70,35 L70,65 L50,80 L30,65 Z"
        fill="#76b900"
        opacity="0.8"
      />
      <circle cx="50" cy="50" r="10" fill="#060a0f" />
    </svg>
  )
}

export function CorsairLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Corsair sail motif */}
      <path d="M50,10 L85,85 L50,70 Z" fill="#c8d8e8" opacity="0.9" />
      <path d="M50,10 L15,85 L50,70 Z" fill="#c8d8e8" opacity="0.5" />
      <line x1="50" y1="10" x2="50" y2="92" stroke="#c8d8e8" strokeWidth="4" />
    </svg>
  )
}

export function GenericChipIcon({ size = 32, color = '#00d4ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* CPU chip top-down */}
      <rect x="25" y="25" width="50" height="50" rx="4" fill="none" stroke={color} strokeWidth="5" />
      <rect x="35" y="35" width="30" height="30" rx="2" fill={color} opacity="0.15" />
      {/* Pins — top */}
      {[35, 50, 65].map((x) => (
        <line key={`t${x}`} x1={x} y1="10" x2={x} y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* Pins — bottom */}
      {[35, 50, 65].map((x) => (
        <line key={`b${x}`} x1={x} y1="75" x2={x} y2="90" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* Pins — left */}
      {[40, 60].map((y) => (
        <line key={`l${y}`} x1="10" y1={y} x2="25" y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* Pins — right */}
      {[40, 60].map((y) => (
        <line key={`r${y}`} x1="75" y1={y} x2="90" y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  )
}

export function GpuIcon({ size = 32, color = '#00ff87' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* GPU PCB body */}
      <rect x="5" y="30" width="90" height="40" rx="3" fill="none" stroke={color} strokeWidth="4" />
      {/* Fan circles */}
      <circle cx="30" cy="50" r="12" fill="none" stroke={color} strokeWidth="3" opacity="0.7" />
      <circle cx="30" cy="50" r="4" fill={color} opacity="0.5" />
      <circle cx="60" cy="50" r="12" fill="none" stroke={color} strokeWidth="3" opacity="0.7" />
      <circle cx="60" cy="50" r="4" fill={color} opacity="0.5" />
      {/* Bracket */}
      <rect x="88" y="28" width="7" height="44" rx="2" fill={color} opacity="0.3" />
      {/* PCIe connector */}
      <rect x="10" y="68" width="70" height="8" rx="2" fill={color} opacity="0.2" />
    </svg>
  )
}

export function RamIcon({ size = 32, color = '#bf00ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* RAM stick edge-on */}
      <rect x="10" y="20" width="80" height="55" rx="3" fill="none" stroke={color} strokeWidth="4" />
      {/* Chips on stick */}
      {[18, 32, 46, 60, 74].map((x) => (
        <rect key={x} x={x} y="30" width="10" height="16" rx="1" fill={color} opacity="0.35" />
      ))}
      {/* Notch at bottom */}
      <rect x="42" y="75" width="16" height="10" rx="1" fill="#060a0f" />
      {/* Gold contacts */}
      {[15, 22, 29, 36, 43, 50, 57, 64, 71, 78].map((x) => (
        <rect key={x} x={x} y="73" width="4" height="12" rx="1" fill={color} opacity="0.6" />
      ))}
    </svg>
  )
}

export function SsdIcon({ size = 32, color = '#00d4ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* M.2 SSD top-down */}
      <rect x="8" y="35" width="84" height="30" rx="3" fill="none" stroke={color} strokeWidth="4" />
      {/* Controller chip */}
      <rect x="14" y="40" width="18" height="20" rx="2" fill={color} opacity="0.3" />
      {/* NAND chips */}
      {[38, 58].map((x) => (
        <rect key={x} x={x} y="40" width="16" height="20" rx="2" fill={color} opacity="0.2" />
      ))}
      {/* M.2 connector end */}
      <rect x="80" y="42" width="12" height="16" rx="1" fill={color} opacity="0.15" />
      {[83, 87].map((x) => (
        <rect key={x} x={x} y="40" width="2" height="20" rx="1" fill={color} opacity="0.5" />
      ))}
      {/* Mounting hole */}
      <circle cx="14" cy="50" r="3" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
    </svg>
  )
}
