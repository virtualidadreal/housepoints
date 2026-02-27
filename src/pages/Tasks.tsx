import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Plus,
  Check,
  X,
  Minus,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/household'
import { springs } from '../lib/animations'
import type { Task, TaskCategory, TaskFrequency } from '../lib/types'

const CATEGORIES: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'limpieza', label: 'Limpieza', emoji: '🧹' },
  { value: 'cocina', label: 'Cocina', emoji: '👨‍🍳' },
  { value: 'ropa', label: 'Ropa', emoji: '👕' },
  { value: 'orden', label: 'Orden', emoji: '🛋️' },
  { value: 'compras', label: 'Compras', emoji: '🛒' },
  { value: 'bonus', label: 'Bonus', emoji: '⭐' },
]

const FREQUENCIES: { value: TaskFrequency; label: string }[] = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'asneeded', label: 'Puntual' },
]

const COMMON_EMOJIS = ['🧹', '🍽️', '🛋️', '👕', '🛒', '🚿', '🧊', '🔧', '👨‍🍳', '☕', '🗑️', '📦', '🫧', '♨️', '🛌', '🪢', '🌀', '👗', '🏪', '🧲']

interface TaskForm {
  name: string
  emoji: string
  points: number
  category: TaskCategory
  frequency: TaskFrequency
  is_bonus: boolean
}

const emptyForm: TaskForm = {
  name: '',
  emoji: '🧹',
  points: 50,
  category: 'limpieza',
  frequency: 'weekly',
  is_bonus: false,
}

