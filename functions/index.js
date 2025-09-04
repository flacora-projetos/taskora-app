const {onSchedule} = require('firebase-functions/v2/scheduler');
const {onRequest} = require('firebase-functions/v2/https');
const {onCall} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {getStorage} = require('firebase-admin/storage');
const {getAuth} = require('firebase-admin/auth');
const nodemailer = require('nodemailer');
const moment = require('moment');

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

// Configuração do email (você precisará configurar suas credenciais)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Configure no Firebase Functions
    pass: process.env.EMAIL_PASS, // Configure no Firebase Functions
  },
});

/**
 * ETAPA 2 - BACKUP AUTOMÁTICO DIÁRIO
 * Executa todo dia às 2h da manhã (horário de Brasília)
 */
exports.backupDiario = onSchedule({
  schedule: '0 2 * * *', // Todo dia às 2h
  timeZone: 'America/Sao_Paulo',
  region: 'southamerica-east1',
}, async (event) => {
  console.log('🔄 Iniciando backup automático diário...');

  try {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupData = {
      timestamp,
      collections: {},
    };

    // Coleções para backup
    const collections = ['tasks', 'clients', 'team', 'settings'];

    for (const collectionName of collections) {
      console.log(`📦 Fazendo backup da coleção: ${collectionName}`);
      const snapshot = await db.collection(collectionName).get();

      backupData.collections[collectionName] = [];
      snapshot.forEach((doc) => {
        backupData.collections[collectionName].push({
          id: doc.id,
          data: doc.data(),
        });
      });

      console.log(`✅ ${collectionName}: ${snapshot.size} documentos`);
    }

    // Salvar no Cloud Storage
    const fileName = `backups/taskora_backup_${timestamp}.json`;
    const file = storage.bucket().file(fileName);

    await file.save(JSON.stringify(backupData, null, 2), {
      metadata: {
        contentType: 'application/json',
      },
    });

    console.log(`💾 Backup salvo: ${fileName}`);

    // Enviar email de confirmação
    await enviarEmailBackup(timestamp, backupData);

    return {success: true, timestamp, fileName};
  } catch (error) {
    console.error('❌ Erro no backup automático:', error);
    await enviarEmailErro('Backup Automático', error.message);
    throw error;
  }
});


/**
 * ETAPA 2 - LEMBRETES AUTOMÁTICOS
 * Executa todo dia às 9h da manhã
 */
exports.lembretesAutomaticos = onSchedule({
  schedule: '0 9 * * *', // Todo dia às 9h
  timeZone: 'America/Sao_Paulo',
  region: 'southamerica-east1',
}, async (event) => {
  console.log('📧 Iniciando verificação de lembretes...');

  try {
    const hoje = moment();
    const em2Dias = moment().add(2, 'days');

    // Buscar tarefas que vencem em 2 dias
    const tarefasVencendo = await db.collection('tasks')
        .where('dueAt', '>=', hoje.startOf('day').toDate())
        .where('dueAt', '<=', em2Dias.endOf('day').toDate())
        .where('status', '!=', 'completed')
        .get();

    // Buscar tarefas atrasadas
    const tarefasAtrasadas = await db.collection('tasks')
        .where('dueAt', '<', hoje.startOf('day').toDate())
        .where('status', '!=', 'completed')
        .get();

    console.log(`📋 Tarefas vencendo: ${tarefasVencendo.size}`);
    console.log(`⚠️ Tarefas atrasadas: ${tarefasAtrasadas.size}`);

    // Processar lembretes
    const lembretes = [];

    tarefasVencendo.forEach((doc) => {
      const tarefa = doc.data();
      lembretes.push({
        tipo: 'vencendo',
        tarefa: tarefa,
        id: doc.id,
      });
    });

    tarefasAtrasadas.forEach((doc) => {
      const tarefa = doc.data();
      lembretes.push({
        tipo: 'atrasada',
        tarefa: tarefa,
        id: doc.id,
      });
    });

    // Enviar emails de lembrete
    if (lembretes.length > 0) {
      await enviarEmailLembretes(lembretes);
    }

    return {success: true, lembretes: lembretes.length};
  } catch (error) {
    console.error('❌ Erro nos lembretes automáticos:', error);
    await enviarEmailErro('Lembretes Automáticos', error.message);
    throw error;
  }
});

/**
 * FUNÇÃO AUXILIAR - Enviar email de confirmação de backup
 * @param {string} timestamp - Timestamp do backup
 * @param {Object} backupData - Dados do backup
 */
