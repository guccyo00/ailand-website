<?php
declare(strict_types=1);

// No submitted values are written to application files, logs, or sessions.
ini_set('display_errors', '0');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");

function fail(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    $safe = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>お問い合わせの送信について | 合同会社 愛らんど</title>'
        . '<style>body{font-family:sans-serif;line-height:1.9;max-width:42em;margin:4em auto;padding:0 1.5em;color:#333}a{color:#00655e}</style>'
        . '<main><h1>お問い合わせを送信できませんでした</h1><p>' . $safe . '</p>'
        . '<p><a href="/contact.html">入力画面に戻る</a></p>'
        . '<p>お急ぎの場合は、お電話でご連絡ください。<br><a href="tel:0980437117">0980-43-7117</a></p></main></html>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'このページはフォームからの送信専用です。入力画面からお問い合わせください。');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) {
    fail(413, '入力内容が長すぎます。文字数を減らして、もう一度お試しください。');
}

// Static contact.html: require an exact HTTPS same-site Referer, plus Origin when supplied.
function sameSite(string $url): bool
{
    $parts = parse_url($url);
    return is_array($parts)
        && ($parts['scheme'] ?? '') === 'https'
        && strtolower($parts['host'] ?? '') === 'ailand-happy.jp'
        && (!isset($parts['port']) || $parts['port'] === 443)
        && !isset($parts['user']) && !isset($parts['pass']);
}
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if (!sameSite($referer)
    || !in_array(parse_url($referer, PHP_URL_PATH), ['/contact.html', '/'], true)
    || (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== 'https://ailand-happy.jp')) {
    fail(403, '送信元を確認できませんでした。公式サイトの入力画面から送信してください。');
}

if (!extension_loaded('mbstring') || !function_exists('mb_send_mail')) {
    fail(503, '現在フォームを利用できません。お手数ですが、お電話でお問い合わせください。');
}

$limits = ['category' => 30, 'relation' => 30, 'name' => 100, 'kana' => 100,
    'email' => 254, 'tel' => 30, 'message' => 2000, 'privacy_consent' => 3, 'website' => 200];
$data = [];
foreach ($limits as $key => $limit) {
    $value = $_POST[$key] ?? '';
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')
        || mb_strlen($value, 'UTF-8') > $limit
        || ($key !== 'message' && preg_match('/[\x00-\x1F\x7F]/', $value))
        || ($key === 'message' && preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value))) {
        fail(422, '入力内容の形式または文字数をご確認ください。本文は2000文字以内で入力してください。');
    }
    $data[$key] = trim($value);
}
if ($data['website'] !== '') {
    fail(422, '送信内容を確認できませんでした。入力画面からもう一度お試しください。');
}
foreach (['category', 'name', 'kana', 'email', 'tel', 'message'] as $key) {
    if ($data[$key] === '' || preg_match('/\A[\s\x{3000}]*\z/u', $data[$key])) {
        fail(422, '未入力の必須項目があります。入力画面で内容をご確認ください。');
    }
}
$categories = ['サービスについて', '入居・見学について', '採用について', 'その他'];
$relations = ['', 'ご本人', 'ご家族', 'ケアマネジャー', '医療・福祉関係者', '求職者', 'その他'];
if (!in_array($data['category'], $categories, true)
    || !in_array($data['relation'], $relations, true)
    || $data['privacy_consent'] !== 'on') {
    fail(422, 'お問い合わせ項目と個人情報の取り扱いへの同意をご確認ください。');
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    fail(422, 'メールアドレスの形式をご確認ください。');
}
if (!preg_match('/\A[0-9+() -]{6,30}\z/', $data['tel']) || !preg_match('/[0-9]/', $data['tel'])) {
    fail(422, '電話番号は半角数字とハイフンなどで入力してください。');
}

// Session contains only last-success time, never form fields or client IP addresses.
ini_set('session.use_strict_mode', '1');
session_name('ailand_contact');
session_cache_limiter('');
session_set_cookie_params(['lifetime' => 0, 'path' => '/contact.php',
    'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
if (!session_start()) {
    fail(503, '現在フォームを利用できません。時間をおいて再度お試しください。');
}
if (isset($_SESSION['last_success']) && time() - (int) $_SESSION['last_success'] < 60) {
    session_write_close();
    header('Retry-After: 60');
    fail(429, '連続送信を防ぐため、1分ほど待ってから再度お試しください。');
}

mb_language('Japanese');
mb_internal_encoding('UTF-8');
$subject = '【愛らんど公式サイト】新しいお問い合わせ（' . $data['category'] . '）';
$body = "公式サイトからお問い合わせを受け付けました。\n\n"
    . 'お問い合わせ項目：' . $data['category'] . "\n"
    . 'ご相談者様：' . ($data['relation'] ?: '未選択') . "\n"
    . 'お名前：' . $data['name'] . "\n"
    . 'フリガナ：' . $data['kana'] . "\n"
    . 'メールアドレス：' . $data['email'] . "\n"
    . '電話番号：' . $data['tel'] . "\n"
    . "個人情報の取り扱い：同意済み\n\nお問い合わせ内容：\n"
    . str_replace(["\r\n", "\r"], "\n", $data['message']) . "\n";
$headers = "From: no-reply@ailand-happy.jp\r\nReply-To: " . $data['email'];
// All recipients, sender, and envelope parameters are fixed; user text stays in the body.
set_error_handler(static function (): bool { return true; });
try {
    $sent = mb_send_mail('ailand.gyou@gmail.com', $subject, $body, $headers, '-fno-reply@ailand-happy.jp');
} catch (Throwable $error) {
    $sent = false;
} finally {
    restore_error_handler();
}
if (!$sent) {
    session_write_close();
    fail(503, 'メールを送信できませんでした。時間をおいて再度お試しいただくか、お電話でお問い合わせください。');
}
$_SESSION['last_success'] = time();
session_write_close();
header('Location: https://ailand-happy.jp/thanks.html', true, 303);
exit;
