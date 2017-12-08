const express = require('express')
const xmlparser = require('express-xml-bodyparser')
const app = express()

app.use(xmlparser())

const welcomeMessage = `Welcome to De Bijenkorf! What can I help you with?`
const floorplanImage =
  '9ps0efzuyASZj-MIt_RGlXxe0xVLuaWgpvAeeo7fOTBb2_dbc07itn1sUx_bSuYA'
const christmasVideo =
  'ZUWpYMvp6xzvPSF9jYEpGQ_LpOH0oVVRMtpwCYEt8ULbH3lyJav9ds9t-ZaS7kCO'
const getMediaTemplate = (to, from, type, id) => `
  <xml>
    <ToUserName><![CDATA[${to}]]></ToUserName>
    <FromUserName><![CDATA[${from}]]></FromUserName>
    <CreateTime>${new Date().getTime() / 1000}</CreateTime>
    <MsgType><![CDATA[${type}]]></MsgType>
    <${type.charAt(0).toUpperCase() + type.slice(1)}>
      <MediaId><![CDATA[${id}]]></MediaId>
    </${type.charAt(0).toUpperCase() + type.slice(1)}>
  </xml>
`

const getMessageTemplate = (to, from, content) => `
  <xml>
    <ToUserName><![CDATA[${to}]]></ToUserName>
    <FromUserName><![CDATA[${from}]]></FromUserName>
    <CreateTime>${new Date().getTime() / 1000}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
    <FuncFlag>0</FuncFlag>
  </xml>
`

const hasEchoString = req => !!req.query.echostr
const getEchoString = req => req.query.echostr

const handleEvent = message => {
  const from = message.fromusername[0]
  const to = message.tousername[0]
  const event = message.event[0]

  console.log('Handling event: ', event)
  switch (event.toLowerCase()) {
    case 'subscribe':
      return getMessageTemplate(from, to, welcomeMessage)
    case 'unsubscribe':
      return ''
    case 'scancode_waitmsg':
      return getMessageTemplate(
        from,
        to,
        'You scanned: Gucci hand bag, € 1499,- (discounted from € 2099,-)'
      )
    case 'click':
      const key = message.eventkey[0]
      console.log('Click event: ', key)
      if (key === 'floorplan')
        return getMediaTemplate(from, to, 'image', floorplanImage)
      else if (key === 'mandarin')
        return getMessageTemplate(from, to, '好的，你现在在哪儿？')
      else if (key === 'vip')
        return getMessageTemplate(
          from,
          to,
          'When would you like to have your appointment?'
        )
      else if (key === 'christmas')
        return getMediaTemplate(from, to, 'video', christmasVideo)
  }
}

const handleText = message => {
  const from = message.fromusername[0]
  const to = message.tousername[0]
  const content = message.content[0]
  console.log('Handling text message: ', content)

  // Do some fuzzy matching
  if (content.indexOf('store') > -1)
    return getMessageTemplate(
      from,
      to,
      'I will help you find it. Where are you now?'
    )
  if (content.indexOf('floorplan') > -1)
    return getMediaTemplate(from, to, 'image', floorplanImage)
  if (content.indexOf('help') > -1)
    return getMessageTemplate(from, to, 'Is there an emergency?')
  if (content.indexOf('电梯') > -1)
    return getMessageTemplate(from, to, '好的，您稍等，Anna马上就到您的位置')
  if (content.toLowerCase().indexOf('friday') > -1)
    return getMessageTemplate(
      from,
      to,
      "Okay, I've booked an appointment next Friday in our Amsterdam store"
    )

  // One-on-one matches
  switch (content) {
    case '?':
      return getMessageTemplate(from, to, welcomeMessage)
  }

  return getMessageTemplate(
    from,
    to,
    'Sorry, I did not understand your message. I will forward it to one of our customer service representatives'
  )
}

const handleMessage = message => {
  const msgType = message.msgtype[0]
  const from = message.fromusername[0]
  const to = message.tousername[0]

  console.log('Handling message: ', msgType)
  switch (msgType) {
    case 'event':
      return handleEvent(message)
    case 'text':
      return handleText(message)
    case 'location':
      return getMessageTemplate(
        from,
        to,
        'The nearest Bijenkorf is in Amsterdam, Dam 1, 1012 JS'
      )
    case 'voice':
    case 'video':
    case 'image':
      return getMediaTemplate(from, to, msgType, message.mediaid[0])
  }
}

app.get('/', (req, res) => res.send('Connected to WeChat API'))
app.get('/weixin', (req, res) => {
  if (hasEchoString(req)) return res.send(getEchoString(req))
  res.status(404).send('Connected to WeChat API')
})

app.post('/weixin', (req, res) => {
  console.log('Received message:', req.body.xml)
  const response = handleMessage(req.body.xml)
  console.log('Responding:', response)
  res.status(200).send(response)
})

app.listen(3000, () => console.log('WeChat API listening on port 3000!'))
