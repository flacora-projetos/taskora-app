# Firestore Security Rules — Modo público com validação de shape

> Ambiente sem login. Leitura pública e escrita **restrita por shape**.

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
    function isString(v) { return v is string; }
function isNumber(v) { return v is number; }
function isTimestamp(v) { return v is timestamp; }
function hasOnly(map data, list allowed) {
  return data.keys().hasOnly(allowed);
}

function isValidRecurrence(r) {
  return r is map
    && hasOnly(r, ['type','days','recurrenceType','recurrenceUntil'])
    && (!('type' in r) || isString(r.type))
    && (!('days' in r) || r.days is list)
    && (!('recurrenceType' in r) || isString(r.recurrenceType))
    && (!('recurrenceUntil' in r) || isString(r.recurrenceUntil));
}

function isValidTask(data) {
  return hasOnly(data, [
    'client','createdAt','date','description','dueDate',
    'hours','owner','recurrence','status'
  ])
  && (!('client' in data) || isString(data.client))
  && (!('createdAt' in data) || isTimestamp(data.createdAt))
  && (!('date' in data) || isString(data.date))
  && (!('description' in data) || isString(data.description))
  && (!('dueDate' in data) || isString(data.dueDate))
  && (!('hours' in data) || isNumber(data.hours))
  && (!('owner' in data) || isString(data.owner))
  && (!('recurrence' in data) || isValidRecurrence(data.recurrence))
  && (!('status' in data) || isString(data.status));
}

match /tasks/{docId} {
  allow read: if true;
  allow create, update: if isValidTask(request.resource.data);
  allow delete: if true; // opcional: pode restringir.
}

> Ajuste conforme necessidade. Publique estas regras no console antes do corte para produção.
