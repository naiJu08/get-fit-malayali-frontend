import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/buttons/Button'
import FormBuilder from '../../components/app/formBuilder'
// import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import { generateSalesConfirmation, useSalesLead } from './api'

const confirmationTemplate = `As per our discussion, I've noted the following points. Please go through them and confirm if everything is correct. Once you confirm, I'll plan your customized diet and workout accordingly.

Height:
Weight:
Medical condition:
Cuisine preference:
Diet type:
Food allergies:
Food dislikes:
Fitness Goal:
Starting date:`

export default function GenerateConfirmation() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  const { data, isLoading, refetch } = useSalesLead(id)
  const lead = data?.lead
  const [confirmationLoader, setConfirmationLoader] = useState(false)

  const confirmationMethods = useForm({
    defaultValues: { message: confirmationTemplate },
  })

  useEffect(() => {
    if (!lead) return
    confirmationMethods.setValue(
      'message',
      lead.confirmation?.message || confirmationTemplate
    )
  }, [lead, confirmationMethods])

  const confirmationFields = useMemo(
    () => [
      {
        name: 'message',
        label: 'Confirmation message',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the confirmation message',
      },
    ],
    []
  )

  const generateConfirmation = async () => {
    const valid = await confirmationMethods.trigger()
    if (!valid) {
      enqueueSnackbar('Enter a confirmation message', { variant: 'error' })
      return
    }
    try {
      setConfirmationLoader(true)
      await generateSalesConfirmation(
        id,
        confirmationMethods.getValues('message')
      )
      enqueueSnackbar('Confirmation link generated successfully', {
        variant: 'success',
      })
      await refetch()
      queryClient.invalidateQueries(['sales_leads'])
    } catch (error: any) {
      enqueueSnackbar(
        getApiErrorMessage(error, 'Unable to generate confirmation link'),
        { variant: 'error' }
      )
    } finally {
      setConfirmationLoader(false)
    }
  }

  const copyLink = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url)
      enqueueSnackbar(`${label} copied`, { variant: 'success' })
    } catch {
      enqueueSnackbar(`Unable to copy ${label.toLowerCase()}`, {
        variant: 'error',
      })
    }
  }

  const leadName =
    `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || `Lead #${id}`

  return (
    <div className="p-4">
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2">
          {/* <button
            type="button"
            onClick={() => navigate(`/sales/leads/${id}`)}
            className="rounded-lg hover:bg-gray-100 transition"
            aria-label="Back to lead details"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <img
            className="h-8 w-auto object-contain"
            src="/logo-hori.png"
            alt="Get Fit Malayali"
          /> */}
          <h1 className="text-xl font-semibold text-gray-900">
            Generate confirmation link
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-2 ml-10">
          Write the message that {leadName} will review and accept.
        </p>
      </div>
      {isLoading && <InfoBox content="Loading lead details..." />}
      {!isLoading && !lead && <InfoBox content="Lead not found." />}
      {!isLoading && lead && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="mx-auto w-full max-w-2xl">
            <FormProvider {...confirmationMethods}>
              <FormBuilder data={confirmationFields} edit spacing />
            </FormProvider>
            {lead.confirmation?.public_url && (
              <div className="mt-4 rounded-lg border border-formBorder bg-cardWrapperBg p-4">
                <div className="text-xs font-medium text-secondary mb-1">
                  Current public link
                </div>
                <div className="break-all text-sm text-primaryText">
                  {lead.confirmation.public_url}
                </div>
                <div className="mt-3">
                  <Button
                    label="Copy link"
                    icon="link"
                    outlined
                    onClick={() =>
                      copyLink(
                        lead.confirmation.public_url,
                        'Confirmation link'
                      )
                    }
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center gap-3">
              <Button
                label="Generate link"
                icon="link"
                onClick={generateConfirmation}
                isLoading={confirmationLoader}
              />
              <Button
                label="Cancel"
                outlined
                onClick={() => navigate(`/sales/leads/${id}`)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
