<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /** Vérifie si l'origine est autorisée (localhost/127.0.0.1, tout port en dev) */
    private function isAllowedOrigin(?string $origin): bool
    {
        if (! $origin) {
            return false;
        }

        $allowed = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

        if (in_array($origin, $allowed, true)) {
            return true;
        }

        // Vite peut utiliser n'importe quel port libre (5173, 5174, 5175…)
        return (bool) preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin);
    }

    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        if ($request->isMethod('OPTIONS')) {
            $headers = [
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, Accept, X-Requested-With',
                'Access-Control-Max-Age'       => '86400',
            ];

            if ($this->isAllowedOrigin($origin)) {
                $headers['Access-Control-Allow-Origin'] = $origin;
            }

            return response('', 204)->withHeaders($headers);
        }

        $response = $next($request);

        if ($this->isAllowedOrigin($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
        }

        return $response;
    }
}