export default function Tasks() {
  const navigate = useNavigate()
  const household = useHouseholdStore((s) => s.household)
  const setStoreTasks = useHouseholdStore((s) => s.setTasks)

  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit / Add modal
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskForm>(emptyForm)

  // Load ALL tasks (including inactive) for management
  useEffect(() => {
    if (!household) return
    loadAllTasks()
  }, [household?.id])

  async function loadAllTasks() {
    if (!household) return
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', household.id)
      .order('sort_order', { ascending: true })

    if (data) setAllTasks(data as Task[])
    setLoading(false)
  }

  // Group tasks by category
  const groupedTasks = CATEGORIES.map((cat) => ({
    ...cat,
    tasks: allTasks.filter((t) => t.category === cat.value),
  })).filter((g) => g.tasks.length > 0)

  // Open add form
  function handleAdd() {
    setEditingTask(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  // Open edit form
  function handleEdit(task: Task) {
    setEditingTask(task)
    setForm({
      name: task.name,
      emoji: task.emoji ?? '🧹',
      points: task.points,
      category: (task.category as TaskCategory) ?? 'limpieza',
      frequency: task.frequency as TaskFrequency,
      is_bonus: task.is_bonus,
    })
    setShowForm(true)
  }

  // Save (create or update)
  async function handleSave() {
    if (!household || !form.name.trim()) return
    setSaving(true)

    if (editingTask) {
      // Update existing
      const { error } = await supabase
        .from('tasks')
        .update({
          name: form.name.trim(),
          emoji: form.emoji,
          points: form.points,
          category: form.category,
          frequency: form.frequency,
          is_bonus: form.is_bonus,
        })
        .eq('id', editingTask.id)

      if (!error) {
        await loadAllTasks()
        refreshStoreTasks()
      }
    } else {
      // Create new
      const maxSort = allTasks.reduce((max, t) => Math.max(max, t.sort_order), 0)
      const { error } = await supabase.from('tasks').insert({
        household_id: household.id,
        name: form.name.trim(),
        emoji: form.emoji,
        points: form.points,
        category: form.category,
        frequency: form.frequency,
        is_bonus: form.is_bonus,
        is_active: true,
        sort_order: maxSort + 1,
      })

      if (!error) {
        await loadAllTasks()
        refreshStoreTasks()
      }
    }

    setSaving(false)
    setShowForm(false)
  }

  // Toggle active/inactive
  async function handleToggleActive(task: Task) {
    const newActive = !task.is_active
    await supabase
      .from('tasks')
      .update({ is_active: newActive })
      .eq('id', task.id)

    setAllTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_active: newActive } : t))
    )
    refreshStoreTasks()
  }

  // Move task up/down
  async function handleMove(task: Task, direction: 'up' | 'down') {
    const sameCat = allTasks.filter((t) => t.category === task.category)
    const idx = sameCat.findIndex((t) => t.id === task.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sameCat.length) return

    const other = sameCat[swapIdx]
    const tempSort = task.sort_order

    await Promise.all([
      supabase.from('tasks').update({ sort_order: other.sort_order }).eq('id', task.id),
      supabase.from('tasks').update({ sort_order: tempSort }).eq('id', other.id),
    ])

    await loadAllTasks()
    refreshStoreTasks()
  }

  // Refresh the global store with active tasks only
  async function refreshStoreTasks() {
    if (!household) return
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', household.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (data) setStoreTasks(data as Task[])
  }

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--border-card)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: 'var(--bg-primary)',
        paddingBottom: 'var(--space-12)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
        }}
      >
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)' }}
        >
          <ChevronLeft size={18} /> Inicio
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 700,
          }}
        >
          Tareas
        </h1>
        <button
          onClick={handleAdd}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--player-1)', color: 'white' }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Task list by category */}
      <div style={{ padding: '0 var(--space-5)' }}>
        {groupedTasks.map((group) => (
          <div key={group.value} className="mb-5">
            <div
              className="mb-2 flex items-center gap-2"
              style={{
                fontSize: 'var(--text-small)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>{group.emoji}</span>
              <span>{group.label}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                ({group.tasks.length})
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: task.is_active ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    opacity: task.is_active ? 1 : 0.5,
                    boxShadow: task.is_active ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(task)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: task.is_active ? 'var(--player-1)' : 'var(--border-subtle)',
                    }}
                  >
                    {task.is_active && <Check size={14} style={{ color: 'white' }} />}
                  </button>

                  {/* Info (tappable to edit) */}
                  <button
                    onClick={() => handleEdit(task)}
                    className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                  >
                    <span className="text-lg">{task.emoji}</span>
                    <div className="flex-1 overflow-hidden">
                      <div
                        className="truncate font-medium"
                        style={{ fontSize: 'var(--text-body)' }}
                      >
                        {task.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-tiny)', color: 'var(--text-muted)' }}>
                        {FREQUENCIES.find((f) => f.value === task.frequency)?.label}
                        {task.is_bonus && ' · Bonus'}
                      </div>
                    </div>
                  </button>

                  {/* Points */}
                  <span
                    className="shrink-0 font-bold"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-small)',
                      color: 'var(--accent-points-dark)',
                    }}
                  >
                    {task.points}
                  </span>

                  {/* Reorder */}
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(task, 'up')}
                      className="flex h-5 w-5 items-center justify-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(task, 'down')}
                      className="flex h-5 w-5 items-center justify-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {allTasks.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">📋</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-body)' }}>
              No hay tareas. Anade la primera.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(45, 42, 38, 0.4)' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={springs.snappy}
              className="w-full max-w-lg"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                padding: 'var(--space-6)',
                paddingBottom: 'max(var(--space-8), env(safe-area-inset-bottom))',
                maxHeight: '90dvh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="mb-5 flex items-center justify-between">
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-h2)',
                    fontWeight: 700,
                  }}
                >
                  {editingTask ? 'Editar tarea' : 'Nueva tarea'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre de la tarea"
                    className="w-full px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '2px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-body)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Emoji
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setForm((f) => ({ ...f, emoji }))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                        style={{
                          backgroundColor:
                            form.emoji === emoji ? 'var(--accent-points-light)' : 'var(--bg-card)',
                          border: `2px solid ${form.emoji === emoji ? 'var(--accent-points)' : 'var(--border-card)'}`,
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Puntos
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm((f) => ({ ...f, points: Math.max(10, f.points - 10) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Minus size={16} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <span
                      className="w-16 text-center font-bold"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-h2)',
                        color: 'var(--accent-points-dark)',
                      }}
                    >
                      {form.points}
                    </span>
                    <button
                      onClick={() => setForm((f) => ({ ...f, points: f.points + 10 }))}
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    {/* Quick presets */}
                    <div className="flex gap-1">
                      {[20, 50, 100, 250, 500].map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm((f) => ({ ...f, points: p }))}
                          className="rounded-md px-2 py-1"
                          style={{
                            fontSize: 'var(--text-tiny)',
                            fontWeight: 600,
                            backgroundColor:
                              form.points === p ? 'var(--accent-points)' : 'var(--bg-elevated)',
                            color:
                              form.points === p ? 'white' : 'var(--text-muted)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                        className="flex items-center gap-1 rounded-lg px-3 py-2"
                        style={{
                          backgroundColor:
                            form.category === cat.value ? 'var(--player-1)' : 'var(--bg-card)',
                          color:
                            form.category === cat.value ? 'white' : 'var(--text-primary)',
                          border: `2px solid ${form.category === cat.value ? 'var(--player-1)' : 'var(--border-card)'}`,
                          fontSize: 'var(--text-small)',
                          fontWeight: 500,
                        }}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label
                    className="mb-1.5 block font-medium"
                    style={{ fontSize: 'var(--text-small)', color: 'var(--text-secondary)' }}
                  >
                    Frecuencia
                  </label>
                  <div className="flex gap-2">
                    {FREQUENCIES.map((freq) => (
                      <button
                        key={freq.value}
                        onClick={() => setForm((f) => ({ ...f, frequency: freq.value }))}
                        className="flex-1 rounded-lg px-3 py-2"
                        style={{
                          backgroundColor:
                            form.frequency === freq.value ? 'var(--player-1)' : 'var(--bg-card)',
                          color:
                            form.frequency === freq.value ? 'white' : 'var(--text-primary)',
                          border: `2px solid ${form.frequency === freq.value ? 'var(--player-1)' : 'var(--border-card)'}`,
                          fontSize: 'var(--text-small)',
                          fontWeight: 500,
                        }}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bonus toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium" style={{ fontSize: 'var(--text-body)' }}>
                      Tarea bonus
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-small)' }}>
                      Solo aparece ocasionalmente
                    </div>
                  </div>
                  <button
                    onClick={() => setForm((f) => ({ ...f, is_bonus: !f.is_bonus }))}
                    className="relative h-7 w-12 rounded-full transition-colors"
                    style={{
                      backgroundColor: form.is_bonus ? 'var(--player-1)' : 'var(--border-subtle)',
                    }}
                  >
                    <motion.div
                      layout
                      transition={springs.snappy}
                      className="absolute top-0.5 h-6 w-6 rounded-full bg-white"
                      style={{
                        left: form.is_bonus ? 'calc(100% - 26px)' : '2px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 py-3 font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--player-1)',
                  color: 'var(--text-on-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-body)',
                }}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {editingTask ? 'Guardar cambios' : 'Crear tarea'}{' '}
                    <Check size={18} />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
