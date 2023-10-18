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
const alertChannelMap = {
    'BLZ Accumulatoors': '1153467171150762025', // Discord channel ID for 'BLZ Accumulatoors' alerts
    'Lever Top Holders': '1155319035286798446', // Discord channel ID for another alert type
    'DWF': '1155330376244396072', // Discord channel ID for DWF Labs
    'BTC Whales': '1164295686465003550', // Discord channel ID for Solana alerts
    // ... Add other mappings as needed
};
const validTokens = new Set(['Kep9w4rCgMx09o', 'p67hP6WQssj0Km', 'Token3']);
const messageQueue = [];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Start the background task
    setInterval(async () => {
        if (messageQueue.length > 0) {
            const data = messageQueue.shift();
            const transaction = data.transfer;
            // Determine the appropriate channel based on alertName
            const targetChannelId = alertChannelMap[data.alertName];
            if (!targetChannelId) {
                console.error(`No channel mapped for alertName: ${data.alertName}`);
                return;
            }

            // Create the embed
            const arkhamWebhookEmbed = new EmbedBuilder()
                .setColor(0x3498db) // A nice blue color; you can change this
                .setTitle('New Token Transfer!')

                .addFields(
                    { name: 'Token Symbol', value: transaction.tokenSymbol, inline: true },
                    { name: 'Chain', value: transaction.chain, inline: true },
                    { name: 'Amount', value: `${transaction.unitValue}`, inline: false },
                    { name: 'Amount in USD', value:  `$${parseFloat(transaction.historicalUSD).toFixed(2)}`, inline: true },
                    { name: 'View tx on', value: `[Etherscan](https://etherscan.io/tx/${transaction.transactionHash})`, inline: false },
                    { name: 'View tx on', value: `[Arkham](https://platform.arkhamintelligence.com/explorer/tx/${transaction.transactionHash})`, inline: true },
                    { name: 'time of transaction', value: transaction.blockTimestamp, inline: false },
                )

            console.log(`Sending to Discord: ${JSON.stringify(data)}`);
            const channel = await client.channels.fetch(targetChannelId);
            try {
                await channel.send({ embeds: [arkhamWebhookEmbed] });
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
