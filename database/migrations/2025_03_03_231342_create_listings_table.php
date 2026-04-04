<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->string('mls')->nullable();
            $table->string('address');
            $table->string('city')->nullable();;
            $table->longText('description');
            $table->string('style')->nullable();
            $table->string('data_source')->nullable();
            $table->float('sqr_footage');
            $table->decimal('price', 20, 2);
            $table->float('tax')->nullable();
            $table->integer('bedrooms')->default(0);
            $table->integer('bathrooms')->default(0);
            $table->integer('half_bathrooms')->default(0);
            $table->tinyInteger('status')->default(0)->comment('Enum ListingStatus');
            $table->tinyInteger('type')->default(0)->comment('Enum ListingsTypes');
            $table->tinyInteger('transaction_type')->default(0)->comment('Enum ListingTransactionType');
            $table->timestamp('built_date')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
