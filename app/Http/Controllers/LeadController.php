<?php

namespace App\Http\Controllers;

use App\Enums\LeadFormsEnum;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Mail\LeadNotification;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Inertia\Inertia;

class LeadController extends Controller
{

    public function index(Request $request)
    {
        $search = $request->query('s', '');

        $query = Lead::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $leads = $query->with('attributes')->latest()->paginate(10);

        return Inertia::render("Admin/Leads/index", [
            'leads' => [
                'items' => $leads->items(),
                'pagination' => [
                    'current_page' => $leads->currentPage(),
                    'last_page' => $leads->lastPage(),
                    'total' => $leads->total(),
                    'per_page' => $leads->perPage(),
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'message' => 'required|string',
                'form' => 'required|string',
                'attributes' => 'nullable|array',
                'attributes.*.label' => 'required|string',
                'attributes.*.value' => ['required', function ($attribute, $value, $fail) {
                    if (!is_string($value) && !is_numeric($value) && !is_array($value)) {
                        $fail("The {$attribute} must be a string, number or array.");
                    }
                }],

            ]);
            $lead = Lead::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'message' => $validated['message'],
                'form' => $validated['form'],
            ]);

            if (isset($validated['attributes'])) {
                foreach ($validated['attributes'] as $attribute) {
                    $value = $attribute['value'];

                    $lead->attributes()->create([
                        'label' => $attribute['label'],
                        'value' => is_array($value) ? json_encode($value) : $value,
                    ]);
                }
            }

            $herica = User::findOrFail(4);
            Mail::to('support@inovacore.cloud')
                ->bcc($herica->email)
                ->send(new LeadNotification($lead));
            return;
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()])->withInput();
        }
    }
}
