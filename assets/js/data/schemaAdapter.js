// Adapta modelo interno -> Firestore
export function toLegacy(task) {
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) =>
    typeof d === "string"
      ? d
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    client: task.client || "all",
    owner: task.owner || "all",
    description: task.description?.trim() || "",
    status: ["iniciada", "em progresso", "concluída", "não realizada"].includes(
      task.status
    )
      ? task.status
      : "não realizada",
    hours: task.hours || 0,
    date: task.date ? toISO(new Date(task.date)) : toISO(new Date()),
    dueDate: task.dueDate ? toISO(new Date(task.dueDate)) : toISO(new Date()),
    endDate: task.endDate ? toISO(new Date(task.endDate)) : undefined,
    recurrence: task.recurrence || { type: "none" },
    recurrenceType: task.recurrenceType || "none",
  };
}
