<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    /**
     * Dispara o job de sincronização de listings.
     * Chamado pelo n8n via webhook interno.
     */
    public function listingsSync(): JsonResponse
    {
        // Roda de forma assíncrona (não bloqueia o request)
        dispatch(function () {
            Artisan::call('listings:sync');
        });

        return response()->json([
            'status' => 200,
            'message' => 'listings:sync agendado para execução',
        ]);
    }

    /**
     * Importa/normaliza listings do zillow_listings para a tabela listings.
     * Chamado pelo listings-updater após scraping via webhook interno.
     */
    public function listingsImport(): JsonResponse
    {
        dispatch(function () {
            Artisan::call('listings:import');
        });

        return response()->json([
            'status' => 200,
            'message' => 'listings:import agendado para execução',
        ]);
    }

    /**
     * Verifica se os listings estão atualizados e dispara sync se necessário.
     * Usado pelo N8N como health-check a cada 10 minutos.
     *
     * Retorna JSON com:
     *  - status: "fresh" | "stale" | "empty"
     *  - triggered: bool (true se disparou sync)
     *  - last_updated_at: ISO timestamp da última atualização
     *  - counts: { for_sale, for_rent, sold, total }
     *  - stale_threshold_hours: limiar configurado
     */
    public function listingsCheck(): JsonResponse
    {
        $thresholdHours = (int) config('listings.stale_threshold_hours', env('LISTINGS_STALE_THRESHOLD_HOURS', 12));

        $counts = DB::table('listings')
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN transaction_type = 'for_sale' THEN 1 ELSE 0 END) as for_sale,
                SUM(CASE WHEN transaction_type = 'for_rent' THEN 1 ELSE 0 END) as for_rent,
                SUM(CASE WHEN transaction_type = 'sold'     THEN 1 ELSE 0 END) as sold,
                MAX(updated_at) as last_updated_at
            ")
            ->first();

        if (!$counts || !$counts->last_updated_at) {
            return response()->json([
                'status'               => 'empty',
                'triggered'            => false,
                'last_updated_at'      => null,
                'counts'               => ['for_sale' => 0, 'for_rent' => 0, 'sold' => 0, 'total' => 0],
                'stale_threshold_hours' => $thresholdHours,
                'message'              => 'Nenhum listing encontrado na base.',
            ]);
        }

        $lastUpdated = \Carbon\Carbon::parse($counts->last_updated_at);
        $isStale     = $lastUpdated->diffInHours(now()) >= $thresholdHours;
        $triggered   = false;

        if ($isStale) {
            dispatch(function () {
                Artisan::call('listings:sync');
            });
            $triggered = true;
        }

        return response()->json([
            'status'               => $isStale ? 'stale' : 'fresh',
            'triggered'            => $triggered,
            'last_updated_at'      => $lastUpdated->toIso8601String(),
            'counts'               => [
                'for_sale' => (int) $counts->for_sale,
                'for_rent' => (int) $counts->for_rent,
                'sold'     => (int) $counts->sold,
                'total'    => (int) $counts->total,
            ],
            'stale_threshold_hours' => $thresholdHours,
        ]);
    }
}
