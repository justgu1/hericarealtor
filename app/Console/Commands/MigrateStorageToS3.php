<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Finder\Finder;

class MigrateStorageToS3 extends Command
{
    protected $signature = 'storage:to-s3
                            {--dry-run : Lista os arquivos sem fazer upload}
                            {--force : Sobrescreve arquivos já existentes no bucket}
                            {--path=public : Pasta dentro de storage/app/ a migrar}';

    protected $description = 'Migra arquivos de storage/app/public para o bucket MinIO (S3)';

    public function handle(): int
    {
        $sourcePath = $this->option('path');
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info("Iniciando migração: storage/app/{$sourcePath} → S3");

        if ($dryRun) {
            $this->warn('Modo dry-run ativado — nenhum arquivo será enviado.');
        }

        $disk = Storage::disk('local');
        $s3 = Storage::disk('s3');

        $files = $disk->allFiles($sourcePath);

        if (empty($files)) {
            $this->warn("Nenhum arquivo encontrado em storage/app/{$sourcePath}");
            return self::SUCCESS;
        }

        $this->info(sprintf('Encontrados %d arquivo(s) para migrar.', count($files)));

        $bar = $this->output->createProgressBar(count($files));
        $bar->start();

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($files as $file) {
            // Remove o prefixo 'public/' para o path no S3
            $s3Path = Str::after($file, $sourcePath . '/');

            try {
                if (!$force && $s3->exists($s3Path)) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                if (!$dryRun) {
                    $content = $disk->get($file);
                    $mimeType = $disk->mimeType($file) ?: 'application/octet-stream';

                    $s3->put($s3Path, $content, [
                        'ContentType' => $mimeType,
                        'visibility' => 'public',
                    ]);
                }

                $migrated++;
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Falha ao migrar {$file}: {$e->getMessage()}");
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Status', 'Quantidade'],
            [
                ['✓ Migrados', $migrated],
                ['⏭ Pulados (já existem)', $skipped],
                ['✗ Falhas', $failed],
            ]
        );

        if ($failed > 0) {
            $this->error('Migração concluída com erros.');
            return self::FAILURE;
        }

        $action = $dryRun ? 'listados (dry-run)' : 'migrados';
        $this->info("Migração concluída: {$migrated} arquivo(s) {$action}.");

        return self::SUCCESS;
    }
}
