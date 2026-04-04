<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JobController;

/*
|--------------------------------------------------------------------------
| Internal API Routes
|--------------------------------------------------------------------------
| Acessível por:
|   1. n8n via X-Internal-Token (interno ao cluster)
|   2. Usuários autenticados via sessão web (dona do sistema)
|
| Bloqueado externamente pelo nginx ingress (server-snippet deny /api/jobs/)
*/

Route::middleware(['web', 'internal.token'])->group(function () {
    Route::post('/jobs/listings-sync',   [JobController::class, 'listingsSync']);
    Route::post('/jobs/listings-import', [JobController::class, 'listingsImport']);
    Route::get('/jobs/listings-check',   [JobController::class, 'listingsCheck']);
    Route::post('/jobs/listings-check',  [JobController::class, 'listingsCheck']);
});
