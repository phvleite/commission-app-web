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
                const response = await fetch('/api/session/activity', {
                    method: 'POST',
                    credentials: 'same-origin',
                    keepalive: true,
                    cache: 'no-store',
                })

                if (
                    response.status === 401 ||
                    response.redirected ||
                    response.url.includes('/login')
                ) {
                    window.location.replace('/login?reason=inactivity')
                }
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

        function handlePageShow() {
            lastPingAtRef.current = 0
            void pingActivity()
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
        window.addEventListener('pageshow', handlePageShow)
        void pingActivity()

        return () => {
            cancelled = true
            for (const eventName of events) {
                window.removeEventListener(eventName, handleInteraction)
            }
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('pageshow', handlePageShow)
        }
    }, [])

    return null
}
