import puppeteer from 'puppeteer-core'
import { Cron } from 'croner'
import http from 'http'
import data from './data.json' assert { type: 'json' }

const args = process.argv 

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Server launched, and backend script running...\n')
})

server.listen(5000, () => {
  console.log('Server listening on http://localhost:5000')

  // After server is running, start the puppeteer logic
  if (args.includes('-t')) {
    console.log('--- Test run ---')
    visit()
  } else {
    Cron('*/20 * * * * *', visit) // Every 20 seconds
  }
})

const visit = async () => {
  const browser = await puppeteer.launch({
    product: 'firefox',
    executablePath: '/usr/bin/firefox',
    headless: true,
    ignoreHTTPSErrors: true // To handle cert issues like SEC_ERROR_UNKNOWN_ISSUER
  })

  console.log('Run at', new Date())

  for (const site of data) {
    for (const pg of site.pages) {
      const path = 'https://' + site.hostname + '/' + pg + '?pageshieldforcecsp'
      console.log('->', path)
      try {
        const page = await browser.newPage()
        await page.goto(path, { timeout: 60000, waitUntil: 'domcontentloaded' })
      } catch (e) {
        console.log('Error:', e.message, path)
      }
    }
  }

  await browser.close()
}
