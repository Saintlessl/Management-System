<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')->where(
                    'conversation_id',
                    $this->route('conversation')?->id,
                ),
            ],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $body = $this->input('body');
            $files = $this->file('attachments');

            if (empty($body) && empty($files)) {
                $validator->errors()->add('body', 'Pesan harus memiliki konten atau lampiran.');
            }
        });
    }
}
