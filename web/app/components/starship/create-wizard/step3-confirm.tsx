'use client'

import { useTranslation } from 'react-i18next'

type Props = {
  name: string
  description: string
  icon: string
  iconBackground: string
  prePrompt: string
}

const Step3Confirm = ({ name, description, icon, iconBackground, prePrompt }: Props) => {
  const { t } = useTranslation('starship')

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-tertiary">{t('create.step3.review')}</p>

      <div className="space-y-3 rounded-xl border border-divider-subtle bg-background-section p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: iconBackground }}
          >
            {icon}
          </div>
          <div>
            <div className="font-semibold text-text-primary">{name || '—'}</div>
            <div className="text-sm text-text-tertiary">{description || '—'}</div>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {t('create.step2.prompt')}
          </div>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background-default p-3 text-sm text-text-secondary">
            {prePrompt || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step3Confirm
