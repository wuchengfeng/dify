'use client'

import { useTranslation } from 'react-i18next'

type Props = {
  name: string
  description: string
  onChange: (field: 'name' | 'description', value: string) => void
}

const EMOJI_OPTIONS = ['🤖', '🦊', '🦁', '🐬', '🦅', '🌟', '💡', '🎯', '🚀', '📚', '🧪', '🎨']
const BG_OPTIONS = ['#FFEAD5', '#E0F2FE', '#F0FDF4', '#FDF4FF', '#FFF7ED', '#EFF6FF', '#F0FFF4', '#FEF2F2']

type IconProps = {
  icon: string
  iconBackground: string
  onIconChange: (icon: string) => void
  onBgChange: (bg: string) => void
}

export const IconPicker = ({ icon, iconBackground, onIconChange, onBgChange }: IconProps) => {
  return (
    <div className="space-y-2">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onIconChange(e)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-background-default-hover ${icon === e ? 'ring-2 ring-primary-600' : ''}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BG_OPTIONS.map(bg => (
          <button
            key={bg}
            type="button"
            onClick={() => onBgChange(bg)}
            className={`h-6 w-6 rounded-md transition-transform hover:scale-110 ${iconBackground === bg ? 'ring-2 ring-primary-600 ring-offset-1' : ''}`}
            style={{ backgroundColor: bg }}
          />
        ))}
      </div>
    </div>
  )
}

const Step1Basic = ({ name, description, onChange }: Props) => {
  const { t } = useTranslation('starship')

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t('create.step1.name')}
        </label>
        <input
          value={name}
          onChange={e => onChange('name', e.target.value)}
          placeholder={t('create.step1.namePlaceholder')}
          className="w-full rounded-xl border border-divider-regular bg-background-default px-4 py-2.5 text-sm outline-none focus:border-primary-400"
          maxLength={40}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t('create.step1.description')}
        </label>
        <input
          value={description}
          onChange={e => onChange('description', e.target.value)}
          placeholder={t('create.step1.descriptionPlaceholder')}
          className="w-full rounded-xl border border-divider-regular bg-background-default px-4 py-2.5 text-sm outline-none focus:border-primary-400"
          maxLength={120}
        />
      </div>
    </div>
  )
}

export default Step1Basic
