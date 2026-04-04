<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LeadNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $lead;

    /**
     * Criar uma nova instância de mensagem.
     *
     * @param Lead $lead
     * @return void
     */
    public function __construct(Lead $lead)
    {
        $this->lead = $lead;
    }

    /**
     * Construir a mensagem do e-mail.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('New Lead Receive')
                    ->view('emails.lead_notification');
    }
}
