<?php
/**
 * NOAA Weather Proxy - Mimics Vite /api/noaa/ proxy
 * Handles requests like: /api/noaa/geoserver/observations/satellite/ows?SERVICE=WMS...
 */

// Enable CORS for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the path after /api/noaa/
$requestUri = $_SERVER['REQUEST_URI'];

// Extract path from URI - everything after /api/noaa/
$pattern = '/\/api\/noaa\/(.+?)(?:\?|$)/';
if (preg_match($pattern, $requestUri, $matches)) {
    $path = $matches[1];
} else {
    // Fallback: use PATH_INFO if available
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    $path = ltrim($pathInfo, '/');
}

// Build target URL
$baseUrl = 'https://nowcoast.noaa.gov';
$targetUrl = $baseUrl . '/' . $path;

// Add query string if present (but make sure we don't duplicate it)
if (!empty($_SERVER['QUERY_STRING'])) {
    // Remove any path that might be in the query string
    $queryString = $_SERVER['QUERY_STRING'];
    $targetUrl .= '?' . $queryString;
}

error_log("NOAA Proxy: $requestUri -> $targetUrl");

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_USERAGENT, 'FastPlanner-Weather-Proxy/1.0');

// Set headers to capture response headers
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    
    if (count($header) < 2) return $len;
    
    $headerName = strtolower(trim($header[0]));
    $headerValue = trim($header[1]);
    
    // Forward important headers (but not CORS - we set our own)
    if (in_array($headerName, ['content-type', 'content-length', 'cache-control'])) {
        header($headerName . ': ' . $headerValue);
    }
    
    return $len;
});

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle errors
if ($response === false || !empty($error)) {
    http_response_code(500);
    echo json_encode(['error' => 'Request failed: ' . $error]);
    exit();
}

// Set response code and output
http_response_code($httpCode);
echo $response;
?>