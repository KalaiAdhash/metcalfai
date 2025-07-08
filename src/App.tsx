import { useEffect, useState } from 'react'
import { DailyProvider } from '@daily-co/daily-react'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { createConversation, endConversation } from '@/api'
import { IConversation } from '@/types'
import { useToast } from "@/hooks/use-toast"

function App() {
  const { toast } = useToast()
  const [screen, setScreen] = useState<'welcome' | 'hairCheck' | 'call'>('welcome')
  const [conversation, setConversation] = useState<IConversation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => {
      if (conversation) {
        void endConversation(conversation.conversation_id)
      }
    }
  }, [conversation])

  const handleStart = async () => {
    try {
      setLoading(true)
      const conversation = await createConversation()
      setConversation(conversation)
      setScreen('call') // Skip hairCheck and go directly to call
    } catch {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: 'Check console for details',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnd = async () => {
    try {
      if (!conversation) return
      await endConversation(conversation.conversation_id)
    } catch (error) {
      console.error(error)
    } finally {
      setConversation(null)
      setScreen('welcome')
    }
  }

  const handleJoin = () => {
    setScreen('call')
  }

  return (
    <main>
      <DailyProvider>
        <WelcomeScreen
          onStart={handleStart}
          loading={loading}
          screen={screen}
          conversation={conversation}
          handleEnd={handleEnd}
          handleJoin={handleJoin}
        />
      </DailyProvider>
    </main>
  )
}

export default App
