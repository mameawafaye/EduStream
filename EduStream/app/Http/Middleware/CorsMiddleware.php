<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Origines autorisées (frontend Vite)
        $allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
        ];

        $origin = $request->headers->get('Origin');

        // Répondre immédiatement aux requêtes OPTIONS (preflight)
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', in_array($origin, $allowedOrigins) ? $origin : '')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
        }

        return $response;
    }
}
