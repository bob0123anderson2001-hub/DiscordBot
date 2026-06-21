require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const NORLINK_URL = process.env.NORLINK_URL;
const CHANNEL_ID = process.env.CHANNEL_ID;

let lastCount = 0;

// Discord → NORLINK
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== CHANNEL_ID) return;

    try {
        await axios.post(NORLINK_URL, {
            author: message.author.username,
            platform: "discord",
            content: message.content
        });
    } catch (err) {
        console.log("NORLINK send error:", err.message);
    }
});

// NORLINK → Discord
async function pollNORLINK() {
    try {
        const res = await axios.get(NORLINK_URL);
        const data = res.data;

        if (!data.messages) return;

        const channel = await client.channels.fetch(CHANNEL_ID);

        if (data.messages.length > lastCount) {
            const newMessages = data.messages.slice(lastCount);

            for (const msg of newMessages) {
                if (msg.platform === "discord") continue;

                channel.send(`**[${msg.platform}] ${msg.author}:** ${msg.content}`);
            }

            lastCount = data.messages.length;
        }

    } catch (err) {
        console.log("NORLINK poll error:", err.message);
    }
}

client.once("ready", () => {
    console.log(`NORLINK online as ${client.user.tag}`);

    setInterval(pollNORLINK, 2000);
});

client.login(process.env.DISCORD_TOKEN);
