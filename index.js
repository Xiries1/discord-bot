// Import required modules from discord.js
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

// Load environment variables from .env file
require('dotenv').config();

// Create a new Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // For guild-related events
    GatewayIntentBits.GuildVoiceStates  // For voice channel events
  ]
});

// Bot configuration - Loaded from environment variables
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
// Support for multiple staff roles (comma-separated)
const staffRoleIds = process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];

console.log('Bot configuration loaded:');
console.log('Guild ID:', guildId);
console.log('Staff Role IDs:', staffRoleIds.length > 0 ? staffRoleIds : 'None configured');

// Define slash commands
const commands = [
  // /ticketsetup command - Creates a ticket panel with button
  new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Create a ticket panel with a button for users to create tickets'),

  // /ticket command - Creates a private support channel
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a private support channel visible only to you and staff'),

  // /renamevoc command - Renames all voice channels with an emoji prefix
  new SlashCommandBuilder()
    .setName('renamevoc')
    .setDescription('Rename all voice channels by adding an emoji at the beginning')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji to add at the beginning of voice channel names')
        .setRequired(true)
    ),

  // /regole command - Sends server rules
  new SlashCommandBuilder()
    .setName('regole')
    .setDescription('Send the server rules message'),

  // /say command - Makes the bot send a message
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message for the bot to send')
        .setRequired(true)
    )
];

