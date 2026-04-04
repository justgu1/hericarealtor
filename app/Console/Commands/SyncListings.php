<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncListings extends Command
{
    protected $signature   = 'listings:sync';
    protected $description = 'Dispara o listings-updater imediatamente via Docker service update';

    public function handle(): int
    {
        $service = env('LISTINGS_UPDATER_SERVICE', 'hericarealtor_listings-updater');

        $this->info("Forçando execução do serviço <comment>{$service}</comment>…");

        $result = shell_exec(sprintf(
            'docker service update --force %s 2>&1',
            escapeshellarg($service)
        ));

        if (str_contains((string) $result, 'updated') || str_contains((string) $result, $service)) {
            $this->info("Serviço atualizado com sucesso.");
            $this->line($result);
            return self::SUCCESS;
        }

        $this->error("Falha ao atualizar o serviço:\n{$result}");
        return self::FAILURE;
    }
}
