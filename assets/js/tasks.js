// tasks.js — módulo da aba Tasks com CRUD completo
// Refatorado para usar repositórios centralizados

// Importações necessárias
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import { db } from './config/firebase-production.js';
// Importar funções centralizadas dos repositórios
import { deleteTask, createTask, updateTask } from './data/tasksRepo.js';

console.log("[Tasks] módulo carregado com repositórios centralizados.");

// Função para deletar tarefa - usando repositório centralizado
async function handleDelete(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }

    try {
        await deleteTask(taskId);
        showNotification('Tarefa excluída com sucesso!', 'success');
        loadTasks(); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        showNotification('Erro ao excluir tarefa', 'error');
    }
}
