import { useState } from 'react'
import { Bell, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AlertConfig, AlertLevel } from '@/types'

const LEVEL_LABELS = ['Low', 'Moderate', 'High', 'Very High', 'Extreme']

interface AlertConfigSectionProps {
  config: AlertConfig | null
  loading: boolean
  riverId: string
  updateConfig: (updates: { type: 'level' | 'numeric'; level?: AlertLevel; customValue?: number; enabled?: boolean }) => Promise<AlertConfig>
  removeConfig: () => Promise<void>
}

export function AlertConfigSection({ config, loading, riverId: _riverId, updateConfig, removeConfig }: AlertConfigSectionProps) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState<'level' | 'numeric'>(config?.type ?? 'level')
  const [level, setLevel] = useState<AlertLevel>(config?.level ?? 3)
  const [customValue, setCustomValue] = useState(config?.customValue ?? 10)
  const [enabled, setEnabled] = useState(config?.enabled ?? true)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  function startEditing() {
    setType(config?.type ?? 'level')
    setLevel(config?.level ?? 3)
    setCustomValue(config?.customValue ?? 10)
    setEnabled(config?.enabled ?? true)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updates: { type: 'level' | 'numeric'; level?: AlertLevel; customValue?: number; enabled?: boolean } = {
        type,
        enabled,
      }
      if (type === 'level') updates.level = level
      else updates.customValue = customValue
      await updateConfig(updates as any)
      setEditing(false)
    } catch {
      // error handling could be added
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      await removeConfig()
      setEditing(false)
    } catch {
      // error handling could be added
    } finally {
      setRemoving(false)
    }
  }

  function handleCancel() {
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-white/5 bg-surface p-4">
        <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mt-6 rounded-lg border border-white/5 bg-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-accent-water" />
          <h2 className="text-sm font-display font-semibold text-white tracking-wide">
            {config ? 'Edit Alert Configuration' : 'Configure Alert'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-2">Alert Type</label>
            <div className="flex gap-2">
              <Button
                variant={type === 'level' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('level')}
              >
                By Danger Level
              </Button>
              <Button
                variant={type === 'numeric' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('numeric')}
              >
                By Flow Rate
              </Button>
            </div>
          </div>

          {type === 'level' ? (
            <div>
              <label className="block text-xs text-slate-500 mb-2">Alert when level reaches</label>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as AlertLevel[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`flex-1 rounded px-2 py-2 text-xs font-semibold uppercase tracking-widest transition-all ${
                      level === l
                        ? 'bg-accent-water/20 text-cyan-300 border border-accent-water/40'
                        : 'bg-white/5 text-slate-500 border border-white/10 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {l}
                    <span className="block text-[10px] font-normal normal-case tracking-normal mt-0.5 opacity-70">
                      {LEVEL_LABELS[l - 1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-500 mb-2">Alert when flow exceeds (m³/s)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={customValue}
                onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-water/40 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="relative inline-flex h-5 w-9 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-white/10 transition-colors peer-checked:bg-accent-water/40" />
              <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </label>
            <span className="text-xs text-slate-400">{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : <><Check className="h-3 w-3" /> Save</>}
            </Button>
            {config && (
              <Button variant="destructive" size="sm" onClick={handleRemove} disabled={removing}>
                {removing ? 'Removing…' : <><Trash2 className="h-3 w-3" /> Remove</>}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving || removing}>
              <X className="h-3 w-3" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="mt-6">
        <Button variant="outline" size="sm" onClick={startEditing}>
          <Plus className="h-3 w-3" />
          Set Alert
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-lg border border-white/5 bg-surface p-4 group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent-water" />
          <h2 className="text-sm font-display font-semibold text-white tracking-wide">Alert Configuration</h2>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-xs" onClick={startEditing} aria-label="Edit alert config">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleRemove} aria-label="Remove alert config">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        {config.type === 'level'
          ? `Alert when danger level reaches ${config.level}/5 (${LEVEL_LABELS[(config.level ?? 3) - 1]})`
          : `Alert when flow exceeds ${config.customValue} m³/s`}
      </p>
      {config.enabled === false && (
        <p className="text-xs text-amber-400/80 mt-1">Alert is currently disabled.</p>
      )}
    </div>
  )
}
