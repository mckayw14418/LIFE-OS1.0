"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import HabitTracker from "@/components/HabitTracker"
import StatsPanel from "@/components/StatsPanel"
import TodoPanel from "@/components/TodoPanel"
import MissionsPanel from "@/components/MissionsPanel"
import MotivationFeed from "@/components/MotivationFeed"
import AICopilot from "@/components/AICopilot"
import { defaultStats, defaultHabits, dailyChallenges } from "@/lib/constants"
import type { Stats, FloatingXP, Habit, JournalEntry, CheckInData, Todo, Mission, Profile } from "@/lib/types"
import {
  Target,
  BookOpen,
  CheckCircle,
  Zap,
  TrendingUp,
  Calendar,
  Plus,
  Star,
  Brain,
  Heart,
  Dumbbell,
  Briefcase,
  Gamepad2,
  Bell,
  BarChart3,
  PenLine,
  CheckSquare,
  ArrowUpRight,
  Sparkles,
  Lightbulb,
  Award,
  Smile,
  Frown,
  Meh,
} from "lucide-react"

export default function SmartDashboard() {
  // Core state
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [floatingXP, setFloatingXP] = useState<FloatingXP[]>([])
  const [habits, setHabits] = useState<Habit[]>(defaultHabits)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [checkIns, setCheckIns] = useState<CheckInData[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [profile, setProfile] = useState<Profile>({ name: "Hero", age: 25, height: "5'8\"", weight: "150 lbs" })

  // UI state
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [showAICopilot, setShowAICopilot] = useState(false)

  // Journal state
  const [newJournalEntry, setNewJournalEntry] = useState("")
  const [journalMood, setJournalMood] = useState([5])
  const [journalTags, setJournalTags] = useState<string[]>([])

  // Quick check-in state
  const [quickMood, setQuickMood] = useState([5])
  const [quickEnergy, setQuickEnergy] = useState([5])
  const [quickNotes, setQuickNotes] = useState("")

  // Calculate level and XP
  const totalXP = useMemo(() => Object.values(stats).reduce((sum, value) => sum + value, 0), [stats])
  const level = useMemo(() => Math.floor(totalXP / 500) + 1, [totalXP])
  const xpToNext = useMemo(() => 500 - (totalXP % 500), [totalXP])
  const progressPercent = useMemo(() => ((totalXP % 500) / 500) * 100, [totalXP])

  // Available journal tags
  const availableTags = [
    "grateful",
    "anxious",
    "excited",
    "tired",
    "motivated",
    "peaceful",
    "stressed",
    "hopeful",
    "creative",
    "focused",
  ]

  // Initialize data on mount
  useEffect(() => {
    const initializeData = () => {
      try {
        // Load from localStorage if available
        const savedStats = localStorage.getItem("lifeOS_stats")
        const savedHabits = localStorage.getItem("lifeOS_habits")
        const savedJournal = localStorage.getItem("lifeOS_journal")
        const savedCheckIns = localStorage.getItem("lifeOS_checkIns")
        const savedTodos = localStorage.getItem("lifeOS_todos")
        const savedProfile = localStorage.getItem("lifeOS_profile")

        if (savedStats) setStats(JSON.parse(savedStats))
        if (savedHabits) setHabits(JSON.parse(savedHabits))
        if (savedJournal) setJournalEntries(JSON.parse(savedJournal))
        if (savedCheckIns) setCheckIns(JSON.parse(savedCheckIns))
        if (savedTodos) setTodos(JSON.parse(savedTodos))
        if (savedProfile) setProfile(JSON.parse(savedProfile))

        // Generate daily missions
        const todayMissions = dailyChallenges.slice(0, 3).map((challenge, index) => ({
          ...challenge,
          id: `mission_${Date.now()}_${index}`,
          completed: false,
        }))
        setMissions(todayMissions)
      } catch (error) {
        console.error("Error initializing data:", error)
      }
    }

    initializeData()
  }, [])

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem("lifeOS_stats", JSON.stringify(stats))
      localStorage.setItem("lifeOS_habits", JSON.stringify(habits))
      localStorage.setItem("lifeOS_journal", JSON.stringify(journalEntries))
      localStorage.setItem("lifeOS_checkIns", JSON.stringify(checkIns))
      localStorage.setItem("lifeOS_todos", JSON.stringify(todos))
      localStorage.setItem("lifeOS_profile", JSON.stringify(profile))
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }, [stats, habits, journalEntries, checkIns, todos, profile])

  // Save data when state changes
  useEffect(() => {
    const timeoutId = setTimeout(saveData, 1000)
    return () => clearTimeout(timeoutId)
  }, [saveData])

  // XP and level up handlers
  const handleXPAdd = useCallback((stat: keyof Stats, baseXP: number) => {
    const newFloatingXP: FloatingXP = {
      id: `xp_${Date.now()}_${Math.random()}`,
      stat,
      amount: baseXP,
      timestamp: Date.now(),
    }

    setFloatingXP((prev) => [...prev, newFloatingXP])
    setStats((prev) => ({ ...prev, [stat]: prev[stat] + baseXP }))

    // Remove floating XP after animation
    setTimeout(() => {
      setFloatingXP((prev) => prev.filter((xp) => xp.id !== newFloatingXP.id))
    }, 2000)
  }, [])

  // Habit handlers
  const handleCompleteHabit = useCallback(
    (habitName: string) => {
      const today = new Date().toDateString()

      setHabits((prev) =>
        prev.map((habit) => {
          if (habit.name === habitName && !habit.completionHistory.includes(today)) {
            const newStreak = habit.streak + 1
            const updatedHabit = {
              ...habit,
              streak: newStreak,
              completionHistory: [...habit.completionHistory, today],
              lastCompleted: today,
              highestStreak: Math.max(habit.highestStreak || 0, newStreak),
            }

            // Award XP based on habit category
            const xpReward = habit.difficulty === "hard" ? 30 : habit.difficulty === "medium" ? 20 : 15
            const statToIncrease =
              habit.category === "health"
                ? "BODY"
                : habit.category === "productivity"
                  ? "WORK"
                  : habit.category === "mindfulness"
                    ? "SPIRIT"
                    : "MIND"

            setTimeout(() => handleXPAdd(statToIncrease, xpReward), 100)

            return updatedHabit
          }
          return habit
        }),
      )
    },
    [handleXPAdd],
  )

  // Journal handlers
  const handleAddJournalEntry = useCallback(
    (entry: JournalEntry) => {
      const newEntry: JournalEntry = {
        ...entry,
        id: `journal_${Date.now()}`,
        date: new Date().toISOString(),
        content: entry.content || newJournalEntry,
        mood: entry.mood || journalMood[0],
        tags: entry.tags || journalTags,
      }

      setJournalEntries((prev) => [newEntry, ...prev])

      // Award XP for journaling
      setTimeout(() => handleXPAdd("SPIRIT", 15), 100)

      // Reset form
      setNewJournalEntry("")
      setJournalMood([5])
      setJournalTags([])
    },
    [newJournalEntry, journalMood, journalTags, handleXPAdd],
  )

  // Quick check-in handler
  const handleQuickCheckIn = useCallback(() => {
    const checkIn: CheckInData = {
      id: `checkin_${Date.now()}`,
      date: new Date().toISOString(),
      mood: quickMood[0],
      energy: quickEnergy[0],
      notes: quickNotes,
      timestamp: new Date().toLocaleTimeString(),
    }

    setCheckIns((prev) => [checkIn, ...prev])
    setTimeout(() => handleXPAdd("SPIRIT", 10), 100)

    // Reset form
    setQuickMood([5])
    setQuickEnergy([5])
    setQuickNotes("")
  }, [quickMood, quickEnergy, quickNotes, handleXPAdd])

  // Todo handlers
  const handleAddTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: `todo_${Date.now()}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      xpReward: 20,
      priority: "medium",
    }
    setTodos((prev) => [newTodo, ...prev])
  }, [])

  const handleCompleteTodo = useCallback(
    (id: string) => {
      setTodos((prev) =>
        prev.map((todo) => {
          if (todo.id === id && !todo.completed) {
            setTimeout(() => handleXPAdd("WORK", todo.xpReward), 100)
            return { ...todo, completed: true }
          }
          return todo
        }),
      )
    },
    [handleXPAdd],
  )

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }, [])

  // Mission handlers
  const handleCompleteMission = useCallback(
    (missionId: string) => {
      setMissions((prev) =>
        prev.map((mission) => {
          if (mission.id === missionId && !mission.completed) {
            setTimeout(() => handleXPAdd(mission.stat, mission.xpReward), 100)
            return { ...mission, completed: true }
          }
          return mission
        }),
      )
    },
    [handleXPAdd],
  )

  // Journal tag toggle
  const toggleJournalTag = useCallback((tag: string) => {
    setJournalTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }, [])

  // Mood data for chart
  const moodData = useMemo(() => {
    return checkIns
      .slice(0, 7)
      .reverse()
      .map((checkIn) => ({
        date: new Date(checkIn.date).toLocaleDateString(undefined, { weekday: "short" }),
        mood: checkIn.mood,
        energy: checkIn.energy,
      }))
  }, [checkIns])

  // Recent wins for motivation feed
  const recentWins = useMemo(() => {
    const wins: string[] = []

    // Add completed habits
    habits
      .filter((h) => h.completionHistory.includes(new Date().toDateString()))
      .forEach((habit) => {
        wins.push(`Completed ${habit.name}`)
      })

    // Add completed todos
    todos
      .filter((t) => t.completed)
      .slice(0, 3)
      .forEach((todo) => {
        wins.push(`Finished: ${todo.text}`)
      })

    // Add journal entries from today
    const today = new Date().toDateString()
    const todayEntries = journalEntries.filter((entry) => new Date(entry.date).toDateString() === today)
    if (todayEntries.length > 0) {
      wins.push(`Wrote ${todayEntries.length} journal ${todayEntries.length === 1 ? "entry" : "entries"}`)
    }

    return wins
  }, [habits, todos, journalEntries])

  // Get mood icon based on value
  const getMoodIcon = useCallback((mood: number) => {
    if (mood <= 3) return <Frown className="w-4 h-4 text-red-400" />
    if (mood <= 7) return <Meh className="w-4 h-4 text-yellow-400" />
    return <Smile className="w-4 h-4 text-green-400" />
  }, [])

  // Get stat icon based on category
  const getStatIcon = useCallback((stat: string) => {
    switch (stat) {
      case "MIND":
        return <Brain className="w-5 h-5 text-blue-400" />
      case "BODY":
        return <Dumbbell className="w-5 h-5 text-green-400" />
      case "SPIRIT":
        return <Heart className="w-5 h-5 text-purple-400" />
      case "WORK":
        return <Briefcase className="w-5 h-5 text-orange-400" />
      case "PLAY":
        return <Gamepad2 className="w-5 h-5 text-pink-400" />
      default:
        return <Star className="w-5 h-5 text-yellow-400" />
    }
  }, [])

  // Get time of day greeting
  const getTimeOfDayGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    if (hour < 21) return "Good evening"
    return "Good night"
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30" />
      <div className="fixed inset-0 bg-black/20" />

      {/* Floating XP Animations */}
      {floatingXP.map((xp) => (
        <div
          key={xp.id}
          className="fixed pointer-events-none z-50 animate-fadeUp text-green-400 text-lg font-bold"
          style={{
            left: `calc(50% + ${Math.random() * 100 - 50}px)`,
            top: `calc(50% + ${Math.random() * 100 - 50}px)`,
          }}
        >
          +{xp.amount} {xp.stat} XP
        </div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 text-shadow-lg">Life OS</h1>
              <p className="text-gray-300 text-lg">Your Personal Operating System</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                v52.0
              </Badge>
              <Avatar className="h-10 w-10 border-2 border-purple-500/50">
                <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                <AvatarFallback className="bg-purple-800 text-white">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Level and XP Bar */}
          <div className="bg-black/30 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  {level}
                </div>
                <div>
                  <h2 className="text-white font-semibold">Level {level}</h2>
                  <p className="text-gray-400 text-sm">{xpToNext} XP to next level</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{totalXP.toLocaleString()} XP</p>
                <p className="text-gray-400 text-sm">Total Experience</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2 bg-gray-800" />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-black/20 backdrop-blur-xl border border-white/10 mb-6">
            <TabsTrigger
              value="overview"
              className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="journal"
              className="text-white data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <PenLine className="w-4 h-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger
              value="habits"
              className="text-white data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Level Up
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="text-white data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger
              value="missions"
              className="text-white data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Missions
            </TabsTrigger>
            <TabsTrigger
              value="checkin"
              className="text-white data-[state=active]:bg-pink-600 data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Check-in
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Welcome Card */}
                <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {getTimeOfDayGreeting()}, {profile.name}!
                        </h2>
                        <p className="text-gray-300">Ready to level up your life today?</p>
                      </div>
                      <Button
                        onClick={() => setShowAICopilot(!showAICopilot)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Copilot
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Overview */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                      Life Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(stats).map(([stat, value]) => (
                        <Card key={stat} className="bg-black/30 border-gray-800 overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              {getStatIcon(stat)}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50"
                                onClick={() => handleXPAdd(stat as keyof Stats, 10)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <h3 className="font-semibold text-white">{stat}</h3>
                            <div className="flex items-end justify-between">
                              <p className="text-2xl font-bold text-purple-400">{value}</p>
                              <p className="text-xs text-gray-400">Level {Math.floor(value / 100) + 1}</p>
                            </div>
                            <Progress value={value % 100} max={100} className="h-1 mt-2 bg-gray-800" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mood Tracking */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-pink-400" />
                      Mood & Energy Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {moodData.length > 0 ? (
                      <div className="h-64">
                        <ChartContainer
                          config={{
                            mood: {
                              label: "Mood",
                              color: "hsl(var(--chart-1))",
                            },
                            energy: {
                              label: "Energy",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={moodData}>
                              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 10]}
                                ticks={[0, 2, 4, 6, 8, 10]}
                              />
                              <RechartsTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="var(--color-mood)"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="energy"
                                stroke="var(--color-energy)"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No mood data yet. Complete a check-in to start tracking!</p>
                        <Button
                          onClick={() => setActiveTab("checkin")}
                          variant="outline"
                          className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Check-in
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setActiveTab("journal")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <PenLine className="w-4 h-4 mr-2" />
                      Write Journal Entry
                    </Button>
                    <Button
                      onClick={() => setActiveTab("habits")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Complete Habits
                    </Button>
                    <Button
                      onClick={() => setActiveTab("checkin")}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Daily Check-in
                    </Button>
                    <Button
                      onClick={() => setActiveTab("stats")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Level Up Stats
                    </Button>
                  </CardContent>
                </Card>

                {/* Today's Progress */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Award className="w-5 h-5 mr-2 text-yellow-400" />
                      Today's Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Habits Completed</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                          {habits.filter((h) => h.completionHistory.includes(new Date().toDateString())).length}/
                          {habits.length}
                        </Badge>
                      </div>
                      <Progress
                        value={
                          (habits.filter((h) => h.completionHistory.includes(new Date().toDateString())).length /
                            habits.length) *
                          100
                        }
                        className="h-2 bg-gray-800"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Quests Completed</span>
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                          {todos.filter((t) => t.completed).length}/{todos.length}
                        </Badge>
                      </div>
                      <Progress
                        value={(todos.filter((t) => t.completed).length / todos.length) * 100}
                        className="h-2 bg-gray-800"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Missions Completed</span>
                        <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                          {missions.filter((m) => m.completed).length}/{missions.length}
                        </Badge>
                      </div>
                      <Progress
                        value={(missions.filter((m) => m.completed).length / missions.length) * 100}
                        className="h-2 bg-gray-800"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Motivation Feed */}
                <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                      Motivation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MotivationFeed recentWins={recentWins} userLevel={level} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New Journal Entry */}
              <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <PenLine className="w-5 h-5 mr-2 text-indigo-400" />
                    New Journal Entry
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Capture your thoughts, feelings, and experiences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">What's on your mind?</Label>
                    <Textarea
                      value={newJournalEntry}
                      onChange={(e) => setNewJournalEntry(e.target.value)}
                      placeholder="Write about your day, thoughts, or feelings..."
                      className="min-h-[120px] bg-black/30 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Mood: {journalMood[0]}/10</Label>
                    <Slider
                      value={journalMood}
                      onValueChange={setJournalMood}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>😢 Low</span>
                      <span>😐 Neutral</span>
                      <span>😊 High</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map((tag) => (
                        <Button
                          key={tag}
                          variant={journalTags.includes(tag) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleJournalTag(tag)}
                          className={`text-xs ${
                            journalTags.includes(tag)
                              ? "bg-indigo-600 text-white"
                              : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                          }`}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleAddJournalEntry({
                        id: "",
                        content: newJournalEntry,
                        mood: journalMood[0],
                        tags: journalTags,
                        date: "",
                        emotionalState: journalMood[0],
                      })
                    }
                    disabled={!newJournalEntry.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry (+15 SPIRIT XP)
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Journal Entries */}
              <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Recent Entries</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest journal entries and reflections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {journalEntries.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No journal entries yet. Start writing to track your journey!</p>
                      </div>
                    ) : (
                      journalEntries.slice(0, 10).map((entry) => (
                        <Card key={entry.id} className="bg-black/30 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                {getMoodIcon(entry.mood)}
                                <span className="text-xs text-gray-400 ml-2">
                                  {new Date(entry.date).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
                                Mood: {entry.mood}/10
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm mb-2">{entry.content}</p>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs border-indigo-500/30 text-indigo-300"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="mt-6">
            <HabitTracker habits={habits} onCompleteHabit={handleCompleteHabit} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <StatsPanel
              stats={stats}
              handleXPAdd={handleXPAdd}
              floatingXP={floatingXP}
              journalEntries={journalEntries}
              checkIns={checkIns}
              habits={habits}
            />
          </TabsContent>

          {/* Todos Tab */}
          <TabsContent value="todos" className="mt-6">
            <TodoPanel
              todos={todos}
              onAddTodo={handleAddTodo}
              onCompleteTodo={handleCompleteTodo}
              onDeleteTodo={handleDeleteTodo}
              checkIns={checkIns}
              stats={stats}
            />
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="mt-6">
            <MissionsPanel missions={missions} onCompleteMission={handleCompleteMission} />
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New Check-in */}
              <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-pink-400" />
                    Daily Check-in
                  </CardTitle>
                  <CardDescription className="text-gray-400">Track your mood and energy levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">How are you feeling today? ({quickMood[0]}/10)</Label>
                    <Slider value={quickMood} onValueChange={setQuickMood} max={10} min={1} step={1} className="mt-2" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>😢 Terrible</span>
                      <span>😐 Okay</span>
                      <span>😊 Amazing</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">What's your energy level? ({quickEnergy[0]}/10)</Label>
                    <Slider
                      value={quickEnergy}
                      onValueChange={setQuickEnergy}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>😴 Exhausted</span>
                      <span>⚡ Moderate</span>
                      <span>🔥 Energized</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Quick Notes (Optional)</Label>
                    <Textarea
                      value={quickNotes}
                      onChange={(e) => setQuickNotes(e.target.value)}
                      placeholder="Any thoughts or context about how you're feeling?"
                      className="bg-black/30 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <Button
                    onClick={handleQuickCheckIn}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Check-in (+10 SPIRIT XP)
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Check-ins */}
              <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white">Recent Check-ins</CardTitle>
                  <CardDescription className="text-gray-400">Your mood and energy history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {checkIns.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No check-ins yet. Start tracking your daily mood and energy!</p>
                      </div>
                    ) : (
                      checkIns.slice(0, 10).map((checkIn) => (
                        <Card key={checkIn.id} className="bg-black/30 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">
                                {new Date(checkIn.date).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div className="bg-black/20 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-400 mb-1">Mood</p>
                                <div className="flex items-center justify-center">
                                  {getMoodIcon(checkIn.mood)}
                                  <span className="text-white font-semibold ml-2">{checkIn.mood}/10</span>
                                </div>
                              </div>
                              <div className="bg-black/20 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-400 mb-1">Energy</p>
                                <div className="flex items-center justify-center">
                                  <Zap
                                    className={`w-4 h-4 ${
                                      checkIn.energy <= 3
                                        ? "text-red-400"
                                        : checkIn.energy <= 7
                                          ? "text-yellow-400"
                                          : "text-green-400"
                                    }`}
                                  />
                                  <span className="text-white font-semibold ml-2">{checkIn.energy}/10</span>
                                </div>
                              </div>
                            </div>
                            {checkIn.notes && (
                              <p className="text-gray-300 text-sm mt-2 bg-black/20 p-2 rounded">{checkIn.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Copilot */}
        {showAICopilot && (
          <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
            <Card className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl border-purple-500/30 shadow-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    AI Copilot
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    onClick={() => setShowAICopilot(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <AICopilot
                  userData={{
                    stats,
                    habits,
                    journalEntries,
                    checkIns,
                    todos: todos.map((todo) => ({ ...todo, text: todo.text })),
                    level,
                    totalXP,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions Footer */}
        <div className="fixed bottom-4 left-4 right-4 z-20 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-8">
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm">System Online</span>
                </div>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          onClick={() => setActiveTab("checkin")}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Quick Check-in</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          onClick={() => setActiveTab("journal")}
                        >
                          <PenLine className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Journal Entry</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          onClick={() => setActiveTab("habits")}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Habits</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          onClick={() => setShowAICopilot(!showAICopilot)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI Copilot</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .shadow-glow {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }
        .bg-gradient-mesh {
          background-image: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(79, 70, 229, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
        }
      `}</style>
    </div>
  )
}
