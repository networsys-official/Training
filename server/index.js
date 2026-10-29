import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import express from 'express'

const app = express()
const port = Number(process.env.PORT || 3000)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = path.resolve(process.env.STUDENT_DATA_DIR || path.join(root, 'data'))
const dataFile = path.join(dataDirectory, 'students.json')
const seedStudents = [
  { id: randomUUID(), name: 'Amara Johnson', email: 'amara.johnson@northfield.edu', course: 'Environmental Science', year: 2, status: 'Active' },
  { id: randomUUID(), name: 'Noah Williams', email: 'noah.williams@northfield.edu', course: 'Computer Science', year: 3, status: 'Active' },
  { id: randomUUID(), name: 'Sofia Martinez', email: 'sofia.martinez@northfield.edu', course: 'Visual Communication', year: 1, status: 'On leave' },
  { id: randomUUID(), name: 'Ethan Chen', email: 'ethan.chen@northfield.edu', course: 'Economics', year: 4, status: 'Active' },
]

mkdirSync(dataDirectory, { recursive: true })
try {
  readFileSync(dataFile, 'utf8')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  writeFileSync(dataFile, `${JSON.stringify(seedStudents, null, 2)}\n`)
}

function readStudents() {
  return JSON.parse(readFileSync(dataFile, 'utf8'))
}

function saveStudents(students) {
  const temporaryFile = `${dataFile}.tmp`
  writeFileSync(temporaryFile, `${JSON.stringify(students, null, 2)}\n`)
  renameSync(temporaryFile, dataFile)
}

function validateStudent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Student data must be an object.'
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const course = typeof body.course === 'string' ? body.course.trim() : ''
  const year = Number(body.year)
  const status = body.status

  if (!name || name.length > 100) return 'Name is required and must be 100 characters or fewer.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return 'Enter a valid email address.'
  if (!course || course.length > 100) return 'Course is required and must be 100 characters or fewer.'
  if (!Number.isInteger(year) || year < 1 || year > 8) return 'Year must be a whole number between 1 and 8.'
  if (!['Active', 'On leave'].includes(status)) return 'Choose Active or On leave for the student status.'
  return { name, email, course, year, status }
}

app.use(express.json({ limit: '16kb' }))

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/students', (_request, response) => {
  response.json(readStudents())
})

app.post('/api/students', (request, response) => {
  const student = validateStudent(request.body)
  if (typeof student === 'string') return response.status(400).json({ error: student })

  const students = readStudents()
  if (students.some((record) => record.email === student.email)) {
    return response.status(409).json({ error: 'A student with that email address already exists.' })
  }
  const createdStudent = { id: randomUUID(), ...student }
  saveStudents([createdStudent, ...students])
  return response.status(201).json(createdStudent)
})

app.put('/api/students/:id', (request, response) => {
  const student = validateStudent(request.body)
  if (typeof student === 'string') return response.status(400).json({ error: student })

  const students = readStudents()
  const studentIndex = students.findIndex((record) => record.id === request.params.id)
  if (studentIndex === -1) return response.status(404).json({ error: 'Student not found.' })
  if (students.some((record) => record.id !== request.params.id && record.email === student.email)) {
    return response.status(409).json({ error: 'A student with that email address already exists.' })
  }
  const updatedStudent = { id: request.params.id, ...student }
  students[studentIndex] = updatedStudent
  saveStudents(students)
  return response.json(updatedStudent)
})

app.delete('/api/students/:id', (request, response) => {
  const students = readStudents()
  const remainingStudents = students.filter((student) => student.id !== request.params.id)
  if (remainingStudents.length === students.length) return response.status(404).json({ error: 'Student not found.' })
  saveStudents(remainingStudents)
  return response.status(204).end()
})

app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' })
  }
  return next(error)
})

app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }))
app.use(express.static(path.join(root, 'dist')))
app.use((_request, response, next) => {
  response.sendFile(path.join(root, 'dist', 'index.html'), (error) => {
    if (error) next(error)
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Student directory listening on port ${port}`)
})