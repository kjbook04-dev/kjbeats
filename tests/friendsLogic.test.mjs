import test from 'node:test';
import assert from 'node:assert/strict';
import { canSendMessage, filterMessagesAfterHidden, normalizePair, shouldShowThread } from '../app/lib/friendsLogic.js';

test('normalizePair orders ids', () => {
  assert.deepEqual(normalizePair('b', 'a'), ['a', 'b']);
});

test('cannot message before ever accepted', () => {
  assert.equal(canSendMessage({ everAccepted: false, status: 'pending', senderHiddenAt: null }), false);
});

test('can message after acceptance even if removed with no hiddenAt', () => {
  assert.equal(canSendMessage({ everAccepted: true, status: 'removed', senderHiddenAt: null }), true);
});

test('cannot message if removed and sender hid conversation', () => {
  assert.equal(canSendMessage({ everAccepted: true, status: 'removed', senderHiddenAt: Date.now() }), false);
});

test('thread visibility respects hiddenAt', () => {
  assert.equal(shouldShowThread({ friendshipStatus: 'removed', hiddenAt: 10, lastMessageAt: 5 }), false);
  assert.equal(shouldShowThread({ friendshipStatus: 'removed', hiddenAt: 10, lastMessageAt: 15 }), true);
});

test('history filters after hiddenAt', () => {
  const messages = [
    { createdAt: 1, text: 'a' },
    { createdAt: 5, text: 'b' },
    { createdAt: 10, text: 'c' },
  ];
  assert.deepEqual(filterMessagesAfterHidden(messages, 5).map((m) => m.text), ['c']);
});
