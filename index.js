require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require('discord.js');
const { setInterval } = require('timers');

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '1153467171150762025';
const validTokens = new Set(['Kep9w4rCgMx09o', 'p67hP6WQssj0Km', 'Token3']);
const messageQueue = [];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Start the background task
    setInterval(async () => {
        if (messageQueue.length > 0) {
            const data = messageQueue.shift();
            console.log(`Sending to Discord: ${data}`);

            const channel = await client.channels.fetch(CHANNEL_ID);
            const content = `Transaction Alert: ${JSON.stringify(data)}`;

            try {
                await channel.send(content);
            } catch (e) {
                console.error(`Error sending message: ${e}`);
            }
        }
    }, 5000);
});

app.use(bodyParser.json());

app.post('/', (req, res) => {
    const webhookToken = req.headers['arkham-webhook-token'];

    if (!validTokens.has(webhookToken)) {
        return res.status(403).send('Forbidden');
    }

    console.log('Received Webhook:', req.body);

    // Append data to our queue
    messageQueue.push(req.body);
    console.log(`Current Queue: ${JSON.stringify(messageQueue)}`);

    res.status(200).send({ message: 'Received and forwarded' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Webhook receiver listening on port ${PORT}`);
});

// Start the Discord bot
client.login(BOT_TOKEN);
