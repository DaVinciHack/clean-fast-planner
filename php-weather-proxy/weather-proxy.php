<?php
/**
 * FastPlanner Weather Proxy - PHP Version
 * Simple PHP proxy for weather APIs that works with basic web hosting
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

// Get the proxy service and path from URL parameters
$proxyService = $_GET['proxy'] ?? '';  // Changed from 'service' to 'proxy'
$path = $_GET['path'] ?? '';

// Debug output for troubleshooting
error_log("Weather Proxy Debug: proxy=" . $proxyService . ", path=" . $path);

if (empty($proxyService) || empty($path)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing proxy or path parameter',
        'debug' => [
            'proxy' => $proxyService,
            'path' => $path,
            'all_get' => $_GET
        ]
    ]);
    exit();
}

// Define API base URLs
$apis = [
    'noaa' => 'https://nowcoast.noaa.gov',
    'awc' => 'https://aviationweather.gov',
    'buoy' => 'https://www.ndbc.noaa.gov'
];

if (!isset($apis[$proxyService])) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown proxy service: ' . $proxyService]);
    exit();
}

// Build the target URL
$baseUrl = $apis[$proxyService];
$targetUrl = $baseUrl . '/' . ltrim($path, '/');

// Add any additional query parameters
$queryParams = $_GET;
unset($queryParams['proxy']);  // Remove our proxy parameter
unset($queryParams['path']);   // Remove our path parameter

if (!empty($queryParams)) {
    $targetUrl .= '?' . http_build_query($queryParams);
}

// Log the request
error_log("Weather Proxy: $proxyService -> $targetUrl");

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