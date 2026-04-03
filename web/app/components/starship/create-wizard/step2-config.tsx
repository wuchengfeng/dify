'use client'

import { useTranslation } from 'react-i18next'

type Props = {
  prePrompt: string
  onChange: (value: string) => void
}

const Step2Config = ({ prePrompt, onChange }: Props) => {
  const { t } = useTranslation('starship')

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {t('create.step2.prompt')}
        </label>
        <textarea
          value={prePrompt}
          onChange={e => onChange(e.target.value)}
          placeholder={t('create.step2.promptPlaceholder')}
          rows={10}
          className="w-full resize-none rounded-xl border border-divider-regular bg-background-default px-4 py-3 text-sm outline-none focus:border-primary-400"
        />
        <div className="mt-1 text-right text-xs text-text-quaternary">
          {prePrompt.length}
          {' '}
          / 2000
        </div>
      </div>
    </div>
  )
}

export default Step2Config
