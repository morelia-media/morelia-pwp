import { z } from 'zod'

export function contactForm() {
  // validation rules for the form; the backend re-checks these and also sanitizes
  const schema = z.object({
    name: z.string({ required_error: 'name is a required field' })
      .min(1, { message: 'name must consist of at least one character' })
      .max(64, { message: 'name cannot be greater than 64 characters' }),
    email: z.string({ required_error: 'email is a required field' })
      .email({ message: 'invalid email address' })
      .max(128, { message: 'email must be less than 128 characters' }),
    business: z.string()
      .max(64, { message: 'business name must be less than 64 characters' })
      .optional(),
    message: z.string({ required_error: 'message is a required field' })
      .min(1, { message: 'message must be at least 1 character' })
      .max(500, { message: 'message cannot be greater than 500 characters' })
  })

  const form = document.getElementById('contact-form')
  if (!form) return

  // inputs get a red border when they have an error
  const nameInput = document.getElementById('name')
  const emailInput = document.getElementById('email')
  const businessInput = document.getElementById('business')
  const messageInput = document.getElementById('message')

  // per-field error messages
  const nameError = document.getElementById('nameError')
  const emailError = document.getElementById('emailError')
  const businessError = document.getElementById('businessError')
  const messageError = document.getElementById('messageError')

  // success / failure message shown under the form
  const statusOutput = document.getElementById('status')

  const successClasses = ['text-green-800', 'bg-green-50']
  const errorClasses = ['text-red-800', 'bg-red-50']

  const showStatus = (message, isSuccess) => {
    statusOutput.textContent = message
    statusOutput.classList.remove('hidden', ...successClasses, ...errorClasses)
    statusOutput.classList.add(...(isSuccess ? successClasses : errorClasses))
  }

  form.addEventListener('submit', event => {
    event.preventDefault()

    const formData = new FormData(form)

    // clear errors and styling from any previous submission
    ;[nameError, emailError, businessError, messageError].forEach(element => {
      element.classList.add('hidden')
    })
    ;[nameInput, emailInput, businessInput, messageInput].forEach(input => {
      input.classList.remove('border-red-500')
    })
    statusOutput.classList.add('hidden')

    // honeypot: real people never see the "website" field, so if it is filled in a bot
    // most likely submitted the form. Pretend it worked and send nothing.
    if (formData.get('website') !== '') {
      form.reset()
      showStatus('message sent successfully', true)
      return
    }

    const values = Object.fromEntries(formData.entries())

    // FormData gives "" for empty inputs; zod's .optional() needs undefined
    values.business = values.business === '' ? undefined : values.business

    const result = schema.safeParse(values)

    if (result.success === false) {
      const errorsMap = {
        name: { inputError: nameInput, errorElement: nameError },
        email: { inputError: emailInput, errorElement: emailError },
        business: { inputError: businessInput, errorElement: businessError },
        message: { inputError: messageInput, errorElement: messageError }
      }

      result.error.errors.forEach(error => {
        const { errorElement, inputError } = errorsMap[error.path[0]]
        errorElement.textContent = error.message
        errorElement.classList.remove('hidden')
        inputError.classList.add('border-red-500')
      })
      return
    }

    // "/api" goes to the Express server: through the Vite proxy in development,
    // and through the nginx reverse proxy on the live site
    fetch('/api', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    })
      .then(response => response.json())
      .then(data => {
        const isSuccess = data.status === 200
        showStatus(data.message, isSuccess)
        if (isSuccess) {
          form.reset()
        }
      })
      .catch(() => {
        showStatus('Something went wrong sending your message. Please try again or email me directly.', false)
      })
  })
}
