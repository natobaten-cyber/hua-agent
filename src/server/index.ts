import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { initDb } from './db'
import router from './routes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use('/api', router)

// 正式環境：serve React build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist/renderer')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('DB init failed:', err)
  process.exit(1)
})
