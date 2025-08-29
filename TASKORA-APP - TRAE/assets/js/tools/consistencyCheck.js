// Checagem mínima de consistência
export function consistencyCheck(task) {
  if (!task.description || task.description.length < 2) {
    throw new Error("Descrição inválida");
  }
  if (!["iniciada","em progresso","concluída","não realizada"].includes(task.status)) {
    throw new Error("Status inválido");
  }
  if (!task.date) throw new Error("Data obrigatória");
  if (!task.dueDate) throw new Error("Data de vencimento obrigatória");
  return true;
}
