<?php
// =====================================================
// Middleware proteksi endpoint, dengan 2 role: 'admin' dan 'user'.
// Bukan sistem login multi-akun -- cuma 2 password (1 admin, 1 staff
// bersama), yang menghasilkan token (stateless, ditandatangani pakai
// ADMIN_SECRET) yang berlaku 12 jam dan menyimpan role di dalamnya.
//
// Frontend kirim token ini lewat:
//   - header 'X-Auth-Token: <token>'  (buat request fetch biasa)
//   - query string '?auth_token=<token>'  (buat link download PDF/Excel,
//     karena window.open() gak bisa kirim header custom)
// =====================================================

function generateAuthToken(string $role): string
{
    $expiry = time() + 60 * 60 * 12; // berlaku 12 jam
    $signature = hash_hmac('sha256', $expiry . '|' . $role, ADMIN_SECRET);
    return $expiry . '.' . $role . '.' . $signature;
}

/**
 * Balikin role ('admin'/'user') kalau token valid, atau null kalau
 * gak valid/kadaluarsa.
 */
function getTokenRole(string $token): ?string
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$expiry, $role, $signature] = $parts;

    if (!ctype_digit($expiry) || (int) $expiry < time()) {
        return null; // expired atau format salah
    }
    if (!in_array($role, ['admin', 'user'], true)) {
        return null;
    }
    $expected = hash_hmac('sha256', $expiry . '|' . $role, ADMIN_SECRET);
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    return $role;
}

function getRequestToken(): string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    return $headers['X-Auth-Token'] ?? $headers['x-auth-token'] ?? ($_GET['auth_token'] ?? '');
}

/**
 * Wajibkan salah satu role di $allowedRoles. Kalau gak sesuai, langsung
 * kirim 401 dan hentikan eksekusi.
 *
 * Contoh: requireRole(['admin'])          -> cuma admin
 *         requireRole(['admin', 'user'])  -> admin ATAU staff, dua-duanya boleh
 */
function requireRole(array $allowedRoles): string
{
    $token = getRequestToken();
    $role = $token ? getTokenRole($token) : null;

    if (!$role || !in_array($role, $allowedRoles, true)) {
        http_response_code(401);
        echo json_encode(['error' => 'Sesi tidak valid atau sudah habis. Silakan login lagi.']);
        exit;
    }
    return $role;
}
