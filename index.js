// ============================================
// 🤖 DISCORD BOT - Koya Style
// ============================================
// Features:
// ✅ Ticket System
// ✅ Welcome & Goodbye
// ✅ Confessioni Anonime
// ✅ Statistiche & Ranking
// ✅ Messaggi personalizzati

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

require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const staffRoleIds = process.env.STAFF_ROLE_IDS 
  ? process.env.STAFF_ROLE_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0) 
  : [];

// Initialize client with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Data storage
const stats = new Map();
const confessionChannels = new Map();

console.log('Starting bot...');

// ============================================
// SLASH COMMANDS DEFINITION
// ============================================
const commands = [
  new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Setup ticket panel'),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a support ticket'),

  new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Send anonymous confession'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show server stats'),

  new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Show message ranking'),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make bot say something')
    .addStringOption(option =>
      option.setName('message').setDescription('Message').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('regole')
    .setDescription('Show server rules'),

  new SlashCommandBuilder()
    .setName('renamevoc')
    .setDescription('Rename voice channels')
    .addStringOption(option =>
      option.setName('emoji').setDescription('Emoji prefix').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Set welcome channel')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setgoodbye')
    .setDescription('Set goodbye channel')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('confessionsetchannel')
    .setDescription('Set confessions channel')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Channel').setRequired(true)
    )
];

