<?php

namespace App\Enums;

enum CitiesEnum: string
{
    case boca_raton = 'boca raton';
    case miami = 'miami';
    case palm_beach = 'palm beach';
    case fort_lauderdale = 'fort lauderdale';
    case delray_beach = 'delray beach';
    public static function toArray(): array
    {
        return array_map(fn($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->name))], self::cases());
    }
}
