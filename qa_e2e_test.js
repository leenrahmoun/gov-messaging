const baseUrl = 'http://localhost:3000/api';

const testUsers = [
    { username: 'admin1', password: '123456', role: 'admin' },
    { username: 'mgr1', password: '123456', role: 'manager' },
    { username: 'emp1', password: '123456', role: 'employee' },
    { username: 'emp2', password: '123456', role: 'employee' },
];

const results = [];
const permissionMatrix = [];
const apiLogs = [];

function logApiCall(entry) {
    apiLogs.push(entry);
    console.log(`API ${entry.method} ${entry.url} -> ${entry.status}`);
}

async function apiRequest({ method = 'GET', path, token, body }) {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const init = { method, headers };
    if (body !== undefined) {
        init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    let data;
    try {
        data = await res.json();
    } catch (err) {
        data = { parseError: err.message };
    }
    logApiCall({ method, url, status: res.status, response: data, body });
    return { status: res.status, data };
}

async function run() {
    const tokens = {};
    const userProfiles = {};

    // 1. Authentication
    for (const user of testUsers) {
        const { status, data } = await apiRequest({
            method: 'POST',
            path: '/auth/login',
            body: { username: user.username, password: user.password },
        });

        const pass = status === 200 && data?.data?.token;
        if (pass) {
            tokens[user.username] = data.data.token;
            userProfiles[user.username] = data.data.user;
        }
        results.push({
            test: `Login as ${user.username}`,
            expected: '200 OK with token',
            actual: `${status} ${data?.message || 'OK'}`,
            result: pass ? 'PASS' : 'FAIL',
        });
    }

    if (!tokens.admin1) {
        console.error('Admin login failed, aborting subsequent tests.');
        printReport();
        return;
    }

    // Helper lookups
    const adminToken = tokens.admin1;
    const managerToken = tokens.mgr1;
    const emp1Token = tokens.emp1;
    const emp2Token = tokens.emp2;

    const cleanupMessageIds = new Set();

    // Fetch user list to map IDs
    const usersResp = await apiRequest({
        method: 'GET',
        path: '/users?limit=100',
        token: adminToken,
    });
    let users = [];
    if (usersResp.status === 200) {
        users = usersResp.data?.data?.users ?? [];
    }

    const userByUsername = Object.fromEntries(
        users.map((u) => [u.username || u.email?.split('@')[0], u])
    );

    // Permission matrix tests
    await checkPermission({
        role: 'admin',
        token: adminToken,
        method: 'GET',
        path: '/users',
        allowedStatus: 200,
    });

    await checkPermission({
        role: 'manager',
        token: managerToken,
        method: 'GET',
        path: '/users',
        allowedStatus: 200,
        expectForbidden: true,
    });

    await checkPermission({
        role: 'employee',
        token: emp1Token,
        method: 'GET',
        path: '/users',
        allowedStatus: 200,
        expectForbidden: true,
    });

    // Admin POST /users (create + cleanup)
    let tempUserId = null;
    const newUserPayload = {
        username: `qa_temp_${Date.now()}`,
        email: `qa_temp_${Date.now()}@example.com`,
        password: 'changeme1',
        full_name: 'QA Temp User',
        role: 'employee',
        department: 'AdminDept',
        is_active: true,
    };
    const adminCreate = await apiRequest({
        method: 'POST',
        path: '/users',
        token: adminToken,
        body: newUserPayload,
    });
    const adminCreatePass = adminCreate.status === 201;
    if (adminCreatePass) {
        tempUserId = adminCreate.data?.data?.user?.id;
    }
    permissionMatrix.push({
        role: 'admin',
        endpoint: 'POST /users',
        status: adminCreate.status,
        allowed: adminCreatePass,
    });
    results.push({
        test: 'Admin create user',
        expected: '201 Created',
        actual: `${adminCreate.status} ${adminCreate.data?.message || ''}`,
        result: adminCreatePass ? 'PASS' : 'FAIL',
    });

    // Manager POST /users (expected forbidden)
    const managerCreate = await apiRequest({
        method: 'POST',
        path: '/users',
        token: managerToken,
        body: newUserPayload,
    });
    permissionMatrix.push({
        role: 'manager',
        endpoint: 'POST /users',
        status: managerCreate.status,
        allowed: managerCreate.status === 201,
    });
    results.push({
        test: 'Manager create user (should fail)',
        expected: '403 Forbidden',
        actual: `${managerCreate.status} ${managerCreate.data?.message || ''}`,
        result: managerCreate.status === 403 ? 'PASS' : 'FAIL',
    });

    // Employee POST /messages allowed
    const employeeCreateCheck = await apiRequest({
        method: 'POST',
        path: '/messages',
        token: emp1Token,
        body: {
            subject: 'Permission check message',
            content: 'Created for permission validation',
            priority: 'normal',
            message_type: 'internal',
            recipient_ids: [],
            recipient_emails: ['qa-temp@example.com'],
        },
    });
    permissionMatrix.push({
        role: 'employee',
        endpoint: 'POST /messages',
        status: employeeCreateCheck.status,
        allowed: employeeCreateCheck.status === 201,
    });
    results.push({
        test: 'Employee create message permission',
        expected: '201 Created',
        actual: `${employeeCreateCheck.status} ${employeeCreateCheck.data?.message || ''}`,
        result: employeeCreateCheck.status === 201 ? 'PASS' : 'FAIL',
    });
    const permissionMessageId = employeeCreateCheck.data?.data?.message?.id;
    if (permissionMessageId) {
        cleanupMessageIds.add(permissionMessageId);
    }

    // Clean up permission message
    if (permissionMessageId) {
        await apiRequest({
            method: 'DELETE',
            path: `/messages/${permissionMessageId}`,
            token: adminToken,
        });
    }

    // Delete temp user if created
    if (tempUserId) {
        await apiRequest({
            method: 'DELETE',
            path: `/users/${tempUserId}`,
            token: adminToken,
        });
    }

    // 3. Message lifecycle
    const emp1Profile = userByUsername.emp1 || users.find((u) => u.username === 'emp1');
    const emp2Profile = userByUsername.emp2 || users.find((u) => u.username === 'emp2');

    const senderDepartmentId = emp1Profile?.department_id;
    const receiverDepartmentId = emp2Profile?.department_id;

    const lifecycleCreate = await apiRequest({
        method: 'POST',
        path: '/messages',
        token: emp1Token,
        body: {
            subject: 'Test Message Approval Flow',
            content: 'Requesting document processing.',
            priority: 'normal',
            message_type: 'internal',
            recipient_ids: emp2Profile?.id ? [emp2Profile.id] : [],
            receiver_department_id: receiverDepartmentId,
        },
    });

    const messageId = lifecycleCreate.data?.data?.message?.id;
    const lifecycleResults = [];

    if (messageId) {
        cleanupMessageIds.add(messageId);
    }

    lifecycleResults.push({
        step: 'create',
        status: lifecycleCreate.data?.data?.message?.status,
        responseStatus: lifecycleCreate.status,
    });
    results.push({
        test: 'Employee creates draft message',
        expected: 'status=draft',
        actual: `status=${lifecycleCreate.data?.data?.message?.status || 'unknown'}`,
        result: lifecycleCreate.data?.data?.message?.status === 'draft' ? 'PASS' : 'FAIL',
    });

    if (!messageId) {
        console.error('Message creation failed; aborting lifecycle tests.');
        printReport();
        return;
    }

    const submitResp = await apiRequest({
        method: 'POST',
        path: `/messages/${messageId}/submit`,
        token: emp1Token,
    });
    lifecycleResults.push({ step: 'submit', status: submitResp.data?.data?.message?.status, responseStatus: submitResp.status });
    results.push({
        test: 'Employee submits message',
        expected: 'status=pending_approval',
        actual: `status=${submitResp.data?.data?.message?.status || 'unknown'}`,
        result: submitResp.data?.data?.message?.status === 'pending_approval' ? 'PASS' : 'FAIL',
    });

    const approveResp = await apiRequest({
        method: 'POST',
        path: `/messages/${messageId}/approve`,
        token: managerToken,
        body: { notes: 'Approved by manager' },
    });
    lifecycleResults.push({ step: 'approve', status: approveResp.data?.data?.message?.status, responseStatus: approveResp.status });
    results.push({
        test: 'Manager approves message',
        expected: 'status=approved',
        actual: `status=${approveResp.data?.data?.message?.status || 'unknown'}`,
        result: approveResp.data?.data?.message?.status === 'approved' ? 'PASS' : 'FAIL',
    });

    const sendResp = await apiRequest({
        method: 'POST',
        path: `/messages/${messageId}/send`,
        token: adminToken,
        body: { receiver_department_id: receiverDepartmentId },
    });
    lifecycleResults.push({ step: 'send', status: sendResp.data?.data?.message?.status, responseStatus: sendResp.status });
    results.push({
        test: 'Admin sends message',
        expected: 'status=sent',
        actual: `status=${sendResp.data?.data?.message?.status || 'unknown'}`,
        result: sendResp.data?.data?.message?.status === 'sent' ? 'PASS' : 'FAIL',
    });

    const receiveResp = await apiRequest({
        method: 'POST',
        path: `/messages/${messageId}/receive`,
        token: emp2Token,
    });
    const receiveStatusValue = receiveResp.data?.data?.message?.status;
    const receiveOk = receiveResp.status === 200 && receiveStatusValue === 'received';
    lifecycleResults.push({
        step: 'receive',
        status: receiveStatusValue,
        responseStatus: receiveResp.status,
    });
    results.push({
        test: 'Receiver acknowledges message',
        expected: 'status=received',
        actual: `status=${receiveStatusValue || 'unknown'} (HTTP ${receiveResp.status})`,
        result: receiveOk ? 'PASS' : 'FAIL',
    });

    // 4. Department routing checks
    const visibility = {};
    const visibilityChecks = [
        { label: 'admin', token: adminToken },
        { label: 'manager', token: managerToken },
        { label: 'emp1', token: emp1Token },
        { label: 'emp2', token: emp2Token },
    ];
    for (const check of visibilityChecks) {
        const resp = await apiRequest({
            method: 'GET',
            path: '/messages?limit=50',
            token: check.token,
        });
        const ids = resp.data?.data?.messages?.map((m) => m.id) || [];
        visibility[check.label] = ids;
        results.push({
            test: `Visibility check for ${check.label}`,
            expected: 'Message ID present per role rules',
            actual: ids.includes(messageId)
                ? `Message ${messageId} visible`
                : `Message ${messageId} NOT visible`,
            result: ids.includes(messageId) ? 'PASS' : check.label === 'admin' ? 'FAIL' : 'INFO',
        });
    }

    // 5. Audit log validation
    const auditResp = await apiRequest({
        method: 'GET',
        path: '/audit?limit=100',
        token: adminToken,
    });
    const auditEntries = auditResp.data?.data?.audit_logs || [];
    const messageAudit = auditEntries
        .filter((entry) => String(entry.entity_id) === String(messageId) && entry.action_type)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const expectedSequence = ['message:create', 'message:submit', 'message:approve', 'message:send', 'message:receive'];
    const actualSequence = messageAudit.map((entry) => entry.action_type);
    const sequenceSufficient = actualSequence.length >= expectedSequence.length;
    const auditPass =
        sequenceSufficient && expectedSequence.every((action, index) => actualSequence[index] === action);
    results.push({
        test: 'Audit trail sequence',
        expected: expectedSequence.join(' -> '),
        actual: actualSequence.join(' -> '),
        result: auditPass ? 'PASS' : 'FAIL',
    });

    // 6. Negative tests
    const negativeTests = [];

    // Employee tries to approve message
    const empApprove = await apiRequest({
        method: 'POST',
        path: `/messages/${messageId}/approve`,
        token: emp1Token,
        body: { notes: 'Should fail' },
    });
    negativeTests.push({
        test: 'Employee approval attempt',
        expectedStatus: 403,
        actualStatus: empApprove.status,
        pass: empApprove.status === 403,
    });
    results.push({
        test: 'Employee cannot approve message',
        expected: '403 Forbidden',
        actual: `${empApprove.status} ${empApprove.data?.message || ''}`,
        result: empApprove.status === 403 ? 'PASS' : 'FAIL',
    });

    // Manager tries to delete a user (admin1)
    const managerDelete = await apiRequest({
        method: 'DELETE',
        path: `/users/${userByUsername.admin1?.id || ''}`,
        token: managerToken,
    });
    negativeTests.push({
        test: 'Manager delete user',
        expectedStatus: 403,
        actualStatus: managerDelete.status,
        pass: managerDelete.status === 403,
    });
    results.push({
        test: 'Manager cannot delete user',
        expected: '403 Forbidden',
        actual: `${managerDelete.status} ${managerDelete.data?.message || ''}`,
        result: managerDelete.status === 403 ? 'PASS' : 'FAIL',
    });

    // Admin tries to send draft message
    const draftMessage = await apiRequest({
        method: 'POST',
        path: '/messages',
        token: emp1Token,
        body: {
            subject: 'Draft message for negative send test',
            content: 'Should not be sendable',
            priority: 'normal',
            message_type: 'internal',
            recipient_emails: ['draft-negative@example.com'],
            receiver_department_id: receiverDepartmentId,
        },
    });
    const draftMessageId = draftMessage.data?.data?.message?.id;
    if (draftMessageId) {
        cleanupMessageIds.add(draftMessageId);
    }

    const adminSendDraft = await apiRequest({
        method: 'POST',
        path: `/messages/${draftMessageId}/send`,
        token: adminToken,
        body: { receiver_department_id: receiverDepartmentId },
    });
    negativeTests.push({
        test: 'Admin send draft',
        expectedStatus: 409,
        actualStatus: adminSendDraft.status,
        pass: adminSendDraft.status === 409 || adminSendDraft.status === 400,
    });
    results.push({
        test: 'Admin cannot send draft message',
        expected: '409 Conflict or 400 Bad Request',
        actual: `${adminSendDraft.status} ${adminSendDraft.data?.message || ''}`,
        result: adminSendDraft.status === 409 || adminSendDraft.status === 400 ? 'PASS' : 'FAIL',
    });

    // Cleanup created messages
    for (const mid of cleanupMessageIds) {
        if (!mid) continue;
        await apiRequest({
            method: 'DELETE',
            path: `/messages/${mid}`,
            token: adminToken,
        });
    }

    // Summary statistics
    const totalTests = results.length;
    const passed = results.filter((r) => r.result === 'PASS').length;
    const failed = results.filter((r) => r.result === 'FAIL').length;

    const report = {
        summary: { total_tests: totalTests, passed, failed },
        permission_matrix: permissionMatrix,
        lifecycle: lifecycleResults,
        visibility,
        audit_sequence: actualSequence,
        details: results,
        negative_tests: negativeTests,
        api_logs: apiLogs,
    };

    console.log('\nFINAL REPORT');
    console.log(JSON.stringify(report, null, 2));
}

async function checkPermission({ role, token, method, path, allowedStatus, expectForbidden = false }) {
    const resp = await apiRequest({ method, path, token });
    const allowed = resp.status === allowedStatus;
    permissionMatrix.push({ role, endpoint: `${method} ${path}`, status: resp.status, allowed });
    const result = expectForbidden ? resp.status === 403 : allowed;
    results.push({
        test: `${role} ${method} ${path}`,
        expected: expectForbidden ? '403 Forbidden' : `${allowedStatus} OK`,
        actual: `${resp.status} ${resp.data?.message || ''}`,
        result: result ? 'PASS' : 'FAIL',
    });
}

function printReport() {
    const totalTests = results.length;
    const passed = results.filter((r) => r.result === 'PASS').length;
    const failed = results.filter((r) => r.result === 'FAIL').length;
    const report = {
        summary: { total_tests: totalTests, passed, failed },
        details: results,
        api_logs: apiLogs,
    };
    console.log('\nFINAL REPORT');
    console.log(JSON.stringify(report, null, 2));
}

run().catch((err) => {
    console.error('Test run failed', err);
    printReport();
});