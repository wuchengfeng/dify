'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Step1Basic from '@/app/components/starship/create-wizard/step1-basic'
import Step2Config from '@/app/components/starship/create-wizard/step2-config'
import Step3Confirm from '@/app/components/starship/create-wizard/step3-confirm'
import { createStarshipAgent } from '@/service/starship'

const TOTAL_STEPS = 3

const CreateAgentPage = () => {
  const { t } = useTranslation('starship')
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon] = useState('🤖')
  const [iconBackground] = useState('#FFEAD5')
  const [prePrompt, setPrePrompt] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: 'name' | 'description', value: string) => {
    if (field === 'name')
      setName(value)
    else setDescription(value)
  }

  const canNext = () => {
    if (step === 1)
      return name.trim().length > 0
    if (step === 2)
      return prePrompt.trim().length > 0
    return true
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await createStarshipAgent({ name, description, icon, icon_background: iconBackground, pre_prompt: prePrompt })
      router.push(`/starship/${res.id}/versions`)
    }
    catch {
      setError('Failed to create agent. Please try again.')
    }
    finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex h-full items-start justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-text-primary">{t('create.title')}</h1>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary-600' : 'bg-divider-regular'}`}
              />
            ))}
          </div>
          <div className="mt-2 text-sm text-text-tertiary">
            {(['create.step1.title', 'create.step2.title', 'create.step3.title'] as const)[step - 1]
              ? t((['create.step1.title', 'create.step2.title', 'create.step3.title'] as const)[step - 1])
              : ''}
            {' '}
            (
            {step}
            /
            {TOTAL_STEPS}
            )
          </div>
        </div>

        <div className="rounded-2xl border border-divider-subtle bg-background-default p-6">
          {step === 1 && (
            <Step1Basic name={name} description={description} onChange={handleChange} />
          )}
          {step === 2 && (
            <Step2Config prePrompt={prePrompt} onChange={setPrePrompt} />
          )}
          {step === 3 && (
            <Step3Confirm
              name={name}
              description={description}
              icon={icon}
              iconBackground={iconBackground}
              prePrompt={prePrompt}
            />
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 rounded-xl border border-divider-regular px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-background-default-hover"
              >
                {t('create.prev')}
              </button>
            )}
            {step < TOTAL_STEPS
              ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canNext()}
                    className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-40"
                  >
                    {t('create.next')}
                  </button>
                )
              : (
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-40"
                  >
                    {creating ? t('create.creating') : t('create.create')}
                  </button>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateAgentPage
