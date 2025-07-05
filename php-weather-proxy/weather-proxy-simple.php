<?php
/**
 * FastPlanner Weather Proxy - Simplified Version
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debug: Show what we received
$debug = [
    'received_get' => $_GET,
    'proxy' => $_GET['proxy'] ?? 'NOT_SET',
    'path' => $_GET['path'] ?? 'NOT_SET'
];

// Get parameters
$proxyService = $_GET['proxy'] ?? '';
$path = $_GET['path'] ?? '';

// Check required parameters
if (empty($proxyService)) {
    echo json_encode(['error' => 'Missing proxy parameter', 'debug' => $debug]);
    exit();
}

if (empty($path)) {
    echo json_encode(['error' => 'Missing path parameter', 'debug' => $debug]);
    exit();
}

// Define APIs
$apis = [
    'noaa' => 'https://nowcoast.noaa.gov',
    'awc' => 'https://aviationweather.gov', 
    'buoy' => 'https://www.ndbc.noaa.gov'
];

// Check service exists
if (!isset($apis[$proxyService])) {
    echo json_encode(['error' => 'Unknown proxy service: ' . $proxyService, 'debug' => $debug]);
    exit();
}

// Build URL
$baseUrl = $apis[$proxyService];
$targetUrl = $baseUrl . '/' . ltrim($path, '/');

// Add query parameters (excluding our proxy ones)
$queryParams = $_GET;
unset($queryParams['proxy']);
unset($queryParams['path']);

if (!empty($queryParams)) {
    $targetUrl .= '?' . http_build_query($queryParams);
}

// Show what we're about to request
echo json_encode([
    'success' => true,
    'proxy_service' => $proxyService,
    'target_url' => $targetUrl,
    'debug' => $debug
]);
?>