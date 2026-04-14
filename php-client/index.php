<?php
/**
 * PHP Client for Darija Translator REST Service
 * Demonstrates how to call the secured endpoint using Basic Authentication.
 */

// Configuration — override via environment variables in production
define('API_BASE', getenv('DARIJA_API_BASE') ?: 'http://localhost:8080/darija-translator/api/translator');
define('API_USER', getenv('DARIJA_API_USER') ?: 'translator-user');
define('API_PASS', getenv('DARIJA_API_PASS') ?: '');

function translateText(string $text, string $sourceLang = 'English'): array {
    $url = API_BASE . '/translate';

    $payload = json_encode([
        'text'           => $text,
        'sourceLanguage' => $sourceLang,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_USERPWD        => API_USER . ':' . API_PASS,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false, // disable for local dev
    ]);

    $response   = curl_exec($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError  = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['success' => false, 'error' => "cURL error: $curlError"];
    }

    $data = json_decode($response, true);
    if ($httpCode === 401) {
        return ['success' => false, 'error' => 'Authentication failed (401). Check credentials.'];
    }
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => "HTTP $httpCode: $response"];
    }
    return $data ?? ['success' => false, 'error' => 'Invalid JSON response.'];
}

function checkHealth(): bool {
    $url = API_BASE . '/health';
    $ch  = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code === 200;
}

// Determine mode: CLI or Web
$isCli = php_sapi_name() === 'cli';

if ($isCli) {
    echo "=== Darija Translator PHP Client ===\n\n";

    echo "Checking service health... ";
    echo checkHealth() ? "✓ Service is UP\n\n" : "✗ Service is DOWN\n\n";

    $samples = [
        ['text' => 'Hello, how are you?',               'lang' => 'English'],
        ['text' => 'Good morning, have a nice day!',    'lang' => 'English'],
        ['text' => 'Bonjour, comment ça va?',           'lang' => 'French'],
        ['text' => 'I love Morocco and its culture.',   'lang' => 'English'],
    ];

    foreach ($samples as $sample) {
        echo "Source [{$sample['lang']}]: {$sample['text']}\n";
        $result = translateText($sample['text'], $sample['lang']);
        if ($result['success'] ?? false) {
            echo "Darija: {$result['translatedText']}\n";
        } else {
            echo "Error: " . ($result['error'] ?? $result['errorMessage'] ?? 'Unknown') . "\n";
        }
        echo str_repeat('-', 60) . "\n";
    }
} else {
    $translatedText = null;
    $errorText      = null;
    $inputText      = '';
    $sourceLang     = 'English';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $inputText  = trim($_POST['text']   ?? '');
        $sourceLang = trim($_POST['lang']   ?? 'English');
        if ($inputText) {
            $result = translateText($inputText, $sourceLang);
            if ($result['success'] ?? false) {
                $translatedText = $result['translatedText'];
            } else {
                $errorText = $result['error'] ?? $result['errorMessage'] ?? 'Unknown error.';
            }
        }
    }

    $serviceUp = checkHealth();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Darija Translator — PHP Client</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f4f6f8; color: #1a1a2e; margin: 0; padding: 20px; }
    .container { max-width: 680px; margin: 0 auto; }
    header { background: linear-gradient(135deg,#c1272d,#006233); color:white; border-radius:12px; padding:20px 24px; margin-bottom:20px; }
    header h1 { margin:0 0 4px; } header p { margin:0; opacity:.85; font-size:.9rem; }
    .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge.up { background:#d4edda; color:#155724; } .badge.down { background:#f8d7da; color:#721c24; }
    .card { background:white; border-radius:12px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,.08); margin-bottom:16px; }
    label { display:block; font-weight:600; margin-bottom:6px; font-size:.9rem; }
    select, textarea { width:100%; padding:10px 12px; border:1.5px solid #dde1e7; border-radius:8px; font-size:.95rem; font-family:inherit; }
    textarea { min-height:110px; resize:vertical; }
    select:focus, textarea:focus { outline:none; border-color:#c1272d; }
    button[type=submit] { width:100%; padding:12px; background:linear-gradient(135deg,#c1272d,#9e1f23); color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; margin-top:12px; }
    button[type=submit]:hover { opacity:.92; }
    .result-box { background:#f8f9fa; border:1.5px solid #dde1e7; border-radius:8px; padding:14px; direction:rtl; text-align:right; font-size:1.1rem; font-family:'Traditional Arabic','Amiri',serif; line-height:1.7; }
    .error { background:#fff3f3; border-color:#f5c6cb; color:#721c24; direction:ltr; text-align:left; font-family:inherit; font-size:.9rem; }
    footer { text-align:center; color:#aaa; font-size:.8rem; margin-top:20px; }
  </style>
</head>
<body>
<div class="container">
  <header>
    <h1>🇲🇦 Darija Translator</h1>
    <p>PHP Client &nbsp;•&nbsp;
      <span class="badge <?= $serviceUp ? 'up' : 'down' ?>">
        Service <?= $serviceUp ? '● UP' : '● DOWN' ?>
      </span>
    </p>
  </header>

  <div class="card">
    <form method="POST">
      <label for="lang">Source Language</label>
      <select name="lang" id="lang">
        <option value="English"  <?= $sourceLang==='English'  ? 'selected':'' ?>>🇬🇧 English</option>
        <option value="French"   <?= $sourceLang==='French'   ? 'selected':'' ?>>🇫🇷 French</option>
        <option value="Spanish"  <?= $sourceLang==='Spanish'  ? 'selected':'' ?>>🇪🇸 Spanish</option>
        <option value="Arabic"   <?= $sourceLang==='Arabic'   ? 'selected':'' ?>>🇸🇦 Arabic (MSA)</option>
      </select>

      <br><br>
      <label for="text">Text to Translate</label>
      <textarea name="text" id="text" placeholder="Enter text here…"><?= htmlspecialchars($inputText) ?></textarea>

      <button type="submit">Translate to Darija ترجم</button>
    </form>
  </div>

  <?php if ($translatedText !== null): ?>
  <div class="card">
    <label>🇲🇦 Darija Translation</label>
    <div class="result-box"><?= htmlspecialchars($translatedText) ?></div>
  </div>
  <?php elseif ($errorText !== null): ?>
  <div class="card">
    <div class="result-box error">⚠️ <?= htmlspecialchars($errorText) ?></div>
  </div>
  <?php endif; ?>

  <footer>Darija Translator PHP Client • Mini Project 2</footer>
</div>
</body>
</html>
<?php } ?>
