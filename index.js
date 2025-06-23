require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Helper: Wait for reply
async function waitForReply(member, question) {
  await member.send(question);
  const filter = (msg) => msg.author.id === member.id;
  const dmChannel = await member.createDM();

  const collected = await dmChannel.awaitMessages({
    filter,
    max: 1,
    time: 60_000,
    errors: ["time"],
  });

  return collected.first().content;
}

// When Bot is ready
client.once("ready", async () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);

  // Register Slash Command
  const commands = [
    new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Start the verification process")
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, "738955089225449513"),
      { body: commands },
    );
    console.log("✅ Slash command registered");
  } catch (error) {
    console.error("❌ Slash command registration failed:", error);
  }
});

// Slash command interaction
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "verify") {
    try {
      await interaction.reply({
        content: "📬 Check your DMs to continue verification!",
        ephemeral: true,
      });

      const member = interaction.member;
      const user = interaction.user;

      const name = await waitForReply(user, "1️⃣ What is your **name**?");
      const age = await waitForReply(user, "2️⃣ What is your **age**?");
      const place = await waitForReply(user, "3️⃣ Where are you from?");

      await user.send(
        `✅ Thank you!\n- Name: ${name}\n- Age: ${age}\n- Place: ${place}`,
      );

      // Add "Verified" role
      const verifiedRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Verified",
      );
      if (verifiedRole) {
        await member.roles.add(verifiedRole);
        await user.send(
          "✅ You have been verified and given access to the server!",
        );
      } else {
        await user.send(
          "⚠️ Verified role not found. Please contact a moderator.",
        );
      }

      // Log in private channel
      const logChannel = interaction.guild.channels.cache.find(
        (ch) =>
          ch.name === "verification-logs" && ch.type === ChannelType.GuildText,
      );
      if (logChannel) {
        logChannel.send(
          `📋 **New Verified User**\n👤 Name: ${name}\n🎂 Age: ${age}\n📍 Location: ${place}\n🆔 User: <@${user.id}>`,
        );
      }
    } catch (error) {
      console.error("❌ Verification failed:", error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const now = new Date().toLocaleTimeString();
  console.log(`✅ Ping received from UptimeRobot at ${now}`);
  res.send("Bot is alive!");
});

app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});
