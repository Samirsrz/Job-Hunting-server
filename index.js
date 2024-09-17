const express = require('express')
const app = express();
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')

const port = process.env.port || 8000

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))
  
  app.use(express.json())
  app.use(cookieParser())












app.get('/', (req, res) => {
  res.send('Hello from jobHunting..')
})

app.listen(port, () => {
  console.log(`Job Hunting is running on port ${port}`)
})
