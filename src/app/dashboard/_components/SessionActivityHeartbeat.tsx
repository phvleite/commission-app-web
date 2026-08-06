'use client'

import { useEffect, useRef } from 'react'

const MIN_PING_INTERVAL_MS = 60_000

export function SessionActivityHeartbeat() {
    const lastPingAtRef = useRef(0)

    useEffect(() => {
        let cancelled = false

        async function pingActivity() {
            const now = Date.now()

            if (now - lastPingAtRef.current < MIN_PING_INTERVAL_MS) {
                return
            }

            lastPingAtRef.current = now

            try {
                await fetch('/api/session/activity', {
                    method: 'POST',
                    credentials: 'same-origin',
                    keepalive: true,
                    cache: 'no-store',
                })
            } catch {
                if (!cancelled) {
                    // Ignore heartbeat failures; middleware still enforces timeout.
                }
            }
        }

        function handleInteraction() {
            void pingActivity()
        }

        function handleVisibility() {
            if (document.visibilityState === 'visible') {
                void pingActivity()
            }
        }

        const events: Array<keyof WindowEventMap> = [
            'pointerdown',
            'keydown',
            'scroll',
            'touchstart',
        ]

        for (const eventName of events) {
            window.addEventListener(eventName, handleInteraction, { passive: true })
        }

        document.addEventListener('visibilitychange', handleVisibility)
        void pingActivity()

        return () => {
            cancelled = true
            for (const eventName of events) {
                window.removeEventListener(eventName, handleInteraction)
            }
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [])

    return null
}
