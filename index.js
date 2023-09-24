require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
            const transaction = data.transfer;

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle("New Token Transfer!")
                .setColor(0x3498db) // A nice blue color; you can change this
                .addField('Token Symbol', transaction.tokenSymbol, true)
                .addField('Chain', transaction.chain, true)
                .addField('\u200B', '\u200B')                       // Empty field to create a little space
                .addField('Amount', `${transaction.unitValue}`, true)
                .addField('Amount in USD', `$${parseFloat(transaction.historicalUSD).toFixed(2)}`, true)
                .addField('tx', `[View on Etherscan](https://etherscan.io/tx/${transaction.transactionHash})`, true)
                .addField('tx', `[View on Arkham](https://platform.arkhamintelligence.com/explorer/tx/${transaction.transactionHash})`, true)
                .addField('time of transaction', transaction.blockTimestamp, false);
                
        
            console.log(`Sending to Discord: ${JSON.stringify(data)}`);
            const channel = await client.channels.fetch(CHANNEL_ID);
            try {
                await channel.send({ embeds: [embed] });
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
