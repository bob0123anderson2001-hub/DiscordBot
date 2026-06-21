const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const NORLINK_URL = "https://script.google.com/macros/s/AKfycbyZx9Ldy12lEnxW4uEkLKsNHIFugPpYcShn40PhQVzZ8jxhDDsIKNOiTxYgvhOwXlJn/exec";
const CHANNEL_ID = "1518112866002141306";

let lastCount = 0;

// SEND Discord → NORLINK
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
        console.log("Send error:", err.message);
    }
});

// POLL NORLINK → Discord
async function poll() {
    try {
        const res = await axios.get(NORLINK_URL);
        const data = res.data;

        if (!data.messages) return;

        if (data.messages.length > lastCount) {
            const newMessages = data.messages.slice(lastCount);

            const channel = client.channels.cache.get(CHANNEL_ID);

            for (const msg of newMessages) {
                // prevent echo loop
                if (msg.platform === "discord") continue;

                if (channel) {
                    channel.send(`**[${msg.platform}] ${msg.author}:** ${msg.content}`);
                }
            }

            lastCount = data.messages.length;
        }
    } catch (err) {
        console.log("Poll error:", err.message);
    }
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    setInterval(poll, 2000);
});

client.login("MTQ5Nzk4MjcyOTA4ODY2MzcwMg.GBVgI1.321fUdSIJQm7103WEj-5QVrcuoDwD0YOqmgzjY");