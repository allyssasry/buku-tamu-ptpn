<?php

// Force script name to /index.php so Laravel does not strip /api prefix from URLs
$_SERVER['SCRIPT_NAME'] = '/index.php';

require __DIR__ . '/../public/index.php';
