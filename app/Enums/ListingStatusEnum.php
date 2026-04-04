<?php

namespace App\Enums;

enum ListingStatusEnum: int
{
    case active = 0;
    case coming_soon = 1;
    case contingent = 2;
    case pending = 3;
    case sold = 4;

    public static function toArray(): array
    {
        return array_map(fn($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->name))], self::cases());
    }
}