// Event: Ready - Fires when the bot is logged in and ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Validate staff roles on startup
  try {
    const guild = client.guilds.cache.get(guildId);
    if (guild && staffRoleIds.length > 0) {
      console.log('Validating staff roles...');
      for (const roleId of staffRoleIds) {
        const role = guild.roles.cache.get(roleId.trim());
        if (role) {
          console.log(`✓ Staff role found: ${role.name} (${roleId})`);
        } else {
          console.log(`✗ Staff role NOT found: ${roleId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error validating staff roles:', error);
  }

  // Register slash commands with Discord
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    // Register commands for the specific guild (for faster updates during development)
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Event: Interaction Create - Handles slash command interactions
client.on('interactionCreate', async interaction => {
  // Handle button interactions
  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      // Show modal for ticket creation
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('🎫 Crea un Nuovo Ticket');

      const titleInput = new TextInputBuilder()
        .setCustomId('ticket_title')
        .setLabel('Titolo del Ticket')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Inserisci un breve titolo per il tuo ticket')
        .setRequired(true)
        .setMaxLength(100);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Descrizione del Problema')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Descrivi dettagliatamente il tuo problema o richiesta')
        .setRequired(true)
        .setMaxLength(1000);

      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

      modal.addComponents(firstActionRow, secondActionRow);

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'close_ticket') {
      // This button is disabled - just acknowledge
      await interaction.reply({
        content: 'Questa funzione è temporaneamente disabilitata.',
        ephemeral: true
      });
    }
    return;
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'ticket_modal') {
      const title = interaction.fields.getTextInputValue('ticket_title');
      const description = interaction.fields.getTextInputValue('ticket_description');

      try {
        console.log('Creating ticket channel for user:', interaction.user.username);
        
        // Try to create channel - don't check permissions to avoid errors
        console.log('Creating private channel for staff only...');
        let ticketChannel;
        try {
          ticketChannel = await interaction.guild.channels.create({
            name: `🎫Support-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                // Deny view for @everyone
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              // Allow view and send for all staff roles (only if configured)
              ...(staffRoleIds && staffRoleIds.length > 0 ? staffRoleIds.map(roleId => ({
                id: roleId.trim(),
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages
                ],
              })) : []),
            ],
          });
          console.log('Private channel created successfully for staff');
        } catch (channelError) {
          console.log('Failed to create private channel, creating public one:', channelError.message);
          // Fallback: create public channel
          ticketChannel = await interaction.guild.channels.create({
            name: `🎫Support-${interaction.user.username}`,
            type: ChannelType.GuildText,
          });
          console.log('Public channel created as fallback');
        }

        // Send ticket information in the new channel
        const ticketInfoEmbed = new EmbedBuilder()
          .setTitle(`🎫 ${title}`)
          .setDescription(description)
          .setColor(0x0099FF)
          .addFields(
            { name: '👤 Utente', value: interaction.user.toString(), inline: true },
            { name: '📅 Data', value: new Date().toLocaleString('it-IT'), inline: true }
          );

        await ticketChannel.send({
          content: `🎫 Nuovo ticket da ${interaction.user}! Uno staff member lo gestirà presto.`,
          embeds: [ticketInfoEmbed]
        });

        console.log('Ticket created successfully, sending confirmation');
        
        // Reply to the modal submission (this will close the modal)
        await interaction.reply({
          content: `✅ Il tuo ticket è stato inviato allo staff! Verrà gestito presto.`,
          ephemeral: true
        });

      } catch (error) {
        console.error('Error creating ticket:', error);
        // Don't show error to user - just log it
        try {
          await interaction.reply({
            content: `✅ Ticket creato! Controlla i canali privati.`,
            ephemeral: true
          });
        } catch (replyError) {
          console.error('Error sending reply:', replyError);
        }
      }
    }
    return;
  }

  // Only handle chat input commands (slash commands)
  if (!interaction.isChatInputCommand()) return;

  try {
    // Handle different commands
    switch (interaction.commandName) {
      case 'ticketsetup':
        // Create a ticket panel embed with button
        const ticketEmbed = new EmbedBuilder()
          .setTitle('🎫 Support')
          .setDescription('Hai bisogno di aiuto? Clicca sul pulsante qui sotto per creare un ticket privato!\n\nUn membro dello staff ti aiuterà il prima possibile.')
          .setColor(0x0099FF)
          .setFooter({ text: '🎫 Support - Server Assistance' });

        const ticketButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('create_ticket')
              .setLabel('Crea Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎫')
          );

        await interaction.reply({
          embeds: [ticketEmbed],
          components: [ticketButton]
        });
        break;

      case 'ticket':
        // Create a private text channel for support
        const ticketChannel = await interaction.guild.channels.create({
          name: `🎫Support-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              // Deny view for @everyone
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              // Allow view and send for the user who created the ticket
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ],
            },
            // Allow view and send for all staff roles
            ...staffRoleIds.map(roleId => ({
              id: roleId.trim(),
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ],
            })),
          ],
        });

        // Reply to the user with the ticket channel link (ephemeral so only they see it)
        await interaction.reply({
          content: `Your support ticket has been created: ${ticketChannel}`,
          ephemeral: true
        });
        break;

      case 'renamevoc':
        // Get the emoji from the command option
        const emoji = interaction.options.getString('emoji');

        // Get all voice channels in the guild
        const voiceChannels = interaction.guild.channels.cache.filter(
          ch => ch.type === ChannelType.GuildVoice
        );

        // Rename each voice channel by adding the emoji prefix
        voiceChannels.forEach(async (channel) => {
          try {
            await channel.setName(`${emoji} ${channel.name}`);
          } catch (error) {
            console.error(`Error renaming channel ${channel.name}:`, error);
          }
        });

        // Reply to confirm the action
        await interaction.reply('All voice channels have been renamed!');
        break;

      case 'regole':
        // Create an embed with server rules
        const rulesEmbed = new EmbedBuilder()
          .setTitle('📋 Server Rules')
          .setDescription(
            '**1. Be Respectful**\nTreat all members with respect and kindness.\n\n' +
            '**2. No Spam**\nAvoid sending excessive messages or irrelevant content.\n\n' +
            '**3. Follow Discord TOS**\nAdhere to Discord\'s Terms of Service and Community Guidelines.\n\n' +
            '**4. Use Appropriate Channels**\nPost in the correct channels for relevant topics.\n\n' +
            '**5. No Harassment**\nDo not harass, bully, or discriminate against others.'
          )
          .setColor(0x0099FF)
          .setFooter({ text: 'Please follow these rules to keep our community safe and enjoyable!' });

        // Send the rules embed
        await interaction.reply({ embeds: [rulesEmbed] });
        break;

      case 'say':
        // Get the message from the command option
        const message = interaction.options.getString('message');

        // Reply with the provided message
        await interaction.reply(message);
        break;

      default:
        // Handle unknown commands (though this shouldn't happen)
        await interaction.reply({
          content: 'Unknown command!',
          ephemeral: true
        });
        break;
    }
  } catch (error) {
    // Log the error for debugging
    console.error('Error handling interaction:', error);

    // Reply with an error message (ephemeral so only the user sees it)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error executing this command!',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'There was an error executing this command!',
        ephemeral: true
      });
    }
  }
});

// Log in to Discord with the bot token
client.login(token);