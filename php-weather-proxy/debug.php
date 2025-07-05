<?php
// Debug script to see what parameters are being received

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'GET_parameters' => $_GET,
    'proxy' => $_GET['proxy'] ?? 'MISSING',
    'path' => $_GET['path'] ?? 'MISSING',
    'all_params' => $_SERVER['QUERY_STRING']
]);
?>