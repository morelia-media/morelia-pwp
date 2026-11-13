import express from 'express'
import morgan from 'morgan'
import { z } from 'zod'
import 'dotenv/config'
import formData from 'form-data'
import Mailgun from 'mailgun.js'

// configure mailgun so the server can send emails
const mailgun = new Mailgun(formData)
const mailgunClient = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY })

const app = express()

// log each request in the terminal
app.use(morgan('dev'))

// parse JSON request bodies
app.use(express.json())

const indexRoute = express.Router()

// strips HTML tags as a basic guard before the text reaches the email
const stripTags = val => val.replace(/<[^>]*>/g, '')

// health check: visit http://localhost:4200/api to confirm the server is up
const getRouteHandler = (request, response) => {
  response.header('Access-Control-Allow-Origin', '*')
  return response.json('this thing is on')
}

const postRouteHandler = async (request, response) => {
  response.header('Access-Control-Allow-Origin', '*')

  // same rules as the frontend, plus trimming and tag stripping
  const schema = z.object({
    name: z.string({ required_error: 'name is a required field' })
      .min(1, { message: 'name must consist of at least one character' })
      .max(64, { message: 'name cannot be greater than 64 characters' })
      .trim()
      .transform(stripTags),
    email: z.string({ required_error: 'email is a required field' })
      .email({ message: 'invalid email address' })
      .max(128, { message: 'email must be less than 128 characters' })
      .trim()
      .transform(stripTags),
    business: z.string()
      .max(64, { message: 'business name must be less than 64 characters' })
      .trim()
      .transform(stripTags)
      .optional(),
    message: z.string({ required_error: 'message is a required field' })
      .min(1, { message: 'message must be at least 1 character' })
      .max(500, { message: 'message cannot be greater than 500 characters' })
      .trim()
      .transform(stripTags)
  })

  const result = schema.safeParse(request.body)

  if (result.error) {
    return response.json({ status: 418, message: result.error.issues[0].message })
  }

  // if the honeypot was filled in, a bot most likely sent this: fake a success and send nothing
  if (request.body.website !== '') {
    return response.json({ status: 201, message: 'email sent successfully' })
  }

  try {
    const { name, email, business, message } = result.data

    const mailgunMessage = {
      // Mailgun requires the "from" address to be on your Mailgun domain,
      // so the visitor's email goes in the body and in Reply-To
      from: `${name} <postmaster@${process.env.MAILGUN_DOMAIN}>`,
      'h:Reply-To': email,
      subject: business
        ? `New inquiry from ${name} (${business})`
        : `New inquiry from ${name}`,
      text: `
      from ${name} <${email}>
      business: ${business ?? 'not provided'}

      ${message}
      `,
      to: process.env.MAILGUN_RECIPIENT
    }

    await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, mailgunMessage)
    return response.json({ status: 200, message: 'email sent successfully' })
  } catch (error) {
    console.error(error)
    return response.json({ status: 500, message: 'internal server error try again later' })
  }
}

indexRoute.route('/')
  .get(getRouteHandler)
  .post(postRouteHandler)

app.use('/api', indexRoute)

app.listen(4200, () => {
  console.log('server is running on http://localhost:4200')
})
