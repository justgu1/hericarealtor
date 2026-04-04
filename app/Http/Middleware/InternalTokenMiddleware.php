<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalTokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Aceita: token interno (n8n/serviços) OU usuário autenticado via sessão web
        $token = config('services.n8n.internal_token');
        $hasValidToken = !empty($token) && $request->header('X-Internal-Token') === $token;
        $isAuthenticated = auth()->check();

        if (!$hasValidToken && !$isAuthenticated) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
