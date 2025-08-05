"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Sparkles, Quote, Lightbulb, Trophy } from "lucide-react"

interface MotivationalContent {
  type: string
  content: string
  author?: string
}

interface MotivationFeedProps {
  recentWins?: string[]
  userLevel?: number
}

export default function MotivationFeed({ recentWins = [], userLevel = 1 }: MotivationFeedProps) {
  const [currentContent, setCurrentContent] = useState<MotivationalContent>({
    type: "quote",
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  })
  const [futureMessage, setFutureMessage] = useState("")

  // Motivational quotes database
  const motivationalQuotes: MotivationalContent[] = [
    {
      type: "quote",
      content: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
    {
      type: "quote",
      content: "Life is what happens when you're busy making other plans.",
      author: "John Lennon",
    },
    {
      type: "quote",
      content: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
    },
    {
      type: "affirmation",
      content: "I am capable of achieving anything I set my mind to.",
    },
    {
      type: "affirmation",
      content: "Every day, in every way, I'm getting better and better.",
    },
    {
      type: "affirmation",
      content: "I transform challenges into opportunities for growth.",
    },
    {
      type: "future-self",
      content: "Your future self is watching you right now through memories.",
    },
    {
      type: "future-self",
      content: "The habits you form today create the person you'll be tomorrow.",
    },
    {
      type: "future-self",
      content: "Every small step you take today compounds into your future success.",
    },
  ]

  useEffect(() => {
    // Rotate content every 30 seconds
    const interval = setInterval(() => {
      const randomContent = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setCurrentContent(randomContent)
    }, 30000)

    // Generate future self message based on level
    generateFutureMessage()

    return () => clearInterval(interval)
  }, [userLevel])

  const generateFutureMessage = () => {
    const messages = [
      `Level ${userLevel + 5} you is amazed by your consistency today.`,
      `Your future self thanks you for not giving up during the tough moments.`,
      `The person you're becoming is proud of the choices you're making now.`,
      `Future you remembers this moment as a turning point.`,
      `Your level ${userLevel + 10} self is cheering you on right now.`,
    ]
    setFutureMessage(messages[Math.floor(Math.random() * messages.length)])
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "quote":
        return <Quote className="w-4 h-4 text-purple-400" />
      case "affirmation":
        return <Sparkles className="w-4 h-4 text-blue-400" />
      case "future-self":
        return <Star className="w-4 h-4 text-yellow-400" />
      case "win":
        return <Trophy className="w-4 h-4 text-green-400" />
      default:
        return <Lightbulb className="w-4 h-4 text-orange-400" />
    }
  }

  // Ensure recentWins is always an array
  const safeRecentWins = Array.isArray(recentWins) ? recentWins : []

  return (
    <div className="space-y-4">
      {/* Main Motivational Content */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-xl border border-purple-800/50">
        <div className="flex items-center mb-2">
          {getContentIcon(currentContent.type)}
          <h3 className="text-purple-300 text-sm font-medium ml-2 capitalize">
            {currentContent.type.replace("-", " ")}
          </h3>
        </div>
        <p className="text-white text-base italic mb-1">"{currentContent.content}"</p>
        {currentContent.author && <p className="text-purple-400 text-xs text-right">— {currentContent.author}</p>}
      </div>

      {/* Future Self Message */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 p-3 rounded-lg border border-indigo-800/50">
        <div className="flex items-center mb-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <h4 className="text-indigo-300 text-xs font-medium ml-2">Message from Future You</h4>
        </div>
        <p className="text-gray-300 text-sm">{futureMessage}</p>
      </div>

      {/* Recent Wins */}
      {safeRecentWins.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-3 rounded-lg border border-green-800/50">
          <div className="flex items-center mb-2">
            <Trophy className="w-4 h-4 text-green-400" />
            <h4 className="text-green-300 text-xs font-medium ml-2">Recent Wins</h4>
          </div>
          <div className="space-y-1">
            {safeRecentWins.slice(0, 3).map((win, index) => (
              <p key={index} className="text-gray-300 text-xs flex items-center">
                <span className="text-green-400 mr-2">•</span>
                {win}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Daily Vibe Setter */}
      <div className="bg-black/40 p-3 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h4 className="text-gray-300 text-xs font-medium ml-2">Today's Focus</h4>
          </div>
          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
            Day {Math.floor(Math.random() * 100) + 1}
          </Badge>
        </div>
        <p className="text-gray-400 text-xs">
          {userLevel < 5
            ? "Building momentum..."
            : userLevel < 15
              ? "Finding your rhythm..."
              : "Mastering your flow..."}
        </p>
      </div>
    </div>
  )
}
