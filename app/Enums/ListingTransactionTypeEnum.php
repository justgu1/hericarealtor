<?php

namespace App\Enums;
 
enum ListingTransactionTypeEnum:int {
    case buy = 0;
    case rent = 1;

    public static function toArray(): array
    {
        return array_map(fn($case) => ['value' => $case->value, 'label' => ucfirst(str_replace('_', ' ', $case->name))], self::cases());
    }
}