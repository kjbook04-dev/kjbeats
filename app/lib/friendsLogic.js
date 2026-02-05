export const normalizePair = (a, b) => {
  return a < b ? [a, b] : [b, a];
};

export const canSendMessage = ({ everAccepted, status, senderHiddenAt }) => {
  if (!everAccepted) return false;
  if (status === 'accepted') return true;
  return senderHiddenAt == null;
};

export const shouldShowThread = ({ friendshipStatus, hiddenAt, lastMessageAt, friendshipEstablished }) => {
  if (friendshipStatus === 'accepted' || friendshipEstablished) return true;
  if (hiddenAt == null) return true;
  if (lastMessageAt == null) return false;
  return lastMessageAt > hiddenAt;
};

export const filterMessagesAfterHidden = (messages, hiddenAt) => {
  if (hiddenAt == null) return messages;
  return messages.filter((m) => m.createdAt > hiddenAt);
};
