const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { status } = require('minecraft-server-util');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let statusMessage;
let statusInterval;

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '/status') {
        if (statusMessage) return message.channel.send('Status déjà actif !');

        statusMessage = await message.channel.send({ embeds: [await createStatusEmbed()] });

        statusInterval = setInterval(async () => {
            if (statusMessage) {
                statusMessage.edit({ embeds: [await createStatusEmbed()] });
            }
        }, config.refreshDelay);
    }

    if (message.content === '/stopstatus') {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
            statusMessage = null;
            message.channel.send({ embeds: [new EmbedBuilder()
                .setTitle('✅ Mise à jour arrêtée avec succès !')
                .setColor('Green')
                .setTimestamp()]});
        } else {
            message.channel.send('Aucune mise à jour active.');
        }
    }
});

async function createStatusEmbed() {
    try {
        const [host, port] = config.serverIP.split(':');
        const result = await status(host, parseInt(port));
        const onlinePlayers = result.players.online;
        const maxPlayers = result.players.max;
        const version = result.version.name;

        return new EmbedBuilder()
            .setTitle(`🎮 ${config.serverName}`)
            .setColor(config.onlineColor)
            .setThumbnail(config.serverLogo)
            .addFields(
                { name: '🖥 IP', value: `\`${config.serverIP}\``, inline: true },
                { name: '👥 Joueurs', value: `\`${onlinePlayers} / ${maxPlayers}\``, inline: true },
                { name: '🛡 Version', value: `\`${version}\``, inline: true },
                { name: 'Statut', value: '🟢 En ligne', inline: false }
            )
            .setTimestamp();
    } catch (error) {
        return new EmbedBuilder()
            .setTitle(`🎮 ${config.serverName}`)
            .setColor(config.offlineColor)
            .setThumbnail(config.serverLogo)
            .addFields(
                { name: '🖥 IP', value: `\`${config.serverIP}\``, inline: true },
                { name: 'Statut', value: '🔴 Hors ligne', inline: false }
            )
            .setTimestamp();
    }
}

client.login('process.env.DISCORD_TOKEN'); // Remplace par ton token de bot
