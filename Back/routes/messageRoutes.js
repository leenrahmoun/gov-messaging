const express = require('express');

const router = express.Router();
const messageController = require('../controllers/messageController');
const {
  authenticateToken,
  authorizeRole
} = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', messageController.getMessages);
router.get('/:id', messageController.getMessageById);
router.post(
  '/',
  authorizeRole(['admin', 'manager', 'employee']),
  messageController.createMessage
);
router.put(
  '/:id',
  authorizeRole(['admin', 'manager', 'employee']),
  messageController.updateMessage
);
router.post(
  '/:id/submit',
  authorizeRole(['admin', 'manager', 'employee']),
  messageController.submitMessage
);
router.post(
  '/:id/approve',
  authorizeRole(['admin', 'manager']),
  messageController.approveMessage
);
router.post(
  '/:id/reject',
  authorizeRole(['admin', 'manager']),
  messageController.rejectMessage
);
router.post(
  '/:id/send',
  authorizeRole(['admin', 'manager', 'employee']),
  messageController.sendMessage
);
router.post(
  '/:id/receive',
  authorizeRole(['admin', 'manager']),
  messageController.receiveMessage
);
router.delete(
  '/:id',
  authorizeRole(['admin', 'manager', 'employee']),
  messageController.deleteMessage
);

module.exports = router;
