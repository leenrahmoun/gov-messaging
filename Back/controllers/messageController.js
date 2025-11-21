const db = require('../db');

const MESSAGE_STATUSES = {
  DRAFT: 'draft',
  PENDING_MANAGER: 'pending_manager_approval',
  PENDING_ADMIN: 'pending_admin_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RETURNED_FOR_REVISION: 'returned_for_revision',
  SENT: 'sent',
  RECEIVED: 'received'
};

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

const LEGACY_EMPLOYEE_ROLE = 'user';
const RECIPIENT_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered'
};

const generateMessageNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `MSG-${timestamp}-${random}`;
};

const isAdmin = (user) => user.role === ROLES.ADMIN;
const isManager = (user) => user.role === ROLES.MANAGER;
const isEmployee = (user) =>
  user.role === ROLES.EMPLOYEE || user.role === LEGACY_EMPLOYEE_ROLE;

const withTransaction = async (handler) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const logAudit = async (executor, {
  userId,
  actionType,
  entityId,
  description,
  metadata = null
}) => {
  const payload = metadata ? JSON.stringify(metadata) : null;
  await executor.query(
    `INSERT INTO audit_logs (user_id, action, action_type, entity_type, entity_id, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId || null,
      actionType,
      actionType,
      'message',
      entityId || null,
      description || null,
      payload
    ]
  );
};

const mapMessageRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    sender_department_name: row.sender_department_name || null,
    receiver_department_name: row.receiver_department_name || null
  };
};

const getMessageRecord = async (executor, id) => {
  const result = await executor.query(
    `SELECT
       m.*,
       sender.full_name AS sender_name,
       sender.role AS sender_role,
       sender.department_id AS sender_department_id,
       sd.name AS sender_department_name,
       rd.name AS receiver_department_name,
       approver.full_name AS approver_name
     FROM messages m
     JOIN users sender ON sender.id = m.sender_id
     LEFT JOIN users approver ON approver.id = m.approved_by
     LEFT JOIN departments sd ON sd.id = m.sender_department_id
     LEFT JOIN departments rd ON rd.id = m.receiver_department_id
     WHERE m.id = $1`,
    [id]
  );
  return mapMessageRow(result.rows[0]);
};

const appendDetailsToMessage = async (executor, messageId) => {
  const [recipientsResult, attachmentsResult, approvalsResult] = await Promise.all([
    executor.query(
      `SELECT r.*, u.full_name AS recipient_user_name, u.email AS recipient_user_email
       FROM recipients r
       LEFT JOIN users u ON r.recipient_id = u.id
       WHERE r.message_id = $1`,
      [messageId]
    ),
    executor.query(
      `SELECT a.*, u.full_name AS uploaded_by_name
       FROM attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.message_id = $1`,
      [messageId]
    ),
    executor.query(
      `SELECT ap.*, u.full_name AS approver_name
       FROM approvals ap
       LEFT JOIN users u ON ap.approver_id = u.id
       WHERE ap.message_id = $1
       ORDER BY ap.created_at DESC`,
      [messageId]
    )
  ]);

  return {
    recipients: recipientsResult.rows,
    attachments: attachmentsResult.rows,
    approvals: approvalsResult.rows.map((approval) => ({
      ...approval,
      decision: approval.decision || approval.status || 'pending'
    }))
  };
};

const ensureCanViewMessage = (user, message, recipients) => {
  if (isAdmin(user)) {
    return true;
  }

  if (isManager(user)) {
    if (!user.department_id) return false;
    return (
      message.sender_department_id === user.department_id ||
      message.receiver_department_id === user.department_id
    );
  }

  const ownsMessage = message.sender_id === user.id;
  if (ownsMessage) return true;

  const isRecipient = recipients.some(
    (recipient) => recipient.recipient_id === user.id
  );

  const sameDepartment =
    user.department_id &&
    (message.sender_department_id === user.department_id ||
      message.receiver_department_id === user.department_id);

  return isRecipient || sameDepartment;
};

const getDepartmentManager = async (executor, departmentId) => {
  if (!departmentId) {
    return null;
  }

  const result = await executor.query(
    `SELECT manager_id FROM departments WHERE id = $1`,
    [departmentId]
  );

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0].manager_id || null;
};

const ensureDepartmentExists = async (executor, departmentId) => {
  if (!departmentId) {
    throw new Error('RECEIVER_DEPARTMENT_REQUIRED');
  }

  const result = await executor.query(
    `SELECT id, name FROM departments WHERE id = $1`,
    [departmentId]
  );

  if (!result.rows.length) {
    const error = new Error('DEPARTMENT_NOT_FOUND');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const pickArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const buildVisibilityFilter = (user, params) => {
  const conditions = [];
  let paramIndex = 1;
  const values = [];

  if (isAdmin(user)) {
    return { conditions, values, paramIndex };
  }

  const orConditions = [];
  orConditions.push(`m.sender_id = $${paramIndex++}`);
  values.push(user.id);

  orConditions.push(
    `EXISTS (
      SELECT 1 FROM recipients r
      WHERE r.message_id = m.id
        AND r.recipient_id = $${paramIndex++}
    )`
  );
  values.push(user.id);

  if (user.department_id) {
    orConditions.push(`m.sender_department_id = $${paramIndex++}`);
    values.push(user.department_id);
    orConditions.push(`m.receiver_department_id = $${paramIndex++}`);
    values.push(user.department_id);
  }

  conditions.push(`(${orConditions.join(' OR ')})`);
  return { conditions, values, paramIndex };
};

const buildManagerFilter = (user, params) => {
  const { paramIndex: startIndex } = params;
  const conditions = [];
  const values = [];
  let paramIndex = startIndex;

  if (!user.department_id) {
    conditions.push('FALSE');
    return { conditions, values, paramIndex };
  }

  conditions.push(
    `(m.sender_department_id = $${paramIndex} OR m.receiver_department_id = $${paramIndex + 1})`
  );
  values.push(user.department_id, user.department_id);
  paramIndex += 2;

  return { conditions, values, paramIndex };
};

const appendFilters = (base, additional) => {
  const conditions = [...base.conditions, ...additional.conditions];
  const values = [...base.values, ...additional.values];
  return { conditions, values, paramIndex: additional.paramIndex };
};

const getMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      message_type,
      priority,
      sender_id,
      receiver_department_id
    } = req.query;

    const user = req.user;
    const safeLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    let filters = { conditions: [], values: [], paramIndex: 1 };

    if (isAdmin(user)) {
      // no RBAC filter
    } else if (isManager(user)) {
      const managerFilters = buildManagerFilter(user, filters);
      filters = appendFilters(filters, managerFilters);
    } else {
      const employeeFilters = buildVisibilityFilter(user, filters);
      filters = appendFilters(filters, employeeFilters);
    }

    if (status) {
      filters.conditions.push(`m.status = $${filters.paramIndex++}`);
      filters.values.push(status);
    }

    if (message_type) {
      filters.conditions.push(`m.message_type = $${filters.paramIndex++}`);
      filters.values.push(message_type);
    }

    if (priority) {
      filters.conditions.push(`m.priority = $${filters.paramIndex++}`);
      filters.values.push(priority);
    }

    if (sender_id) {
      filters.conditions.push(`m.sender_id = $${filters.paramIndex++}`);
      filters.values.push(parseInt(sender_id, 10));
    }

    if (receiver_department_id) {
      filters.conditions.push(
        `m.receiver_department_id = $${filters.paramIndex++}`
      );
      filters.values.push(parseInt(receiver_department_id, 10));
    }

    const whereClause = filters.conditions.length
      ? `WHERE ${filters.conditions.join(' AND ')}`
      : '';

    const dataValues = [...filters.values, safeLimit, offset];
    const messagesQuery = `
      SELECT
        m.*,
        sender.full_name AS sender_name,
        sd.name AS sender_department_name,
        rd.name AS receiver_department_name
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN departments sd ON sd.id = m.sender_department_id
      LEFT JOIN departments rd ON rd.id = m.receiver_department_id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT $${filters.paramIndex++}
      OFFSET $${filters.paramIndex++}
    `;

    const countQuery = `
      SELECT COUNT(*)::INTEGER AS total
      FROM messages m
      ${whereClause}
    `;

    const [messagesResult, countResult] = await Promise.all([
      db.query(messagesQuery, dataValues),
      db.query(countQuery, filters.values)
    ]);

    res.json({
      success: true,
      data: {
        messages: messagesResult.rows.map(mapMessageRow),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: countResult.rows[0]?.total || 0,
          pages: Math.ceil((countResult.rows[0]?.total || 0) / safeLimit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const details = await appendDetailsToMessage(db, id);

    if (!ensureCanViewMessage(user, message, details.recipients)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    res.json({
      success: true,
      data: {
        message: {
          ...message,
          ...details
        }
      }
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message',
      error: error.message
    });
  }
};

const createMessage = async (req, res) => {
  try {
    const user = req.user;
    const {
      subject,
      content,
      message_type = 'internal',
      priority = 'normal',
      requiresApproval,
      recipient_ids,
      recipientIds,
      recipient_emails,
      recipientEmails,
      receiver_department_id,
      receiverDepartmentId
    } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    const recipientIdList = pickArray(recipientIds || recipient_ids).map((id) =>
      parseInt(id, 10)
    );
    const externalRecipientList = pickArray(
      recipientEmails || recipient_emails
    ).filter(Boolean);

    if (!recipientIdList.length && !externalRecipientList.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required'
      });
    }

    const needsApproval = isEmployee(user)
      ? true
      : requiresApproval === true ||
        requiresApproval === 'true' ||
        message_type === 'official';

    const messageNumber = generateMessageNumber();
    const senderDepartmentId = user.department_id || null;

    const result = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `INSERT INTO messages (
          message_number,
          subject,
          content,
          sender_id,
          sender_department_id,
          message_type,
          priority,
          status,
          requires_approval
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          messageNumber,
          subject,
          content,
          user.id,
          senderDepartmentId,
          message_type,
          priority,
          MESSAGE_STATUSES.DRAFT,
          needsApproval
        ]
      );

      const message = insertResult.rows[0];

      for (const recipientId of recipientIdList) {
        const userResult = await client.query(
          `SELECT id, email, full_name FROM users WHERE id = $1`,
          [recipientId]
        );
        if (!userResult.rows.length) {
          continue;
        }
        const recipient = userResult.rows[0];
        await client.query(
          `INSERT INTO recipients (
             message_id,
             recipient_id,
             recipient_email,
             recipient_name,
             recipient_type,
             status
           )
           VALUES ($1, $2, $3, $4, 'user', $5)`,
          [
            message.id,
            recipient.id,
            recipient.email,
            recipient.full_name,
            RECIPIENT_STATUSES.PENDING
          ]
        );
      }

      for (const email of externalRecipientList) {
        await client.query(
          `INSERT INTO recipients (
             message_id,
             recipient_email,
             recipient_name,
             recipient_type,
             status
           ) VALUES ($1, $2, $3, 'external', $4)`,
          [message.id, email, email, RECIPIENT_STATUSES.PENDING]
        );
      }

      if (!needsApproval && (receiverDepartmentId || receiver_department_id)) {
        await client.query(
          `UPDATE messages SET receiver_department_id = $1 WHERE id = $2`,
          [
            parseInt(receiverDepartmentId || receiver_department_id, 10),
            message.id
          ]
        );
      }

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:create',
        entityId: message.id,
        description: `Message ${message.message_number} created`,
        metadata: {
          subject,
          priority,
          message_type,
          requires_approval: needsApproval
        }
      });

      return message;
    });

    res.status(201).json({
      success: true,
      message: 'Message created',
      data: { message: result }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message:
        error.message === 'DEPARTMENT_NOT_FOUND'
          ? 'Receiver department not found'
          : error.message || 'Failed to create message',
      error: error.message
    });
  }
};

const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const {
      subject,
      content,
      message_type,
      priority,
      recipient_ids,
      recipientIds,
      recipient_emails,
      recipientEmails,
      requiresApproval,
      receiver_department_id,
      receiverDepartmentId
    } = req.body;

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!isAdmin(user)) {
      const ownsMessage = message.sender_id === user.id;
      const managerCanEdit =
        isManager(user) &&
        user.department_id &&
        message.sender_department_id === user.department_id &&
        message.status === MESSAGE_STATUSES.DRAFT;

      if (!ownsMessage && !managerCanEdit) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      if (
        ![MESSAGE_STATUSES.DRAFT, MESSAGE_STATUSES.REJECTED].includes(
          message.status
        )
      ) {
        return res.status(409).json({
          success: false,
          message: 'Only draft or rejected messages can be edited'
        });
      }
    }

    const recipientIdList = pickArray(recipientIds || recipient_ids).map((id) =>
      parseInt(id, 10)
    );
    const externalRecipientList = pickArray(
      recipientEmails || recipient_emails
    ).filter(Boolean);

    const needsApproval =
      requiresApproval === undefined
        ? message.requires_approval
        : Boolean(requiresApproval);

    const updatedMessage = await withTransaction(async (client) => {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (subject) {
        updates.push(`subject = $${paramIndex++}`);
        values.push(subject);
      }
      if (content) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (message_type) {
        updates.push(`message_type = $${paramIndex++}`);
        values.push(message_type);
      }
      if (priority) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }
      if (requiresApproval !== undefined) {
        updates.push(`requires_approval = $${paramIndex++}`);
        values.push(needsApproval);
      }
      if (receiverDepartmentId || receiver_department_id) {
        const departmentId = parseInt(
          receiverDepartmentId || receiver_department_id,
          10
        );
        await ensureDepartmentExists(client, departmentId);
        updates.push(`receiver_department_id = $${paramIndex++}`);
        values.push(departmentId);
      }

      if (updates.length) {
        values.push(id);
        await client.query(
          `UPDATE messages
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramIndex}`,
          values
        );
      }

      if (recipientIdList.length || externalRecipientList.length) {
        await client.query(`DELETE FROM recipients WHERE message_id = $1`, [
          id
        ]);

        for (const recipientId of recipientIdList) {
          const userResult = await client.query(
            `SELECT id, email, full_name FROM users WHERE id = $1`,
            [recipientId]
          );
          if (!userResult.rows.length) continue;

          const recipient = userResult.rows[0];
          await client.query(
            `INSERT INTO recipients (
               message_id,
               recipient_id,
               recipient_email,
               recipient_name,
               recipient_type,
               status
             ) VALUES ($1, $2, $3, $4, 'user', $5)`,
            [
              id,
              recipient.id,
              recipient.email,
              recipient.full_name,
              RECIPIENT_STATUSES.PENDING
            ]
          );
        }

        for (const email of externalRecipientList) {
          await client.query(
            `INSERT INTO recipients (
               message_id,
               recipient_email,
               recipient_name,
               recipient_type,
               status
             ) VALUES ($1, $2, $3, 'external', $4)`,
            [id, email, email, RECIPIENT_STATUSES.PENDING]
          );
        }
      }

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:update',
        entityId: id,
        description: 'Message updated',
        metadata: {
          subject,
          priority,
          message_type,
          requiresApproval: needsApproval
        }
      });

      return getMessageRecord(client, id);
    });

    res.json({
      success: true,
      message: 'Message updated',
      data: { message: updatedMessage }
    });
  } catch (error) {
    console.error('Error updating message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update message',
      error: error.message
    });
  }
};

const submitMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const ownsMessage = message.sender_id === user.id;
    if (!ownsMessage && !isAdmin(user) && !isManager(user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (
      ![
        MESSAGE_STATUSES.DRAFT,
        MESSAGE_STATUSES.REJECTED,
        MESSAGE_STATUSES.RETURNED_FOR_REVISION
      ].includes(message.status)
    ) {
      return res.status(409).json({
        success: false,
        message: 'Message already submitted'
      });
    }

    const submittedMessage = await withTransaction(async (client) => {
      const senderDepartmentId =
        message.sender_department_id || user.department_id || null;

      // Employees require a department
      if (isEmployee(user) && !senderDepartmentId) {
        const error = new Error(
          'Sender department is required before submitting'
        );
        error.statusCode = 400;
        throw error;
      }

      let approverId = null;
      let approverRole = null;

      // Determine the approver based on sender role
      if (isEmployee(user)) {
        // Employees: message goes to their manager
        if (senderDepartmentId) {
          const deptResult = await client.query(
            `SELECT id FROM users WHERE role = $1 AND department_id = $2 AND is_active = TRUE LIMIT 1`,
            [ROLES.MANAGER, senderDepartmentId]
          );

          if (deptResult.rows.length > 0) {
            approverId = deptResult.rows[0].id;
            approverRole = ROLES.MANAGER;
          } else {
            // No manager in department, escalate to admin
            const adminResult = await client.query(
              `SELECT id FROM users WHERE role = $1 AND is_active = TRUE LIMIT 1`,
              [ROLES.ADMIN]
            );

            if (adminResult.rows.length > 0) {
              approverId = adminResult.rows[0].id;
              approverRole = ROLES.ADMIN;
            }
          }
        }
      } else if (isManager(user)) {
        // Managers: may require admin approval depending on system setting
        const ADMIN_APPROVAL_REQUIRED = (process.env.ADMIN_APPROVAL_REQUIRED === 'true');
        if (ADMIN_APPROVAL_REQUIRED) {
          const adminResult = await client.query(
            `SELECT id FROM users WHERE role = $1 AND is_active = TRUE LIMIT 1`,
            [ROLES.ADMIN]
          );
          if (adminResult.rows.length > 0) {
            approverId = adminResult.rows[0].id;
            approverRole = ROLES.ADMIN;
          }
        } else {
          // No approver needed for manager
          approverId = null;
        }
      } else if (isAdmin(user)) {
        // Admins don't need approval
        approverId = null;
      }

      if (!approverId && !isAdmin(user) && !(isManager(user) && !approverId)) {
        const error = new Error('No approver configured for department');
        error.statusCode = 409;
        throw error;
      }

      // Determine target status
      let targetStatus = MESSAGE_STATUSES.DRAFT;
      if (isEmployee(user)) {
        if (approverRole === ROLES.MANAGER) targetStatus = MESSAGE_STATUSES.PENDING_MANAGER;
        else if (approverRole === ROLES.ADMIN) targetStatus = MESSAGE_STATUSES.PENDING_ADMIN;
      } else if (isManager(user)) {
        if (approverRole === ROLES.ADMIN) targetStatus = MESSAGE_STATUSES.PENDING_ADMIN;
        else targetStatus = MESSAGE_STATUSES.APPROVED;
      } else if (isAdmin(user)) {
        targetStatus = MESSAGE_STATUSES.APPROVED;
      }

      await client.query(
        `UPDATE messages
         SET status = $1,
             sender_department_id = $2,
             updated_at = NOW(),
             requires_approval = TRUE
         WHERE id = $3`,
        [targetStatus, senderDepartmentId, id]
      );

      await client.query(`DELETE FROM approvals WHERE message_id = $1`, [id]);

      if (approverId) {
        await client.query(
          `INSERT INTO approvals (message_id, approver_id, status, comments)
           VALUES ($1, $2, 'pending', NULL)`,
          [id, approverId]
        );
      }

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:submit',
        entityId: id,
        description: 'Message submitted for approval',
        metadata: { approverId, approverRole }
      });

      return getMessageRecord(client, id);
    });

    res.json({
      success: true,
      message: 'Message submitted for approval',
      data: { message: submittedMessage }
    });
  } catch (error) {
    console.error('Error submitting message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to submit message',
      error: error.message
    });
  }
};

const approveMessage = async (req, res) => {
  try {
    const { id } = req.params; // message id
    const { notes } = req.body;
    const user = req.user;

    if (!isAdmin(user) && !isManager(user)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const message = await getMessageRecord(db, id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const ADMIN_APPROVAL_REQUIRED = (process.env.ADMIN_APPROVAL_REQUIRED === 'true');

    // Manager can only approve manager-pending messages from their department
    if (isManager(user)) {
      if (message.status !== MESSAGE_STATUSES.PENDING_MANAGER) {
        return res.status(409).json({ success: false, message: 'Message is not pending manager approval' });
      }
      if (!user.department_id || user.department_id !== message.sender_department_id) {
        return res.status(403).json({ success: false, message: 'Managers can approve only messages from their department' });
      }
    }

    // Admin can only approve admin-pending messages (or manager-pending if no manager existed)
    if (isAdmin(user)) {
      if (![MESSAGE_STATUSES.PENDING_ADMIN, MESSAGE_STATUSES.PENDING_MANAGER].includes(message.status)) {
        return res.status(409).json({ success: false, message: 'Message is not pending admin approval' });
      }
    }

    const result = await withTransaction(async (client) => {
      // mark related approvals for this message assigned to this user as approved
      await client.query(
        `UPDATE approvals SET status = 'approved', comments = $1, approved_at = NOW(), updated_at = NOW() WHERE message_id = $2 AND approver_id = $3 AND status = 'pending'`,
        [notes || null, id, user.id]
      );

      if (isManager(user)) {
        if (ADMIN_APPROVAL_REQUIRED) {
          // move to admin pending and create admin approval
          await client.query(
            `UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2`,
            [MESSAGE_STATUSES.PENDING_ADMIN, id]
          );

          // ensure admin approval exists
          const adminCheck = await client.query(
            `SELECT id FROM approvals WHERE message_id = $1 AND status = 'pending' AND approver_id IN (SELECT id FROM users WHERE role = 'admin') LIMIT 1`,
            [id]
          );
          if (adminCheck.rows.length === 0) {
            const adminRes = await client.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE LIMIT 1`);
            if (adminRes.rows.length > 0) {
              await client.query(`INSERT INTO approvals (message_id, approver_id, status, comments, created_at) VALUES ($1, $2, 'pending', NULL, NOW())`, [id, adminRes.rows[0].id]);
            }
          }
        } else {
          // Final approval
          await client.query(
            `UPDATE messages SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3`,
            [MESSAGE_STATUSES.APPROVED, user.id, id]
          );
        }
      } else if (isAdmin(user)) {
        // Admin final approval
        await client.query(
          `UPDATE messages SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3`,
          [MESSAGE_STATUSES.APPROVED, user.id, id]
        );
      }

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:approve',
        entityId: id,
        description: 'Message approved',
        metadata: { notes }
      });

      return getMessageRecord(client, id);
    });

    res.json({ success: true, message: 'Message approved', data: { message: result } });
  } catch (error) {
    console.error('Error approving message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Failed to approve message', error: error.message });
  }
};

const rejectMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    if (!isAdmin(user) && !isManager(user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Rejection notes are required'
      });
    }

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (![MESSAGE_STATUSES.PENDING_MANAGER, MESSAGE_STATUSES.PENDING_ADMIN].includes(message.status)) {
      return res.status(409).json({
        success: false,
        message: 'Message is not pending approval'
      });
    }

    // Check authorization based on role and department
    if (isManager(user)) {
      // Managers can only reject messages from their own department
      if (message.status !== MESSAGE_STATUSES.PENDING_MANAGER) {
        return res.status(409).json({
          success: false,
          message: 'Message is not pending manager approval'
        });
      }
      if (!user.department_id || user.department_id !== message.sender_department_id) {
        return res.status(403).json({
          success: false,
          message: 'Managers can reject only messages from their department'
        });
      }
    }
    // Admins can reject admin or manager pending
    if (isAdmin(user)) {
      if (![MESSAGE_STATUSES.PENDING_ADMIN, MESSAGE_STATUSES.PENDING_MANAGER].includes(message.status)) {
        return res.status(409).json({
          success: false,
          message: 'Message is not pending admin approval'
        });
      }
    }

    const result = await withTransaction(async (client) => {
      await client.query(
        `UPDATE approvals
         SET status = 'rejected',
             comments = $1,
             approved_at = NOW(),
             updated_at = NOW()
         WHERE message_id = $2 AND approver_id = $3 AND status = 'pending'`,
        [notes, id, user.id]
      );

      if (isManager(user)) {
        // Manager reject -> return to employee for revision
        await client.query(
          `UPDATE messages
           SET status = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [MESSAGE_STATUSES.RETURNED_FOR_REVISION, id]
        );
      } else if (isAdmin(user)) {
        // Admin reject -> send back to manager if exists
        const mgrRes = await client.query(
          `SELECT id FROM users WHERE role = $1 AND department_id = $2 AND is_active = TRUE LIMIT 1`,
          [ROLES.MANAGER, message.sender_department_id]
        );

        if (mgrRes.rows.length > 0) {
          const mgrId = mgrRes.rows[0].id;
          await client.query(
            `UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2`,
            [MESSAGE_STATUSES.PENDING_MANAGER, id]
          );

          // ensure manager has a pending approval
          const existing = await client.query(
            `SELECT id FROM approvals WHERE message_id = $1 AND approver_id = $2 AND status = 'pending' LIMIT 1`,
            [id, mgrId]
          );
          if (existing.rows.length === 0) {
            await client.query(
              `INSERT INTO approvals (message_id, approver_id, status, comments, created_at) VALUES ($1, $2, 'pending', NULL, NOW())`,
              [id, mgrId]
            );
          }
        } else {
          // no manager found, return to employee
          await client.query(
            `UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2`,
            [MESSAGE_STATUSES.RETURNED_FOR_REVISION, id]
          );
        }
      }

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:reject',
        entityId: id,
        description: 'Message rejected',
        metadata: { notes }
      });

      return getMessageRecord(client, id);
    });

    res.json({
      success: true,
      message: 'Message rejected',
      data: { message: result }
    });
  } catch (error) {
    console.error('Error rejecting message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to reject message',
      error: error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver_department_id, receiverDepartmentId } = req.body;
    const user = req.user;

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (
      message.status === MESSAGE_STATUSES.SENT ||
      message.status === MESSAGE_STATUSES.RECEIVED
    ) {
      return res.status(409).json({
        success: false,
        message: 'Message already sent'
      });
    }

    const ownsMessage = message.sender_id === user.id;
    const canSendAsManager =
      isManager(user) &&
      user.department_id &&
      message.sender_department_id === user.department_id;

    if (!ownsMessage && !canSendAsManager && !isAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (
      message.requires_approval &&
      message.status === MESSAGE_STATUSES.DRAFT
    ) {
      return res.status(409).json({
        success: false,
        message: 'Message must be submitted for approval before sending'
      });
    }

    if (
      message.requires_approval &&
      message.status !== MESSAGE_STATUSES.APPROVED
    ) {
      return res.status(409).json({
        success: false,
        message: 'Message must be approved before sending'
      });
    }

    const departmentRaw = receiverDepartmentId || receiver_department_id || message.receiver_department_id;
    if (!departmentRaw) {
      return res.status(400).json({
        success: false,
        message: 'Receiver department is required before sending'
      });
    }

    const departmentId = parseInt(departmentRaw, 10);

    const result = await withTransaction(async (client) => {
      const receiverDepartment = await ensureDepartmentExists(
        client,
        departmentId
      );

      await client.query(
        `UPDATE messages
         SET status = $1,
             receiver_department_id = $2,
             sent_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [MESSAGE_STATUSES.SENT, receiverDepartment.id, id]
      );

      await client.query(
        `UPDATE recipients
         SET status = $1
         WHERE message_id = $2`,
        [RECIPIENT_STATUSES.SENT, id]
      );

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:send',
        entityId: id,
        description: 'Message sent',
        metadata: { receiverDepartment: receiverDepartment.name }
      });

      return getMessageRecord(client, id);
    });

    res.json({
      success: true,
      message: 'Message sent',
      data: { message: result }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message:
        error.message === 'DEPARTMENT_NOT_FOUND'
          ? 'Receiver department not found'
          : error.message || 'Failed to send message',
      error: error.message
    });
  }
};

const receiveMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const message = await getMessageRecord(db, id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.status !== MESSAGE_STATUSES.SENT) {
      return res.status(409).json({
        success: false,
        message: 'Only sent messages can be marked as received'
      });
    }

    let canReceive = false;
    const userDepartmentId = typeof user.department_id === 'number' ? user.department_id : parseInt(user.department_id || '', 10);
    const receiverDepartmentId = typeof message.receiver_department_id === 'number'
      ? message.receiver_department_id
      : parseInt(message.receiver_department_id || '', 10);

    if (isAdmin(user)) {
      canReceive = true;
    } else if (isManager(user)) {
      if (
        userDepartmentId &&
        receiverDepartmentId &&
        userDepartmentId === receiverDepartmentId
      ) {
        canReceive = true;
      }
    } else if (isEmployee(user)) {
      if (
        userDepartmentId &&
        receiverDepartmentId &&
        userDepartmentId === receiverDepartmentId
      ) {
        canReceive = true;
      } else {
        const recipientCheck = await db.query(
          'SELECT 1 FROM recipients WHERE message_id = $1 AND recipient_id = $2',
          [id, user.id]
        );
        if (recipientCheck.rows.length > 0) {
          canReceive = true;
        }
      }
    }

    if (!canReceive) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const result = await withTransaction(async (client) => {
      await client.query(
        `UPDATE messages
         SET status = $1,
             received_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [MESSAGE_STATUSES.RECEIVED, id]
      );

      await client.query(
        `UPDATE recipients
         SET status = $1
         WHERE message_id = $2`,
        [RECIPIENT_STATUSES.DELIVERED, id]
      );

      await logAudit(client, {
        userId: user.id,
        actionType: 'message:receive',
        entityId: id,
        description: 'Message marked as received'
      });

      return getMessageRecord(client, id);
    });

    res.json({
      success: true,
      message: 'Message marked as received',
      data: { message: result }
    });
  } catch (error) {
    console.error('Error receiving message:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to receive message',
      error: error.message
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const message = await getMessageRecord(db, id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const ownsMessage = message.sender_id === user.id;
    const managerCanDelete =
      isManager(user) &&
      user.department_id &&
      message.sender_department_id === user.department_id &&
      [MESSAGE_STATUSES.DRAFT, MESSAGE_STATUSES.REJECTED].includes(
        message.status
      );

    if (!isAdmin(user) && !ownsMessage && !managerCanDelete) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (
      !isAdmin(user) &&
      ![MESSAGE_STATUSES.DRAFT, MESSAGE_STATUSES.REJECTED].includes(
        message.status
      )
    ) {
      return res.status(409).json({
        success: false,
        message: 'Only draft or rejected messages can be deleted'
      });
    }

    await withTransaction(async (client) => {
      await client.query('DELETE FROM messages WHERE id = $1', [id]);
      await logAudit(client, {
        userId: user.id,
        actionType: 'message:delete',
        entityId: id,
        description: 'Message deleted'
      });
    });

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete message',
      error: error.message
    });
  }
};

module.exports = {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  submitMessage,
  approveMessage,
  rejectMessage,
  sendMessage,
  receiveMessage,
  deleteMessage
};