async function enviarEmailBackup(timestamp, backupData) {
  const totalDocs = Object.values(backupData.collections)
      .reduce((total, collection) => total + collection.length, 0);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // Configure o email do administrador
    subject: '✅ Taskora - Backup Realizado com Sucesso',
    html: `
      <h2>🎉 Backup Automático Concluído</h2>
      <p><strong>Data/Hora:</strong> ${moment(timestamp, 'YYYY-MM-DD_HH-mm-ss').format('DD/MM/YYYY às HH:mm')}</p>
      <p><strong>Total de documentos:</strong> ${totalDocs}</p>
      
      <h3>📊 Detalhes por Coleção:</h3>
      <ul>
        ${Object.entries(backupData.collections)
      .map(([name, docs]) => `<li><strong>${name}:</strong> ${docs.length} documentos</li>`)
      .join('')}
      </ul>

      <p>✅ Todos os dados foram salvos com segurança no Cloud Storage.</p>
      <p><em>Este é um email automático do sistema Taskora.</em></p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log('📧 Email de confirmação de backup enviado');
}

/**
 * FUNÇÃO AUXILIAR - Enviar email de lembretes
 * @param {Array} lembretes - Lista de lembretes
 */
async function enviarEmailLembretes(lembretes) {
  const tarefasVencendo = lembretes.filter((l) => l.tipo === 'vencendo');
  const tarefasAtrasadas = lembretes.filter((l) => l.tipo === 'atrasada');

  let htmlContent = '<h2>📋 Lembretes de Tarefas - Taskora</h2>';

  if (tarefasVencendo.length > 0) {
    htmlContent += `
      <h3>⏰ Tarefas Vencendo em 2 Dias (${tarefasVencendo.length}):</h3>
      <ul>
        ${tarefasVencendo.map((item) => `
          <li>
            <strong>${item.tarefa.title}</strong><br>
            Cliente: ${item.tarefa.clientName || 'N/A'}<br>
            Vencimento: ${moment(item.tarefa.dueAt.toDate()).format('DD/MM/YYYY')}<br>
            Responsável: ${item.tarefa.assigneeName || 'N/A'}
          </li>
        `).join('')}
      </ul>
    `;
  }

  if (tarefasAtrasadas.length > 0) {
    htmlContent += `
      <h3>🚨 Tarefas Atrasadas (${tarefasAtrasadas.length}):</h3>
      <ul>
        ${tarefasAtrasadas.map((item) => `
          <li>
            <strong>${item.tarefa.title}</strong><br>
            Cliente: ${item.tarefa.clientName || 'N/A'}<br>
            Vencimento: ${moment(item.tarefa.dueAt.toDate()).format('DD/MM/YYYY')}<br>
            Responsável: ${item.tarefa.assigneeName || 'N/A'}<br>
            <span style="color: red;">Atrasada há ${
  moment().diff(moment(item.tarefa.dueAt.toDate()), 'days')
} dias</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  htmlContent += '<p><em>Este é um email automático do sistema Taskora.</em></p>';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `📋 Taskora - Lembretes de Tarefas (${lembretes.length} itens)`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log('📧 Email de lembretes enviado');
}

/**
 * FUNÇÃO AUXILIAR - Enviar email de erro
 * @param {string} funcao - Nome da função que gerou o erro
 * @param {string} erro - Mensagem de erro
 */
async function enviarEmailErro(funcao, erro) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `🚨 Taskora - Erro em ${funcao}`,
    html: `
      <h2>🚨 Erro no Sistema Taskora</h2>
      <p><strong>Função:</strong> ${funcao}</p>
      <p><strong>Data/Hora:</strong> ${moment().format('DD/MM/YYYY às HH:mm')}</p>
      <p><strong>Erro:</strong></p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${erro}</pre>
      <p><em>Verifique os logs do Firebase Functions para mais detalhes.</em></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email de erro enviado');
  } catch (emailError) {
    console.error('❌ Erro ao enviar email de erro:', emailError);
  }
}

/**
 * FUNÇÃO DE TESTE - Para testar as automações manualmente
 */
exports.testarAutomacoes = onRequest({region: 'southamerica-east1'}, async (req, res) => {
  try {
    console.log('🧪 Testando automações...');

    // Testar backup
    const backupResult = await exports.backupDiario.run();

    // Testar lembretes
    const lembretesResult = await exports.lembretesAutomaticos.run();

    res.json({
      success: true,
      backup: backupResult,
      lembretes: lembretesResult,
      timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * FUNÇÃO DE STATUS - Para verificar se as automações estão funcionando
 */
exports.statusAutomacoes = onRequest({region: 'southamerica-east1'}, async (req, res) => {
  try {
    // Verificar último backup
    const backupFiles = await storage.bucket().getFiles({
      prefix: 'backups/',
      maxResults: 5,
    });

    const ultimoBackup = backupFiles[0] && backupFiles[0].length > 0 ?
      backupFiles[0][0].name : 'Nenhum backup encontrado';

    // Contar tarefas pendentes
    const tarefasPendentes = await db.collection('tasks')
        .where('status', '!=', 'completed')
        .get();

    res.json({
      success: true,
      status: {
        ultimoBackup,
        tarefasPendentes: tarefasPendentes.size,
        timestamp: moment().format('DD/MM/YYYY HH:mm:ss'),
        versao: '1.0.0 - Etapa 2',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * AUTENTICAÇÃO - CUSTOM CLAIMS
 * Funções para gerenciar custom claims e organizações
 */

/**
 * Função executada automaticamente quando um usuário é criado
 * Define custom claims padrão (orgId: 'dacora')
 * IMPORTANTE: Esta função só funciona com Google Cloud Identity Platform (GCIP)
 * DESABILITADA: Não disponível em projetos Firebase normais
 */
/*
exports.setUserClaimsOnCreate = beforeUserCreated({
  region: 'southamerica-east1',
}, async (event) => {
  const user = event.data;

  console.log(`🔐 Definindo custom claims para novo usuário: ${user.uid}`);

  try {
    // Por padrão, todos os usuários pertencem à organização "dacora"
    const customClaims = {
      orgId: 'dacora',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    await auth.setCustomUserClaims(user.uid, customClaims);

    // Criar documento do usuário no Firestore
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário'),
      orgId: 'dacora',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
    });

    console.log(`✅ Custom claims definidos para usuário ${user.uid}:`, customClaims);
  } catch (error) {
    console.error('❌ Erro ao definir custom claims:', error);
    throw error;
  }
});
*/

/**
 * Função para atualizar custom claims manualmente
 * Apenas admins podem executar esta função
 */
exports.updateUserClaims = onCall({
  region: 'southamerica-east1',
}, async (request) => {
  // Verificar se o usuário está autenticado
  if (!request.auth) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se é admin
  const isAdmin = request.auth.token.role === 'admin';
  if (!isAdmin) {
    throw new Error('Apenas admins podem atualizar claims');
  }

  const {uid, orgId, role} = request.data;

  if (!uid) {
    throw new Error('UID do usuário é obrigatório');
  }

  console.log(`🔐 Admin ${request.auth.uid} atualizando claims para usuário: ${uid}`);

  try {
    const customClaims = {
      orgId: orgId || 'dacora',
      role: role || 'user',
      updatedAt: new Date().toISOString(),
      updatedBy: request.auth.uid,
    };

    await auth.setCustomUserClaims(uid, customClaims);

    // Atualizar documento do usuário no Firestore
    await db.collection('users').doc(uid).update({
      orgId: customClaims.orgId,
      role: customClaims.role,
      updatedAt: new Date(),
      updatedBy: request.auth.uid,
    });

    console.log(`✅ Claims atualizados para usuário ${uid}:`, customClaims);

    return {
      success: true,
      claims: customClaims,
      message: 'Custom claims atualizados com sucesso',
    };
  } catch (error) {
    console.error('❌ Erro ao atualizar custom claims:', error);
    throw new Error(`Erro interno: ${error.message}`);
  }
});

/**
 * Função para obter informações de um usuário (apenas admins)
 */
exports.getUserInfo = onCall({
  region: 'southamerica-east1',
}, async (request) => {
  // Verificar se o usuário está autenticado
  if (!request.auth) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se é admin ou está consultando próprio perfil
  const {uid} = request.data;
  const isAdmin = request.auth.token.role === 'admin';
  const isOwnProfile = request.auth.uid === uid;

  if (!isAdmin && !isOwnProfile) {
    throw new Error('Sem permissão para acessar informações deste usuário');
  }

  try {
    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();

    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        customClaims: userRecord.customClaims || {},
        firestoreData: userDoc.exists ? userDoc.data() : null,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao obter informações do usuário:', error);
    throw new Error(`Erro interno: ${error.message}`);
  }
});

/**
 * Função para listar usuários da organização (apenas admins)
 */
exports.listOrgUsers = onCall({
  region: 'southamerica-east1',
}, async (request) => {
  // Verificar se o usuário está autenticado
  if (!request.auth) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se é admin
  const isAdmin = request.auth.token.role === 'admin';
  if (!isAdmin) {
    throw new Error('Apenas admins podem listar usuários');
  }

  const orgId = request.auth.token.orgId;

  try {
    // Buscar usuários da organização no Firestore
    const usersSnapshot = await db.collection('users')
        .where('orgId', '==', orgId)
        .orderBy('createdAt', 'desc')
        .get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        lastSignInTime: userData.lastSignInTime,
      });
    });

    return {
      success: true,
      users,
      total: users.length,
      orgId,
    };
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    throw new Error(`Erro interno: ${error.message}`);
  }
});