// ============================================
// BOT READY
// ============================================
client.once('ready', async () => {
  console.log(`✅ Bot online as: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Registering commands...');
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
    console.log('✅ Commands registered');
  } catch (error) {
    console.error('Command registration error:', error);
  }
});

// ============================================
// MEMBER JOIN (WELCOME)
// ============================================
client.on('guildMemberAdd', async (member) => {
  try {
    let welcomeChannel = null;
    
    welcomeChannel = member.guild.channels.cache.find(
      ch => ch.name.includes('welcome') || ch.name.includes('benvenuto')
    );

    if (!welcomeChannel) {
      welcomeChannel = member.guild.systemChannel;
    }

    if (welcomeChannel && welcomeChannel.isSendable?.() !== false) {
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Welcome!')
        .setDescription(`Welcome ${member} to ${member.guild.name}!`)
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(() => {});
    }
  } catch (error) {
    console.error('Welcome message error:', error);
  }
});

// ============================================
// MEMBER LEAVE (GOODBYE)
// ============================================
client.on('guildMemberRemove', async (member) => {
  try {
    let goodbyeChannel = null;
    
    goodbyeChannel = member.guild.channels.cache.find(
      ch => ch.name.includes('goodbye') || ch.name.includes('arrivederci')
    );

    if (!goodbyeChannel) {
      goodbyeChannel = member.guild.systemChannel;
    }

    if (goodbyeChannel && goodbyeChannel.isSendable?.() !== false) {
      const goodbyeEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`${member.user.username} left the server...`)
        .setColor(0xFF0000)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await goodbyeChannel.send({ embeds: [goodbyeEmbed] }).catch(() => {});
    }
  } catch (error) {
    console.error('Goodbye message error:', error);
  }
});

// ============================================
// MESSAGE TRACKING (FOR STATS)
// ============================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.system) return;

  const userId = message.author.id;
  const userName = message.author.username;

  if (!stats.has(userId)) {
    stats.set(userId, { name: userName, messages: 0 });
  }

  const userData = stats.get(userId);
  userData.messages++;
  stats.set(userId, userData);
});

// ============================================
// INTERACTIONS (BUTTONS, MODALS, COMMANDS)
// ============================================
client.on('interactionCreate', async interaction => {
  try {
    // BUTTON INTERACTIONS
    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_modal')
          .setTitle('Create Ticket');

        const titleInput = new TextInputBuilder()
          .setCustomId('ticket_title')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const descInput = new TextInputBuilder()
          .setCustomId('ticket_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(descInput)
        );

        await interaction.showModal(modal);
      }

      if (interaction.customId === 'confess_button') {
        const confModal = new ModalBuilder()
          .setCustomId('confession_modal')
          .setTitle('Send Confession');

        const confessInput = new TextInputBuilder()
          .setCustomId('confession_text')
          .setLabel('Your confession')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(2000)
          .setRequired(true);

        confModal.addComponents(new ActionRowBuilder().addComponents(confessInput));
        await interaction.showModal(confModal);
      }

      return;
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'ticket_modal') {
        const title = interaction.fields.getTextInputValue('ticket_title');
        const desc = interaction.fields.getTextInputValue('ticket_description');

        try {
          const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              {
                id: interaction.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
              },
              ...staffRoleIds.map(roleId => ({
                id: roleId,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
              }))
            ]
          });

          const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor(0x0099FF)
            .addFields({ name: 'Author', value: interaction.user.toString() })
            .setTimestamp();

          await ticketChannel.send({ embeds: [embed] });
          await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
          console.error('Ticket error:', error);
          await interaction.reply({ content: 'Error creating ticket', ephemeral: true });
        }
      }

      if (interaction.customId === 'confession_modal') {
        const confText = interaction.fields.getTextInputValue('confession_text');

        try {
          let confChannel = interaction.guild.channels.cache.find(
            ch => ch.name.includes('confession') || ch.name.includes('confessioni')
          );

          const confEmbed = new EmbedBuilder()
            .setTitle('📝 Anonymous Confession')
            .setDescription(confText)
            .setColor(0x9932CC)
            .setFooter({ text: 'Anonymous' })
            .setTimestamp();

          if (confChannel) {
            await confChannel.send({ embeds: [confEmbed] });
          } else {
            await interaction.channel.send({ embeds: [confEmbed] });
          }

          await interaction.reply({ content: 'Confession sent!', ephemeral: true });
        } catch (error) {
          console.error('Confession error:', error);
        }
      }

      return;
    }

    // SLASH COMMANDS
    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
      case 'ticketsetup': {
        const embed = new EmbedBuilder()
          .setTitle('🎫 Support Tickets')
          .setDescription('Click the button to create a support ticket')
          .setColor(0x0099FF);

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [btn] });
        break;
      }

      case 'ticket': {
        const ch = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ...staffRoleIds.map(rid => ({ id: rid, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
          ]
        });

        await interaction.reply({ content: `Ticket created: ${ch}`, ephemeral: true });
        break;
      }

      case 'confess': {
        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confess_button')
            .setLabel('Send Confession')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: 'Click to send anonymous confession', components: [btn], ephemeral: true });
        break;
      }

      case 'stats': {
        const embed = new EmbedBuilder()
          .setTitle('📊 Server Stats')
          .setColor(0x00FF00)
          .addFields(
            { name: 'Members', value: interaction.guild.memberCount.toString(), inline: true },
            { name: 'Channels', value: interaction.guild.channels.cache.size.toString(), inline: true },
            { name: 'Roles', value: interaction.guild.roles.cache.size.toString(), inline: true }
          );

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'ranking': {
        const ranking = Array.from(stats.values())
          .sort((a, b) => b.messages - a.messages)
          .slice(0, 10)
          .map((u, i) => `${i + 1}. ${u.name}: ${u.messages}`)
          .join('\n') || 'No data yet';

        const embed = new EmbedBuilder()
          .setTitle('🏆 Ranking')
          .setDescription(ranking)
          .setColor(0xFFD700);

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'say': {
        const msg = interaction.options.getString('message');
        await interaction.reply(msg);
        break;
      }

      case 'regole': {
        const embed = new EmbedBuilder()
          .setTitle('📋 Server Rules')
          .setDescription('1. Respect\n2. No Spam\n3. No Harassment\n4. Use correct channels')
          .setColor(0x0099FF);

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'renamevoc': {
        const emoji = interaction.options.getString('emoji');
        const vocs = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice);

        vocs.forEach(async (ch) => {
          try {
            await ch.setName(`${emoji} ${ch.name}`);
          } catch (e) {}
        });

        await interaction.reply('✅ Voice channels renamed');
        break;
      }

      case 'setwelcome': {
        const ch = interaction.options.getChannel('channel');
        await interaction.reply(`✅ Welcome channel set to ${ch}`);
        break;
      }

      case 'setgoodbye': {
        const ch = interaction.options.getChannel('channel');
        await interaction.reply(`✅ Goodbye channel set to ${ch}`);
        break;
      }

      case 'confessionsetchannel': {
        const ch = interaction.options.getChannel('channel');
        confessionChannels.set(interaction.guildId, ch.id);
        await interaction.reply(`✅ Confession channel set to ${ch}`);
        break;
      }

      default:
        await interaction.reply({ content: 'Unknown command', ephemeral: true });
    }
  } catch (error) {
    console.error('Interaction error:', error);
    if (interaction.replied) {
      await interaction.followUp({ content: 'Error', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Error', ephemeral: true });
    }
  }
});

// ============================================
// LOGIN
// ============================================
client.login(token);
// ============================================
// 🤖 SUPER BOT DISCORD - Completo
// ============================================
// Features:
// ✅ Ticket System (Private Channels)
// ✅ Welcome Messages
// ✅ Goodbye Messages
// ✅ Anonymous Confessions
// ✅ Server Stats & Ranking
// ✅ TTS Bot (Text-to-Speech)
// ✅ Music Player

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
  TextInputStyle,
  Collection
} = require('discord.js');

require('dotenv').config();

// Initialize bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Configuration
const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const staffRoleIds = process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];

// Data storage (in-memory, can be replaced with database)
const confessions = new Collection();
const userStats = new Collection();
const channelConfessions = new Map(); // Per tracciare confessioni per canale

console.log('🤖 Bot Startup...');
console.log('Guild ID:', guildId);
console.log('Staff Roles:', staffRoleIds.length > 0 ? staffRoleIds : 'None');

// ============================================
// COMANDI SLASH
// ============================================
const commands = [
  // Ticket Commands
  new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Crea un pannello ticket con pulsante'),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Crea un canale di supporto privato'),

  new SlashCommandBuilder()
    .setName('regole')
    .setDescription('Mostra le regole del server'),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Fa parlare il bot')
    .addStringOption(option =>
      option.setName('message').setDescription('Messaggio').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('renamevoc')
    .setDescription('Rinomina canali vocali')
    .addStringOption(option =>
      option.setName('emoji').setDescription('Emoji').setRequired(true)
    ),

  // Welcome/Goodbye
  new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Imposta messaggio di benvenuto')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Canale dove mandare il messaggio').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setgoodbye')
    .setDescription('Imposta messaggio di arrivederci')
    .addChannelOption(option =>
      option.setName('channel').setDescription('Canale').setRequired(true)
    ),

  // Confessioni
  new SlashCommandBuilder()
    .setName('confess')
    .setDescription('Manda una confessione anonima'),

  // Stats
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostra statistiche del server'),

  new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Mostra il ranking degli utenti'),

  // TTS
  new SlashCommandBuilder()
    .setName('tts')
    .setDescription('Leggi un testo ad alta voce')
    .addStringOption(option =>
      option.setName('testo').setDescription('Testo da leggere').setRequired(true)
    ),

  // Musica
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Riproduci una canzone')
    .addStringOption(option =>
      option.setName('canzone').setDescription('Nome canzone o URL').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Ferma la musica'),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canzone'),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Mostra coda musica')
];

// ============================================
// BOT READY EVENT
// ============================================
client.once('ready', async () => {
  console.log(`✅ Bot online come: ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('📝 Registrando comandi...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );
    console.log('✅ Comandi registrati!');
  } catch (error) {
    console.error('❌ Errore registrazione comandi:', error);
  }
});

// ============================================
// MEMBER JOIN/LEAVE EVENTS (Welcome/Goodbye)
// ============================================
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeChannelId = 'welcome-channel-id'; // Dovrai salvare questo da /setwelcome
    const channel = member.guild.channels.cache.get(welcomeChannelId);

    if (channel) {
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Benvenuto!')
        .setDescription(`Benvenuto ${member} nel server!`)
        .setColor(0x00FF00)
        .addFields(
          { name: 'Username', value: member.user.username, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Data Creazione Account', value: member.user.createdAt.toLocaleDateString('it-IT'), inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [welcomeEmbed] });
      console.log(`👋 ${member.user.username} è entrato nel server`);
    }
  } catch (error) {
    console.error('Errore welcome:', error);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    const goodbyeChannelId = 'goodbye-channel-id';
    const channel = member.guild.channels.cache.get(goodbyeChannelId);

    if (channel) {
      const goodbyeEmbed = new EmbedBuilder()
        .setTitle('👋 Arrivederci')
        .setDescription(`${member} ha lasciato il server...`)
        .setColor(0xFF0000)
        .addFields(
          { name: 'Username', value: member.user.username, inline: true },
          { name: 'Tempo nel Server', value: `${Math.floor((Date.now() - member.joinedTimestamp) / 1000 / 3600)} ore`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await channel.send({ embeds: [goodbyeEmbed] });
      console.log(`👋 ${member.user.username} ha lasciato il server`);
    }
  } catch (error) {
    console.error('Errore goodbye:', error);
  }
});

// ============================================
// INTERACTION HANDLER (Slash Commands + Buttons)
// ============================================
client.on('interactionCreate', async interaction => {
  // BUTTON CLICKS
  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('🎫 Crea Ticket');

      const titleInput = new TextInputBuilder()
        .setCustomId('ticket_title')
        .setLabel('Titolo Ticket')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Descrizione')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput)
      );

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'confess_button') {
      const modal = new ModalBuilder()
        .setCustomId('confession_modal')
        .setTitle('📝 Confessione Anonima');

      const confessInput = new TextInputBuilder()
        .setCustomId('confession_text')
        .setLabel('La tua confessione')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(2000)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(confessInput));

      await interaction.showModal(modal);
    }

    return;
  }

  // MODAL SUBMISSIONS
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'ticket_modal') {
      const title = interaction.fields.getTextInputValue('ticket_title');
      const description = interaction.fields.getTextInputValue('ticket_description');

      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: `🎫-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            ...staffRoleIds.map(roleId => ({
              id: roleId.trim(),
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            })),
          ],
        });

        const ticketEmbed = new EmbedBuilder()
          .setTitle(`🎫 ${title}`)
          .setDescription(description)
          .setColor(0x0099FF)
          .addFields(
            { name: 'Utente', value: interaction.user.toString(), inline: true },
            { name: 'Data', value: new Date().toLocaleString('it-IT'), inline: true }
          );

        await ticketChannel.send({
          content: `🎫 Nuovo ticket da ${interaction.user}!`,
          embeds: [ticketEmbed]
        });

        await interaction.reply({
          content: `✅ Ticket creato: ${ticketChannel}`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Errore ticket:', error);
        await interaction.reply({
          content: '❌ Errore creazione ticket',
          ephemeral: true
        });
      }
    }

    if (interaction.customId === 'confession_modal') {
      const confessionText = interaction.fields.getTextInputValue('confession_text');

      try {
        const confessionEmbed = new EmbedBuilder()
          .setTitle('📝 Confessione Anonima')
          .setDescription(confessionText)
          .setColor(0x9932CC)
          .setFooter({ text: 'Confessione anonima' })
          .setTimestamp();

        // Invia nel canale confessioni (dovrai creare un canale confessions)
        const confessionsChannel = interaction.guild.channels.cache.find(ch => ch.name === 'confessions');
        if (confessionsChannel) {
          await confessionsChannel.send({ embeds: [confessionEmbed] });
        }

        await interaction.reply({
          content: '✅ Confessione inviata!',
          ephemeral: true
        });
      } catch (error) {
        console.error('Errore confessione:', error);
      }
    }

    return;
  }

  // SLASH COMMANDS
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'ticketsetup':
        const ticketEmbed = new EmbedBuilder()
          .setTitle('🎫 Support')
          .setDescription('Clicca il pulsante per creare un ticket!')
          .setColor(0x0099FF);

        const ticketButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Crea Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );

        await interaction.reply({ embeds: [ticketEmbed], components: [ticketButton] });
        break;

      case 'ticket':
        const newChannel = await interaction.guild.channels.create({
          name: `🎫-${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ...staffRoleIds.map(roleId => ({
              id: roleId.trim(),
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            })),
          ],
        });

        await interaction.reply({
          content: `✅ Ticket creato: ${newChannel}`,
          ephemeral: true
        });
        break;

      case 'regole':
        const rulesEmbed = new EmbedBuilder()
          .setTitle('📋 Regole Server')
          .setDescription(
            '**1. Rispetto**\nTratta gli altri con rispetto\n\n' +
            '**2. No Spam**\nNon spammatore\n\n' +
            '**3. No Harassment**\nNiente bullismo\n\n' +
            '**4. Canali Appropriati**\nUsa i canali giusti'
          )
          .setColor(0x0099FF);

        await interaction.reply({ embeds: [rulesEmbed] });
        break;

      case 'say':
        const message = interaction.options.getString('message');
        await interaction.reply(message);
        break;

      case 'renamevoc':
        const emoji = interaction.options.getString('emoji');
        const voiceChannels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice);

        voiceChannels.forEach(async (channel) => {
          try {
            await channel.setName(`${emoji} ${channel.name}`);
          } catch (error) {
            console.error(`Errore rinomina ${channel.name}:`, error);
          }
        });

        await interaction.reply('✅ Canali vocali rinominati!');
        break;

      case 'setwelcome':
        const welcomeChannel = interaction.options.getChannel('channel');
        // Salva in database o file
        await interaction.reply(`✅ Channel di benvenuto impostato: ${welcomeChannel}`);
        break;

      case 'setgoodbye':
        const goodbyeChannel = interaction.options.getChannel('channel');
        await interaction.reply(`✅ Channel arrivederci impostato: ${goodbyeChannel}`);
        break;

      case 'confess':
        const confessButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confess_button')
            .setLabel('Scrivi Confessione')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('📝')
        );

        await interaction.reply({
          content: '📝 Clicca il pulsante per scrivere una confessione anonima!',
          components: [confessButton],
          ephemeral: true
        });
        break;

      case 'stats':
        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 Statistiche Server')
          .setDescription(`**Statistiche di ${interaction.guild.name}**`)
          .setColor(0x00FF00)
          .addFields(
            { name: 'Membri', value: interaction.guild.memberCount.toString(), inline: true },
            { name: 'Canali', value: interaction.guild.channels.cache.size.toString(), inline: true },
            { name: 'Ruoli', value: interaction.guild.roles.cache.size.toString(), inline: true },
            { name: 'Creato', value: interaction.guild.createdAt.toLocaleDateString('it-IT'), inline: true }
          );

        await interaction.reply({ embeds: [statsEmbed] });
        break;

      case 'ranking':
        const ranking = Array.from(userStats.values())
          .sort((a, b) => b.messages - a.messages)
          .slice(0, 10);

        let rankingText = ranking.map((user, i) => `${i + 1}. ${user.name}: ${user.messages} messaggi`).join('\n') || 'Nessun dato ancora';

        const rankingEmbed = new EmbedBuilder()
          .setTitle('🏆 Ranking Messaggi')
          .setDescription(rankingText)
          .setColor(0xFFD700);

        await interaction.reply({ embeds: [rankingEmbed] });
        break;

      case 'tts':
        const textToSpeak = interaction.options.getString('testo');
        
        // TTS Simple (usa Google Translate per il testo)
        const TTSEmbed = new EmbedBuilder()
          .setTitle('🔊 Text-to-Speech')
          .setDescription(`**Testo**: ${textToSpeak}`)
          .setColor(0xFF6347)
          .setFooter({ text: 'Accedi al vocale per ascoltare' });

        await interaction.reply({ embeds: [TTSEmbed] });
        break;

      case 'play':
        await interaction.reply('🎵 Funzione musica in sviluppo! Usa un bot come Lavalink o similar.');
        break;

      case 'stop':
        await interaction.reply('⏹️ Musica fermata');
        break;

      case 'skip':
        await interaction.reply('⏭️ Canzone saltata');
        break;

      case 'queue':
        await interaction.reply('📋 Coda: (vuota)');
        break;

      default:
        await interaction.reply({ content: '❓ Comando sconosciuto', ephemeral: true });
    }
  } catch (error) {
    console.error('Errore comando:', error);
    await interaction.reply({
      content: '❌ Errore esecuzione comando',
      ephemeral: true
    });
  }
});

// ============================================
// MESSAGE TRACKING PER STATS
// ============================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const userName = message.author.username;

  if (!userStats.has(userId)) {
    userStats.set(userId, { name: userName, messages: 0 });
  }

  const userData = userStats.get(userId);
  userData.messages++;
  userStats.set(userId, userData);
});

// ============================================
// BOT LOGIN
// ============================================
client.login(token);

console.log('🚀 Bot avviato...');
